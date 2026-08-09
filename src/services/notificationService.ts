import { apiClient } from '../api/apiClient';

export type NotificationChannel = 'sms' | 'mail' | 'push';

export type NotificationPreference = {
  id: number;
  user_id: number;
  channel: NotificationChannel;
  scope: string;
  subscribed: boolean;
};

export type PushDevice = {
  id: number;
  user_id: number;
  token: string;
  device_id?: string | null;
  last_used_at?: string | null;
};

export const notificationService = {
  setPreference: (payload: { channel: NotificationChannel; scope: string; subscribed: boolean }) => apiClient<NotificationPreference>('/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  registerDevice: (payload: { token: string; device_id?: string | null }) => apiClient<PushDevice>('/push-devices', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  removeDevice: (deviceId: number) => apiClient<void>(`/push-devices/${deviceId}`, { method: 'DELETE' }),
};
