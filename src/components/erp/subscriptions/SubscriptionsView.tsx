import { Edit3, Filter, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, SectionCard, StatusBadge, SuccessMessage, Textarea } from '../../primitives';
import { erpApiService, type ApiSubscription, type ApiSubscriptionUser } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';
import { Can } from '../../Can';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../api/apiClient';

type SubscriptionForm = {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration_days: string;
  max_users: string;
  is_active: boolean;
};

type SubscriptionsViewProps = {
  openOnMount?: boolean;
};

const emptyForm: SubscriptionForm = {
  name: '',
  description: '',
  price: '',
  currency: 'EUR',
  duration_days: '',
  max_users: '',
  is_active: true,
};

function optionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildPayload(form: SubscriptionForm) {
  return {
    name: form.name,
    description: form.description || null,
    price: Number(form.price) || 0,
    currency: form.currency.trim().toUpperCase() || 'EUR',
    duration_days: optionalNumber(form.duration_days),
    max_users: optionalNumber(form.max_users),
    is_active: form.is_active,
  };
}

function formFromSubscription(subscription: ApiSubscription): SubscriptionForm {
  return {
    name: subscription.name ?? '',
    description: subscription.description ?? '',
    price: String(subscription.price ?? ''),
    currency: subscription.currency ?? 'EUR',
    duration_days: subscription.duration_days ? String(subscription.duration_days) : '',
    max_users: subscription.max_users ? String(subscription.max_users) : '',
    is_active: Boolean(subscription.is_active),
  };
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function userName(user: ApiSubscriptionUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
}

export function SubscriptionsView({ openOnMount = false }: SubscriptionsViewProps = {}) {
  const { t } = useTranslation();
  const { hasAnyRight } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const membersMatch = location.pathname.match(/^\/erp\/subscriptions\/(\d+)\/members$/);
  const membersSubscriptionId = membersMatch ? Number(membersMatch[1]) : null;
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [subscriptionMembers, setSubscriptionMembers] = useState<ApiSubscriptionUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<ApiSubscription | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [selectedSubscription, setSelectedSubscription] = useState<ApiSubscription | null>(null);
  const [subscriptionUsersLoading, setSubscriptionUsersLoading] = useState(false);

  const loadSubscriptionUsers = useCallback(async (subscriptionId: number) => {
    setSubscriptionUsersLoading(true);
    try {
      const data = await erpApiService.get<ApiSubscription>('subscriptions', subscriptionId);
      setSubscriptionMembers(data.users ?? []);
    } catch {
      setSubscriptionMembers([]);
    } finally {
      setSubscriptionUsersLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async (search: string, limit: number, active: typeof activeFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await erpApiService.list<ApiSubscription>('subscriptions', {
        search,
        per_page: limit,
        is_active: active === 'all' ? undefined : active === 'active' ? '1' : '0',
      });
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subscriptions.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(() => fetchSubscriptions(searchTerm, perPage, activeFilter), [activeFilter, fetchSubscriptions, perPage, searchTerm]);

  useEffect(() => {
    void fetchSubscriptions('', 15, 'all');
  }, [fetchSubscriptions]);

  useEffect(() => {
    if ((openOnMount || location.pathname === '/erp/subscriptions/new') && hasAnyRight(['subscriptions.create', 'subscriptions.manage'])) {
      setEditing(null);
      setForm(emptyForm);
      setFormOpen(true);
    }
  }, [hasAnyRight, location.pathname, openOnMount]);

  useEffect(() => {
    if (!selectedSubscription) return;
    void loadSubscriptionUsers(selectedSubscription.id);
  }, [loadSubscriptionUsers, selectedSubscription]);

  useEffect(() => {
    if (!membersSubscriptionId) return;
    setSelectedSubscription((prev) => (prev?.id === membersSubscriptionId ? prev : null));

    const loadSubscriptionForMembersPage = async () => {
      setSubscriptionUsersLoading(true);
      try {
        const subscription = await erpApiService.get<ApiSubscription>('subscriptions', membersSubscriptionId);
        setSelectedSubscription(subscription);
        setSubscriptionMembers(subscription.users ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('subscriptions.loadOneError'));
      } finally {
        setSubscriptionUsersLoading(false);
      }
    };

    void loadSubscriptionForMembersPage();
  }, [membersSubscriptionId]);

  const usersForSelectedSubscription = useMemo(() => {
    return subscriptionMembers;
  }, [subscriptionMembers]);

  const resetFilters = () => {
    setSearchTerm('');
    setPerPage(15);
    setActiveFilter('all');
    void fetchSubscriptions('', 15, 'all');
  };

  const startCreate = () => {
    if (!hasAnyRight(['subscriptions.create', 'subscriptions.manage'])) return;
    setEditing(null);
    setForm(emptyForm);
    setSuccess('');
    setFormOpen(true);
    if (location.pathname !== '/erp/subscriptions/new') {
      navigate('/erp/subscriptions/new');
    }
  };

  const startEdit = (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.update', 'subscriptions.manage'])) return;
    setEditing(subscription);
    setForm(formFromSubscription(subscription));
    setSuccess('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setSuccess('');
    if (location.pathname !== '/erp/subscriptions') {
      navigate('/erp/subscriptions');
    }
  };

  const saveSubscription = async () => {
    if (editing && !hasAnyRight(['subscriptions.update', 'subscriptions.manage'])) return;
    if (!editing && !hasAnyRight(['subscriptions.create', 'subscriptions.manage'])) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let savedSubscription: ApiSubscription;
      if (editing) {
        savedSubscription = await erpApiService.update<ApiSubscription>('subscriptions', editing.id, buildPayload(form));
      } else {
        savedSubscription = await erpApiService.create<ApiSubscription>('subscriptions', buildPayload(form));
      }
      setEditing(savedSubscription);
      setForm(formFromSubscription(savedSubscription));
      setSuccess(t('common.saved'));
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subscriptions.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const deleteSubscription = async (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.delete', 'subscriptions.manage'])) return;
    if (!window.confirm(t('subscriptions.deleteConfirm', { name: subscription.name }))) return;
    setError('');
    try {
      await erpApiService.remove('subscriptions', subscription.id);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subscriptions.deleteError'));
    }
  };

  const restoreSubscription = async (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.restore', 'subscriptions.manage'])) return;
    setError('');
    try {
      await apiClient<ApiSubscription>(`/subscriptions/${subscription.id}/restore`, { method: 'POST' });
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subscriptions.restoreError'));
    }
  };

  const openUsersPanel = (subscription: ApiSubscription) => {
    setSelectedSubscription(subscription);
    navigate(`/erp/subscriptions/${subscription.id}/members`);
  };

  const closeUsersPanel = () => {
    setSelectedSubscription(null);
    navigate('/erp/subscriptions');
  };

  if (!hasAnyRight(['subscriptions.view', 'subscriptions.manage'])) {
    return <SectionCard title={t('subscriptions.title')}><p className="text-sm text-slate-600">{t('subscriptions.missingViewRight')}</p></SectionCard>;
  }

  if (formOpen) {
    return (
      <PageShell
        title={editing ? t('subscriptions.edit') : t('subscriptions.add')}
        subtitle={t('subscriptions.formSubtitle')}
        backLabel={t('subscriptions.backToList')}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        {success ? <SuccessMessage>{success}</SuccessMessage> : null}
        <SectionCard
          title={editing ? t('subscriptions.editCardTitle', { id: editing.id }) : t('subscriptions.add')}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label={t('subscriptions.name')} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enterprise" />
            <Input label={t('subscriptions.price')} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="99.99" />
            <Input label={t('subscriptions.currency')} maxLength={3} value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} placeholder="EUR" />
            <Input label={t('subscriptions.durationDays')} type="number" min="1" value={form.duration_days} onChange={(event) => setForm((prev) => ({ ...prev, duration_days: event.target.value }))} placeholder="365" />
            <Input label={t('subscriptions.maxUsers')} type="number" min="1" value={form.max_users} onChange={(event) => setForm((prev) => ({ ...prev, max_users: event.target.value }))} placeholder="25" />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
              {t('subscriptions.activeSubscription')}
            </label>
            <div className="md:col-span-2">
              <Textarea label={t('subscriptions.description')} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Enterprise subscription" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
            <Can anyOf={editing ? ['subscriptions.update', 'subscriptions.manage'] : ['subscriptions.create', 'subscriptions.manage']}>
              <button onClick={() => void saveSubscription()} disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="mr-2 inline h-4 w-4" />{saving ? t('common.saving') : t('subscriptions.save')}
              </button>
            </Can>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  if (membersSubscriptionId) {
    return (
      <PageShell
        title={selectedSubscription ? t('subscriptions.membersFor', { name: selectedSubscription.name }) : t('subscriptions.subscriptionMembers')}
        subtitle={t('subscriptions.membersSubtitle')}
        backLabel={t('subscriptions.backToList')}
        onBack={closeUsersPanel}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={t('subscriptions.subscriptionMembers')}
          action={
            <button onClick={closeUsersPanel} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {subscriptionUsersLoading ? t('subscriptions.loadingMembers') : t('subscriptions.showingMembers', { count: usersForSelectedSubscription.length })}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">{t('payments.member')}</th>
                  <th className="pb-3 font-semibold">{t('users.contact')}</th>
                  <th className="pb-3 font-semibold">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {usersForSelectedSubscription.length > 0 ? usersForSelectedSubscription.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 align-top">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{userName(user)}</p>
                      <p className="text-xs text-slate-500">#{user.id}</p>
                    </td>
                    <td className="py-4 text-slate-600">
                      <p>{user.email}</p>
                      <p className="text-xs text-slate-500">{user.phone || '-'}</p>
                    </td>
                    <td className="py-4"><StatusBadge status={user.active ? t('users.statusActive') : t('users.statusInactive')} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-slate-500">
                      {subscriptionUsersLoading ? t('subscriptions.loadingMembersShort') : t('subscriptions.noMembers')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t('subscriptions.managementTitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <Filter className="mr-2 inline h-4 w-4" />{t('users.resetFilters')}
            </button>
            <button onClick={() => void loadSubscriptions()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />{t('common.refresh')}
            </button>
            <Can anyOf={['subscriptions.create', 'subscriptions.manage']}>
              <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                <Plus className="mr-2 inline h-4 w-4" />{t('subscriptions.add')}
              </button>
            </Can>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_150px_150px_auto]">
          <Input
            label={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadSubscriptions();
            }}
            placeholder={t('subscriptions.searchPlaceholder')}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{t('common.status')}</span>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option value="all">{t('common.all')}</option>
              <option value="active">{t('subscriptions.active')}</option>
              <option value="inactive">{t('subscriptions.inactive')}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.perPage')}</span>
            <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => void loadSubscriptions()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{t('common.search')}</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('subscriptions.showingCount', { count: subscriptions.length })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">{t('subscriptions.subscription')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.price')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.limits')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.members')}</th>
                <th className="pb-3 font-semibold">{t('common.status')}</th>
                <th className="pb-3 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b border-slate-100 align-top">
                  <td className="max-w-[320px] py-4">
                    <p className="font-semibold text-slate-900">{subscription.name}</p>
                    <p className="text-xs text-slate-500">#{subscription.id} - {t('branches.updated')} {formatDate(subscription.updated_at)}</p>
                    <p className="mt-1 text-sm text-slate-600">{subscription.description || '-'}</p>
                  </td>
                  <td className="py-4 font-semibold text-slate-900">{subscription.price} {subscription.currency}</td>
                  <td className="py-4 text-slate-600">
                    <p>{t('subscriptions.duration')}: {subscription.duration_days ? t('subscriptions.days', { count: subscription.duration_days }) : t('subscriptions.noAutoExpiry')}</p>
                    <p>{t('branches.users')}: {subscription.max_users ?? '-'}</p>
                  </td>
                  <td className="py-4 text-slate-600">{subscription.users_count ?? subscription.users?.length ?? '-'}</td>
                  <td className="py-4"><StatusBadge status={subscription.is_active ? t('users.statusActive') : t('users.statusInactive')} /></td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openUsersPanel(subscription)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {t('subscriptions.members')}
                      </button>
                      {subscription.deleted_at ? (
                        <Can anyOf={['subscriptions.restore', 'subscriptions.manage']}>
                          <button onClick={() => void restoreSubscription(subscription)} className="inline-flex items-center rounded-2xl border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                            <RefreshCw className="mr-2 h-4 w-4" />{t('common.restore')}
                          </button>
                        </Can>
                      ) : (
                        <>
                          <Can anyOf={['subscriptions.update', 'subscriptions.manage']}>
                            <button onClick={() => startEdit(subscription)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Edit3 className="mr-2 h-4 w-4" />{t('common.edit')}
                            </button>
                          </Can>
                          <Can anyOf={['subscriptions.delete', 'subscriptions.manage']}>
                            <button onClick={() => void deleteSubscription(subscription)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                            </button>
                          </Can>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">{loading ? t('subscriptions.loadingList') : t('subscriptions.empty')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

    </div>
  );
}
