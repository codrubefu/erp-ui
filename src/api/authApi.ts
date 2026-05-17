import { apiClient } from './apiClient';
import type { AuthenticatedUser } from '../services/ErpApiService';

type MeResponse = AuthenticatedUser | {
  user?: AuthenticatedUser;
};

export function getAuthenticatedUser() {
  return apiClient<MeResponse>('/me').then((payload) => {
    if (payload && typeof payload === 'object' && 'user' in payload && payload.user) {
      return payload.user;
    }
    return payload as AuthenticatedUser;
  });
}
