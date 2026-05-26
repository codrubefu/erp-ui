export type ApiUser = {
  id: number;
  user_code?: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  active: boolean;
  email: string;
  email_verified_at?: string | null;
  groups?: ApiGroup[];
  locations?: ApiLocation[];
  subscriptions?: ApiUserSubscription[];
  active_subscriptions?: ApiUserSubscription[];
  subscription_history?: ApiUserSubscriptionHistory[];
  has_active_subscription?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiGroup = {
  id: number;
  name: string;
  label: string;
  description: string | null;
  rights?: ApiRight[];
  users_count?: number;
};

export type ApiRight = {
  id: number;
  name: string;
  label: string;
  description: string | null;
  groups_count?: number;
};

export type ApiLocation = {
  id: number;
  name: string;
  description: string | null;
  users_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiUserSubscription = {
  id: number;
  name: string;
  description?: string | null;
  price?: string | number;
  currency?: string;
  duration_days?: number | null;
  max_users?: number | null;
  is_active?: boolean;
  start_date?: string | null;
  expires_at?: string | null;
  pivot?: ApiUserSubscriptionPivot;
};

export type ApiUserSubscriptionAssignment = {
  id: number;
  start_date?: string;
};

export type ApiUserSubscriptionPivot = {
  id?: number | null;
  user_id?: number;
  subscription_id?: number;
  start_date?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiUserSubscriptionHistory = {
  id: number | null;
  subscription_id: number;
  name: string;
  start_date: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type ApiSubscriptionUser = {
  id: number;
  user_code?: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  active: boolean;
  email: string;
};

export type ApiSubscription = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  duration_days: number | null;
  max_users: number | null;
  is_active: boolean;
  users?: ApiSubscriptionUser[];
  users_count?: number;
  start_date?: string | null;
  expires_at?: string | null;
  pivot?: ApiUserSubscriptionPivot;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type AuthenticatedUser = ApiUser | {
  id?: number;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type ApiEnvelope<T> = {
  data?: T;
  user?: T;
  token?: string;
  access_token?: string;
  bearer_token?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

export type ApiPaginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type LoginResult = {
  token: string;
  user: AuthenticatedUser | null;
};

export const API_BASE_URL = import.meta.env.VITE_ERP_API_URL ?? 'http://localhost:8099/api';
export const TOKEN_KEY = 'master-erp-api-token';

function joinUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function extractError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const body = payload as ApiEnvelope<unknown>;
    if (body.message) return body.message;
    if (body.errors) {
      const first = Object.values(body.errors)[0]?.[0];
      if (first) return first;
    }
  }
  return fallback;
}

function unwrap<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function unwrapUser(payload: AuthenticatedUser | ApiEnvelope<AuthenticatedUser>): AuthenticatedUser {
  if (payload && typeof payload === 'object' && 'user' in payload && payload.user) {
    return payload.user;
  }
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
    return payload.data;
  }
  return payload as AuthenticatedUser;
}

export class ErpApiService {
  getToken() {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    window.localStorage.removeItem(TOKEN_KEY);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(joinUrl(path), {
      ...options,
      headers,
    });

    const text = await response.text();
    const isJson = response.headers.get('Content-Type')?.includes('application/json');
    const payload = text && isJson ? JSON.parse(text) : null;

    if (!response.ok) {
      if (response.status === 401) this.clearToken();
      throw new Error(extractError(payload, `Cererea a esuat (${response.status}).`));
    }

    return unwrap<T>(payload as T | ApiEnvelope<T>);
  }

  async login(email: string, password: string, organizationId: string | number): Promise<LoginResult> {
    const payload = await this.request<ApiEnvelope<AuthenticatedUser> & Record<string, unknown>>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, organization_id: organizationId }),
    });

    const data = payload.data as (AuthenticatedUser & { token?: string }) | undefined;
    const userPayload = payload.user as (AuthenticatedUser & { token?: string }) | undefined;
    const token = String(payload.token ?? payload.access_token ?? payload.bearer_token ?? data?.token ?? userPayload?.token ?? '');
    if (!token) {
      throw new Error('Raspunsul de login nu contine bearer token.');
    }

    this.setToken(token);
    let user: AuthenticatedUser | null = null;
    try {
      user = await this.me();
    } catch {
      user = (payload.user as AuthenticatedUser | undefined) ?? (payload.data as AuthenticatedUser | undefined) ?? null;
    }

    return { token, user };
  }

  async me() {
    const payload = await this.request<AuthenticatedUser | ApiEnvelope<AuthenticatedUser>>('/me');
    return unwrapUser(payload);
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async list<T>(resource: string, params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return this.request<T[]>(`/${resource}${query.size ? `?${query.toString()}` : ''}`);
  }

  async searchUsersByCode(search: string, page = 1, perPage = 15) {
    const query = new URLSearchParams();
    query.set('search', search);
    query.set('per_page', String(perPage));
    query.set('page', String(page));
    return this.request<ApiUser[] | ApiPaginated<ApiUser>>(`/users/search/user-code?${query.toString()}`);
  }

  async get<T>(resource: string, id: number) {
    return this.request<T>(`/${resource}/${id}`);
  }

  async create<T>(resource: string, data: Record<string, unknown>) {
    return this.request<T>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(resource: string, id: number, data: Record<string, unknown>) {
    return this.request<T>(`/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async remove(resource: string, id: number) {
    await this.request(`/${resource}/${id}`, { method: 'DELETE' });
  }
}

export const erpApiService = new ErpApiService();
