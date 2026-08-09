import { CalendarDays, KeyRound, Mail, Phone, UserCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError } from '../../../api/apiClient';
import {
  getAuthenticatedUserCustomFields,
  getAuthenticatedUserEvents,
  getAuthenticatedUserSubscriptions,
  updateAuthenticatedUserPassword,
  type AuthenticatedUserEvent,
} from '../../../api/authApi';
import { useAuth } from '../../../context/useAuth';
import type { ApiCustomFieldValue, ApiPaginated, ApiSubscription } from '../../../services/ErpApiService';
import { Alert, Input, SectionCard, StatusBadge } from '../../primitives';
import { PrivacyPanel } from './PrivacyPanel';

type PasswordForm = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const initialPasswordForm: PasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

function userDisplayName(user: ReturnType<typeof useAuth>['user'], fallback: string) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user && 'name' in user && user.name) return user.name;
  return user?.email || fallback;
}

function unwrapList<T>(payload: ApiPaginated<T> | T[]) {
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function subscriptionStatus(subscription: ApiSubscription) {
  return subscription.status ?? subscription.pivot?.status ?? (subscription.is_currently_active ?? subscription.is_active ? 'active' : 'expired');
}

function subscriptionAccesses(subscription: ApiSubscription) {
  const used = subscription.accesses_used ?? subscription.pivot?.accesses_used ?? 0;
  return subscription.max_accesses ? `${used} / ${subscription.max_accesses}` : '-';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'boolean') return value ? 'Da' : 'Nu';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function customFieldRowsFromValues(source?: Record<string, unknown> | ApiCustomFieldValue[]) {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source.map((entry: ApiCustomFieldValue, index) => ({
      key: String(entry.custom_field_id ?? entry.field_id ?? entry.slug ?? index),
      label: entry.custom_field?.name ?? entry.slug ?? `#${entry.custom_field_id ?? entry.field_id ?? index + 1}`,
      value: formatValue(entry.value),
    }));
  }
  return Object.entries(source).map(([key, value]) => ({ key, label: key, value: formatValue(value) }));
}

function userCustomFieldRows(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return [];
  const customFieldValues = 'custom_field_values' in user ? user.custom_field_values : undefined;
  const customFields = 'custom_fields' in user ? user.custom_fields : undefined;
  return customFieldRowsFromValues(customFieldValues ?? customFields);
}

function eventTitle(event: AuthenticatedUserEvent) {
  return event.title || event.name || event.event?.title || event.event?.name || `#${event.id}`;
}

function eventStart(event: AuthenticatedUserEvent) {
  return event.starts_at || event.start_at || event.start_time || null;
}

function eventEnd(event: AuthenticatedUserEvent) {
  return event.ends_at || event.end_at || event.end_time || null;
}

export function ProfileInfoPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fallbackRows = useMemo(() => userCustomFieldRows(user), [user]);
  const [customFieldValues, setCustomFieldValues] = useState<ApiCustomFieldValue[]>([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);
  const [customFieldsLoaded, setCustomFieldsLoaded] = useState(false);
  const [customFieldsError, setCustomFieldsError] = useState('');
  const rows = useMemo(() => {
    const endpointRows = customFieldRowsFromValues(customFieldValues);
    return customFieldsLoaded ? endpointRows : fallbackRows;
  }, [customFieldValues, customFieldsLoaded, fallbackRows]);
  const groups = user && 'groups' in user && Array.isArray(user.groups) ? user.groups : [];
  const locations = user && 'locations' in user && Array.isArray(user.locations) ? user.locations : [];
  const displayName = userDisplayName(user, t('profile.unknownUser'));
  const phone = user && 'phone' in user ? user.phone : null;

  const loadCustomFields = useCallback(async () => {
    setCustomFieldsLoading(true);
    setCustomFieldsError('');
    try {
      setCustomFieldValues(await getAuthenticatedUserCustomFields());
      setCustomFieldsLoaded(true);
    } catch (err) {
      setCustomFieldsError(err instanceof Error ? err.message : t('profile.customFieldsLoadError'));
    } finally {
      setCustomFieldsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCustomFields();
  }, [loadCustomFields]);

  return (
    <div className="space-y-6">
      <SectionCard title={t('profile.infoTitle')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-violet-100 p-3 text-violet-700"><UserCircle className="h-6 w-6" /></span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">{displayName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-violet-600" />{user?.email ?? '-'}</p>
            <p className="mt-2 flex items-center gap-2"><Phone className="h-4 w-4 text-violet-600" />{phone || '-'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">{t('profile.groups')}</p>
            <div className="flex flex-wrap gap-2">
              {groups.length ? groups.map((group) => <span key={group.id} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{group.label || group.name}</span>) : <span className="text-sm text-slate-500">-</span>}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">{t('profile.locations')}</p>
            <div className="flex flex-wrap gap-2">
              {locations.length ? locations.map((location) => <span key={location.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{location.name}</span>) : <span className="text-sm text-slate-500">-</span>}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('profile.customFields')} action={<button onClick={() => void loadCustomFields()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t('common.refresh')}</button>}>
        {customFieldsError ? <Alert tone="error" className="mb-4">{customFieldsError}</Alert> : null}
        {rows.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rows.map((row) => (
              <div key={row.key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{row.label}</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{customFieldsLoading ? t('common.loading') : t('profile.noCustomFields')}</p>
        )}
      </SectionCard>
    </div>
  );
}

export function ProfileSecurityPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<PasswordForm>(initialPasswordForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (field: keyof PasswordForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const submit = async () => {
    if (!form.current_password.trim() || !form.password || !form.password_confirmation) {
      setError(t('profile.passwordRequired'));
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateAuthenticatedUserPassword(form);
      setForm(initialPasswordForm);
      setSuccess(t('profile.passwordUpdated'));
    } catch (err) {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : t('profile.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t('profile.securityTitle')}>
      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        <Input label={t('profile.currentPassword')} type="password" value={form.current_password} onChange={(event) => setField('current_password', event.target.value)} />
        <Input label={t('profile.newPassword')} type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} />
        <Input label={t('profile.confirmPassword')} type="password" value={form.password_confirmation} onChange={(event) => setField('password_confirmation', event.target.value)} />
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          <KeyRound className="h-4 w-4" />
          {loading ? t('common.saving') : t('profile.savePassword')}
        </button>
      </form>
    </SectionCard>
  );
}

export function ProfilePrivacyPage() {
  return <PrivacyPanel />;
}

export function ProfileEventsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AuthenticatedUserEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEvents(unwrapList(await getAuthenticatedUserEvents()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.eventsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <SectionCard title={t('profile.eventsTitle')} action={<button onClick={() => void loadEvents()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t('common.refresh')}</button>}>
      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">{t('profile.event')}</th>
              <th className="pb-3 font-semibold">{t('profile.startsAt')}</th>
              <th className="pb-3 font-semibold">{t('profile.endsAt')}</th>
              <th className="pb-3 font-semibold">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {events.length ? events.map((event) => (
              <tr key={event.id} className="border-b border-slate-100">
                <td className="py-4 font-semibold text-slate-900"><CalendarDays className="mr-2 inline h-4 w-4 text-violet-600" />{eventTitle(event)}</td>
                <td className="py-4 text-slate-600">{formatDate(eventStart(event))}</td>
                <td className="py-4 text-slate-600">{formatDate(eventEnd(event))}</td>
                <td className="py-4">{event.status ? <StatusBadge status={event.status} /> : '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-500">{loading ? t('common.loading') : t('profile.noEvents')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function ProfileSubscriptionsPage() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSubscriptions(unwrapList(await getAuthenticatedUserSubscriptions()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.subscriptionsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  return (
    <SectionCard title={t('profile.subscriptionsTitle')} action={<button onClick={() => void loadSubscriptions()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t('common.refresh')}</button>}>
      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">{t('subscriptions.subscription')}</th>
              <th className="pb-3 font-semibold">{t('subscriptions.price')}</th>
              <th className="pb-3 font-semibold">{t('subscriptions.duration')}</th>
              <th className="pb-3 font-semibold">{t('users.startDate')}</th>
              <th className="pb-3 font-semibold">{t('users.expires')}</th>
              <th className="pb-3 font-semibold">{t('subscriptions.accesses')}</th>
              <th className="pb-3 font-semibold">{t('subscriptions.resumeAt')}</th>
              <th className="pb-3 font-semibold">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length ? subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b border-slate-100 align-top">
                <td className="max-w-[360px] py-4">
                  <p className="font-semibold text-slate-900">{subscription.name}</p>
                  <p className="mt-1 text-xs text-slate-500">#{subscription.id}</p>
                  <p className="mt-1 text-sm text-slate-600">{subscription.description || '-'}</p>
                </td>
                <td className="py-4 font-semibold text-slate-900">{subscription.price} {subscription.currency}</td>
                <td className="py-4 text-slate-600">{subscription.duration_days ? t('subscriptions.days', { count: subscription.duration_days }) : t('subscriptions.noAutoExpiry')}</td>
                <td className="py-4 text-slate-600">{formatDate(subscription.start_date ?? subscription.pivot?.start_date)}</td>
                <td className="py-4 text-slate-600">{formatDate(subscription.expires_at ?? subscription.pivot?.expires_at)}</td>
                <td className="py-4 text-slate-600">{subscriptionAccesses(subscription)}</td>
                <td className="py-4 text-slate-600">{formatDate(subscription.resume_at ?? subscription.pivot?.resume_at)}</td>
                <td className="py-4">
                  <StatusBadge status={t(`subscriptions.assignmentStatuses.${subscriptionStatus(subscription)}`)} />
                  {subscription.status_reason ?? subscription.pivot?.status_reason ? <p className="mt-1 text-xs text-slate-500">{subscription.status_reason ?? subscription.pivot?.status_reason}</p> : null}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-slate-500">{loading ? t('common.loading') : t('profile.noSubscriptions')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
