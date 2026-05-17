import { API_BASE_URL, erpApiService, TOKEN_KEY } from '../services/ErpApiService';

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  data?: T;
  user?: T;
  message?: string;
  errors?: Record<string, string[]>;
};

function endpoint(path: string) {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const body = payload as ApiEnvelope<unknown>;
    if (body.message) return body.message;
    const first = body.errors ? Object.values(body.errors)[0]?.[0] : '';
    if (first) return first;
  }
  return fallback;
}

function unwrap<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  if (payload && typeof payload === 'object' && 'user' in payload) {
    return (payload as ApiEnvelope<T>).user as T;
  }
  return payload as T;
}

export async function apiClient<T>(path: string, options: RequestInit = {}) {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(endpoint(path), { ...options, headers });
  } catch {
    throw new ApiClientError('Nu se poate conecta la API. Verifica daca serverul Laravel ruleaza.', 0);
  }

  const text = await response.text();
  const isJson = response.headers.get('Content-Type')?.includes('application/json');
  const payload = text && isJson ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) erpApiService.clearToken();
    throw new ApiClientError(errorMessage(payload, `Cererea a esuat (${response.status}).`), response.status);
  }

  return unwrap<T>(payload as T | ApiEnvelope<T>);
}
