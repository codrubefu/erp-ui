import { TOKEN_KEY, apiHeaders, clearApiToken, endpoint, extractErrorMessage, parseJsonResponse, unwrapApiPayload, type ApiEnvelope } from '../api/apiCore';

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
  custom_fields?: Record<string, unknown> | ApiCustomFieldValue[];
  custom_field_values?: Record<string, unknown> | ApiCustomFieldValue[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiCustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'email' | 'phone' | 'select' | 'multi_select' | 'checkbox' | 'boolean' | 'file';

export type ApiCustomFieldOption = {
  label: string;
  value: string;
};

export type ApiCustomField = {
  id: number;
  entity_type: string;
  name: string;
  slug: string;
  type: ApiCustomFieldType;
  options?: { choices?: ApiCustomFieldOption[] } | null;
  validation_rules?: string[] | null;
  is_required?: boolean;
  sort_order?: number;
};

export type ApiCustomFieldValue = {
  custom_field_id?: number;
  field_id?: number;
  custom_field?: ApiCustomField;
  slug?: string;
  value?: unknown;
};

export type ApiCustomFieldValues = Record<string, unknown> | ApiCustomFieldValue[];

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
  location_group_id?: number | null;
  location_group?: ApiLocationGroup | null;
  users_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiLocationGroup = {
  id: number;
  name: string;
  description: string | null;
  locations?: ApiLocation[];
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
  subscription_user_id?: number | null;
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

export type ApiPayment = {
  id: number;
  user_id?: number | null;
  user?: ApiUser | ApiSubscriptionUser | null;
  first_name: string;
  last_name: string;
  payment_type_id: 1 | 2 | 3;
  payment_type?: 'cash' | 'card' | 'bank_transfer';
  model_type: 'subscription_user' | 'event_occurrence_user';
  model_id?: number | null;
  subscription_id: number | null;
  subscription?: ApiSubscription | ApiUserSubscription | null;
  amount: string;
  paid_at: string | null;
  admin_id?: number | null;
  admin?: AuthenticatedUser | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AuthenticatedUser = ApiUser | {
  id?: number;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
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

export { API_BASE_URL, TOKEN_KEY, getApiBaseUrl } from '../api/apiCore';

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
    clearApiToken();
  }

  private async requestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = apiHeaders(options);

    const response = await fetch(endpoint(path), {
      ...options,
      headers,
    });

    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      if (response.status === 401) this.clearToken();
      throw new Error(extractErrorMessage(payload, `Cererea a esuat (${response.status}).`));
    }

    return payload as T;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    return unwrapApiPayload<T>(await this.requestRaw<T | ApiEnvelope<T>>(path, options));
  }

  async login(email: string, password: string, organizationId: string | number): Promise<LoginResult> {
    const payload = await this.requestRaw<ApiEnvelope<AuthenticatedUser> & Record<string, unknown>>('/login', {
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

  async listPaginated<T>(resource: string, params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const payload = await this.requestRaw<ApiPaginated<T> | T[]>(`/${resource}${query.size ? `?${query.toString()}` : ''}`);
    return Array.isArray(payload)
      ? { data: payload, current_page: 1, last_page: 1, per_page: payload.length, total: payload.length }
      : payload;
  }

  async searchUsersByCode(search: string, page = 1, perPage = 15) {
    const query = new URLSearchParams();
    query.set('search', search);
    query.set('per_page', String(perPage));
    query.set('page', String(page));
    const payload = await this.requestRaw<ApiUser[] | ApiPaginated<ApiUser>>(`/users/search/user-code?${query.toString()}`);
    return Array.isArray(payload)
      ? { data: payload, current_page: page, last_page: 1, per_page: perPage, total: payload.length }
      : payload;
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

  async attachPaymentModel<T>(paymentId: number, data: { model_type: ApiPayment['model_type']; model_id: number }) {
    return this.request<T>(`/payments/${paymentId}/attach-model`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async saveEntityCustomFieldValues<T>(entityType: string, entityId: number, values: Record<string, unknown>) {
    return this.request<T>(`/${entityType}/${entityId}/custom-field-values`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }

  async getEntityCustomFieldValues(entityType: string, entityId: number) {
    return this.request<ApiCustomFieldValues>(`/${entityType}/${entityId}/custom-field-values`);
  }

  async remove(resource: string, id: number) {
    await this.request(`/${resource}/${id}`, { method: 'DELETE' });
  }
}

export const erpApiService = new ErpApiService();
