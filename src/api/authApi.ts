import { apiClient } from './apiClient';
import type { ApiCustomFieldValue, ApiPaginated, ApiSubscription, AuthenticatedUser } from '../services/ErpApiService';

type MeResponse = AuthenticatedUser | {
  user?: AuthenticatedUser;
};

export type UpdateAuthenticatedUserPasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export function getAuthenticatedUser() {
  return apiClient<MeResponse>('/me').then((payload) => {
    if (payload && typeof payload === 'object' && 'user' in payload && payload.user) {
      return payload.user;
    }
    return payload as AuthenticatedUser;
  });
}

export function updateAuthenticatedUserPassword(payload: UpdateAuthenticatedUserPasswordPayload) {
  return apiClient('/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export type AuthenticatedUserEvent = {
  id: number;
  event_id?: number;
  title?: string;
  name?: string;
  starts_at?: string | null;
  start_at?: string | null;
  start_time?: string | null;
  ends_at?: string | null;
  end_at?: string | null;
  end_time?: string | null;
  status?: string | null;
  event?: {
    title?: string;
    name?: string;
  } | null;
};

export function getAuthenticatedUserEvents() {
  return apiClient<ApiPaginated<AuthenticatedUserEvent> | AuthenticatedUserEvent[]>('/me/events');
}

export function getAuthenticatedUserSubscriptions() {
  return apiClient<ApiPaginated<ApiSubscription> | ApiSubscription[]>('/me/subscriptions');
}

export function getAuthenticatedUserCustomFields() {
  return apiClient<ApiCustomFieldValue[]>('/me/custom-fields');
}
