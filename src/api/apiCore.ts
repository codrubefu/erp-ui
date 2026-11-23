import { getRuntimeConfig } from '../config/runtimeConfig';
import i18n from '../i18n';

export const API_BASE_URL = '/api';
export const TOKEN_KEY = 'master-erp-api-token';

export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  user?: T;
  token?: string;
  access_token?: string;
  bearer_token?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

export function endpoint(path: string) {
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function getApiBaseUrl() {
  return getRuntimeConfig().apiBaseUrl || API_BASE_URL;
}

export function clearApiToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function apiHeaders(options: RequestInit = {}) {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

type SessionExpiredListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();
let sessionCheck: Promise<boolean> | null = null;

export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function authorizationHeader() {
  return apiHeaders().get('Authorization');
}

async function isSessionRejected() {
  try {
    const response = await fetch(endpoint('/me'), { headers: apiHeaders() });
    return response.status === 401 || response.status === 403;
  } catch {
    return false; // API unreachable: says nothing about the session
  }
}

// The API answers 401 without a valid session, but 403 also when a logged-in user
// lacks a right. A 403 therefore only ends the session if /me is refused as well.
async function handleAuthFailure(status: number, usedAuthorization: string | null) {
  if (status === 403 && usedAuthorization) {
    sessionCheck ??= isSessionRejected().finally(() => {
      sessionCheck = null;
    });
    if (!(await sessionCheck)) return;
  }

  // A late answer for a previous token must not end a newer session.
  if (authorizationHeader() !== usedAuthorization) return;
  clearApiToken();
  sessionExpiredListeners.forEach((listener) => listener());
}

/** fetch() for API calls: adds the API headers and reports a lost session. */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = apiHeaders(options);
  const response = await fetch(url, { ...options, headers });
  // On /login a 401 means wrong credentials.
  if ((response.status === 401 || response.status === 403) && url !== endpoint('/login')) {
    void handleAuthFailure(response.status, headers.get('Authorization'));
  }
  return response;
}

export function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const body = payload as ApiEnvelope<unknown>;
    if (body.message) return translateApiError(body.message);
    const first = body.errors ? Object.values(body.errors)[0]?.[0] : '';
    if (first) return translateApiError(first);
  }
  return fallback;
}

function translateApiError(message: string) {
  const deleteBlockedMatch = message.match(/^Cannot delete (.+) because it still has related (.+)\.$/);
  if (deleteBlockedMatch) {
    return i18n.t('apiErrors.deleteBlockedByRelated', {
      model: deleteBlockedMatch[1],
      relation: deleteBlockedMatch[2],
    });
  }

  const translationKey = `apiErrors.${message}`;
  return i18n.exists(translationKey) ? i18n.t(translationKey) : message;
}

export function unwrapApiPayload<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  if (payload && typeof payload === 'object' && 'user' in payload) {
    return (payload as ApiEnvelope<T>).user as T;
  }
  return payload as T;
}

export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  const isJson = response.headers.get('Content-Type')?.includes('application/json');
  return text && isJson ? JSON.parse(text) : null;
}
