import { apiClient } from '../api/apiClient';
import type { ApiSubscriptionAssignment } from './ErpApiService';

export type SuspendSubscriptionAssignmentPayload = {
  reason: string;
  resume_at?: string | null;
};

export const subscriptionLifecycleService = {
  activate: (assignmentId: number, paymentId?: number | null) => apiClient<ApiSubscriptionAssignment>(`/subscription-assignments/${assignmentId}/activate`, {
    method: 'POST',
    body: JSON.stringify(paymentId ? { payment_id: paymentId } : {}),
  }),
  suspend: (assignmentId: number, payload: SuspendSubscriptionAssignmentPayload) => apiClient<ApiSubscriptionAssignment>(`/subscription-assignments/${assignmentId}/suspend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  resume: (assignmentId: number) => apiClient<ApiSubscriptionAssignment>(`/subscription-assignments/${assignmentId}/resume`, { method: 'POST' }),
  consume: (assignmentId: number) => apiClient<ApiSubscriptionAssignment>(`/subscription-assignments/${assignmentId}/consume`, { method: 'POST' }),
};
