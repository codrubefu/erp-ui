import { Edit3, Filter, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, SectionCard, Select, StatusBadge, Textarea } from '../../primitives';
import { erpApiService, type ApiSubscription, type ApiSubscriptionUser, type ApiUser } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';
import { Can } from '../../Can';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../api/apiClient';

type SubscriptionForm = {
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_interval: 'monthly' | 'yearly';
  duration_days: string;
  trial_days: string;
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
  billing_interval: 'monthly',
  duration_days: '',
  trial_days: '0',
  max_users: '',
  is_active: true,
};

function optionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function zeroNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function buildPayload(form: SubscriptionForm) {
  return {
    name: form.name,
    description: form.description || null,
    price: Number(form.price) || 0,
    currency: form.currency.trim().toUpperCase() || 'EUR',
    billing_interval: form.billing_interval,
    duration_days: optionalNumber(form.duration_days),
    trial_days: zeroNumber(form.trial_days),
    max_users: optionalNumber(form.max_users),
    is_active: form.is_active,
  };
}

function formFromSubscription(subscription: ApiSubscription): SubscriptionForm {
  return {
    name: subscription.name ?? '',
    description: subscription.description ?? '',
    price: subscription.price ?? '',
    currency: subscription.currency ?? 'EUR',
    billing_interval: subscription.billing_interval ?? 'monthly',
    duration_days: subscription.duration_days ? String(subscription.duration_days) : '',
    trial_days: String(subscription.trial_days ?? 0),
    max_users: subscription.max_users ? String(subscription.max_users) : '',
    is_active: Boolean(subscription.is_active),
  };
}

function intervalLabel(value: ApiSubscription['billing_interval']) {
  return value === 'yearly' ? 'anual' : 'lunar';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function userName(user: ApiUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
}

function subscriptionUserIds(user: ApiUser) {
  return user.subscriptions?.map((subscription) => subscription.id).filter(Boolean) ?? [];
}

export function SubscriptionsView({ openOnMount = false }: SubscriptionsViewProps = {}) {
  const { hasAnyRight } = useAuth();
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [subscriptionMembers, setSubscriptionMembers] = useState<ApiSubscriptionUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ApiSubscription | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [selectedSubscription, setSelectedSubscription] = useState<ApiSubscription | null>(null);
  const [subscriptionUsersLoading, setSubscriptionUsersLoading] = useState(false);
  const [assignableUsersLoading, setAssignableUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadAssignableUsers = useCallback(async () => {
    setAssignableUsersLoading(true);
    try {
      const data = await erpApiService.list<ApiUser>('clients', { per_page: 250 });
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setAssignableUsersLoading(false);
    }
  }, []);

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
      setError(err instanceof Error ? err.message : 'Nu am putut incarca abonamentele.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(() => fetchSubscriptions(searchTerm, perPage, activeFilter), [activeFilter, fetchSubscriptions, perPage, searchTerm]);

  useEffect(() => {
    void fetchSubscriptions('', 15, 'all');
  }, [fetchSubscriptions]);

  useEffect(() => {
    if (openOnMount && hasAnyRight(['subscriptions.create', 'subscriptions.manage'])) setFormOpen(true);
  }, [hasAnyRight, openOnMount]);

  useEffect(() => {
    if (!selectedSubscription) return;
    void loadSubscriptionUsers(selectedSubscription.id);
  }, [loadSubscriptionUsers, selectedSubscription]);

  const usersForSelectedSubscription = useMemo(() => {
    return subscriptionMembers;
  }, [subscriptionMembers]);

  const availableUsersForSelectedSubscription = useMemo(() => {
    if (!selectedSubscription) return [];
    return users.filter((user) => !subscriptionUserIds(user).includes(selectedSubscription.id));
  }, [selectedSubscription, users]);

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
    setFormOpen(true);
  };

  const startEdit = (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.update', 'subscriptions.manage'])) return;
    setEditing(subscription);
    setForm(formFromSubscription(subscription));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveSubscription = async () => {
    if (editing && !hasAnyRight(['subscriptions.update', 'subscriptions.manage'])) return;
    if (!editing && !hasAnyRight(['subscriptions.create', 'subscriptions.manage'])) return;
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await erpApiService.update<ApiSubscription>('subscriptions', editing.id, buildPayload(form));
      } else {
        await erpApiService.create<ApiSubscription>('subscriptions', buildPayload(form));
      }
      closeForm();
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut salva abonamentul.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSubscription = async (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.delete', 'subscriptions.manage'])) return;
    if (!window.confirm(`Stergi abonamentul ${subscription.name}?`)) return;
    setError('');
    try {
      await erpApiService.remove('subscriptions', subscription.id);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut sterge abonamentul.');
    }
  };

  const restoreSubscription = async (subscription: ApiSubscription) => {
    if (!hasAnyRight(['subscriptions.restore', 'subscriptions.manage'])) return;
    setError('');
    try {
      await apiClient<ApiSubscription>(`/subscriptions/${subscription.id}/restore`, { method: 'POST' });
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut restaura abonamentul.');
    }
  };

  const openUsersPanel = (subscription: ApiSubscription) => {
    setSelectedSubscription(subscription);
    setSelectedUserId('');
  };

  const closeUsersPanel = () => {
    setSelectedSubscription(null);
    setSelectedUserId('');
  };

  const attachUserToSubscription = async () => {
    if (!selectedSubscription || !selectedUserId) return;

    const user = users.find((item) => item.id === Number(selectedUserId));
    if (!user) return;

    setSaving(true);
    setError('');
    try {
      const nextSubscriptionIds = Array.from(new Set([...subscriptionUserIds(user), selectedSubscription.id]));
      await erpApiService.update<ApiUser>('users/subscription', user.id, {
        subscription_ids: nextSubscriptionIds,
      });
      setSelectedUserId('');
      await loadSubscriptionUsers(selectedSubscription.id);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut adauga utilizatorul la abonament.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignableUsersFocus = () => {
    if (users.length > 0 || assignableUsersLoading) return;
    void loadAssignableUsers();
  };

  if (!hasAnyRight(['subscriptions.view', 'subscriptions.manage'])) {
    return <SectionCard title="Abonamente"><p className="text-sm text-slate-600">Nu ai dreptul subscriptions.view.</p></SectionCard>;
  }

  if (formOpen) {
    return (
      <PageShell
        title={editing ? 'Editare abonament' : 'Adaugare abonament'}
        subtitle="Formularul de abonament este afisat separat, fara lista din fundal."
        backLabel="Inapoi la abonamente"
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={editing ? `Editare abonament #${editing.id}` : 'Adaugare abonament'}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />Inchide
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Nume" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enterprise" />
            <Input label="Pret" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="99.99" />
            <Input label="Moneda" maxLength={3} value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} placeholder="EUR" />
            <Select label="Interval facturare" value={form.billing_interval} onChange={(event) => setForm((prev) => ({ ...prev, billing_interval: event.target.value as SubscriptionForm['billing_interval'] }))}>
              <option value="monthly">Lunar</option>
              <option value="yearly">Anual</option>
            </Select>
            <Input label="Durata in zile" type="number" min="1" value={form.duration_days} onChange={(event) => setForm((prev) => ({ ...prev, duration_days: event.target.value }))} placeholder="365" />
            <Input label="Zile trial" type="number" min="0" value={form.trial_days} onChange={(event) => setForm((prev) => ({ ...prev, trial_days: event.target.value }))} placeholder="14" />
            <Input label="Numar maxim utilizatori" type="number" min="1" value={form.max_users} onChange={(event) => setForm((prev) => ({ ...prev, max_users: event.target.value }))} placeholder="25" />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
              Abonament activ
            </label>
            <div className="md:col-span-2">
              <Textarea label="Descriere" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Enterprise subscription" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anuleaza</button>
            <Can anyOf={editing ? ['subscriptions.update', 'subscriptions.manage'] : ['subscriptions.create', 'subscriptions.manage']}>
              <button onClick={() => void saveSubscription()} disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="mr-2 inline h-4 w-4" />{saving ? 'Se salveaza...' : 'Salveaza abonament'}
              </button>
            </Can>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Management abonamente"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <Filter className="mr-2 inline h-4 w-4" />Reseteaza filtre
            </button>
            <button onClick={() => void loadSubscriptions()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />Refresh
            </button>
            <Can anyOf={['subscriptions.create', 'subscriptions.manage']}>
              <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                <Plus className="mr-2 inline h-4 w-4" />Adauga abonament
              </button>
            </Can>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_150px_150px_auto]">
          <Input
            label="Cautare"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadSubscriptions();
            }}
            placeholder="Cauta dupa nume sau descriere"
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option value="all">Toate</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Pe pagina</span>
            <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => void loadSubscriptions()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Cauta</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Afisare <span className="font-semibold text-slate-900">{subscriptions.length}</span> abonamente din API
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Abonament</th>
                <th className="pb-3 font-semibold">Pret</th>
                <th className="pb-3 font-semibold">Interval</th>
                <th className="pb-3 font-semibold">Limite</th>
                <th className="pb-3 font-semibold">Membri</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b border-slate-100 align-top">
                  <td className="max-w-[320px] py-4">
                    <p className="font-semibold text-slate-900">{subscription.name}</p>
                    <p className="text-xs text-slate-500">#{subscription.id} - Actualizat {formatDate(subscription.updated_at)}</p>
                    <p className="mt-1 text-sm text-slate-600">{subscription.description || '-'}</p>
                  </td>
                  <td className="py-4 font-semibold text-slate-900">{subscription.price} {subscription.currency}</td>
                  <td className="py-4 text-slate-600">{intervalLabel(subscription.billing_interval)}</td>
                  <td className="py-4 text-slate-600">
                    <p>Durata: {subscription.duration_days ? `${subscription.duration_days} zile` : '-'}</p>
                    <p>Trial: {subscription.trial_days ?? 0} zile</p>
                    <p>Utilizatori: {subscription.max_users ?? '-'}</p>
                  </td>
                  <td className="py-4 text-slate-600">{subscription.users_count ?? subscription.users?.length ?? '-'}</td>
                  <td className="py-4"><StatusBadge status={subscription.is_active ? 'Activ' : 'Inactiv'} /></td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openUsersPanel(subscription)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Membri
                      </button>
                      {subscription.deleted_at ? (
                        <Can anyOf={['subscriptions.restore', 'subscriptions.manage']}>
                          <button onClick={() => void restoreSubscription(subscription)} className="inline-flex items-center rounded-2xl border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                            <RefreshCw className="mr-2 h-4 w-4" />Restore
                          </button>
                        </Can>
                      ) : (
                        <>
                          <Can anyOf={['subscriptions.update', 'subscriptions.manage']}>
                            <button onClick={() => startEdit(subscription)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Edit3 className="mr-2 h-4 w-4" />Editeaza
                            </button>
                          </Can>
                          <Can anyOf={['subscriptions.delete', 'subscriptions.manage']}>
                            <button onClick={() => void deleteSubscription(subscription)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />Sterge
                            </button>
                          </Can>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">{loading ? 'Se incarca abonamentele...' : 'Nu exista abonamente pentru filtrul curent.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selectedSubscription ? (
        <SectionCard
          title={`Membri pentru ${selectedSubscription.name}`}
          action={
            <button onClick={closeUsersPanel} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />Inchide
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Adauga rapid membru</span>
              <select value={selectedUserId} onFocus={handleAssignableUsersFocus} onMouseDown={handleAssignableUsersFocus} onChange={(event) => setSelectedUserId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="">Selecteaza membrul</option>
                {availableUsersForSelectedSubscription.map((user) => <option key={user.id} value={user.id}>{userName(user)} ({user.email})</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button onClick={() => void attachUserToSubscription()} disabled={!selectedUserId || saving} className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
                {saving ? 'Se salveaza...' : 'Adauga membru'}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {subscriptionUsersLoading ? 'Se incarca membrii abonamentului...' : assignableUsersLoading ? 'Se incarca lista de membri pentru select...' : `Afisare ${usersForSelectedSubscription.length} membri atasati acestui abonament.`}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">Membru</th>
                  <th className="pb-3 font-semibold">Contact</th>
                  <th className="pb-3 font-semibold">Status</th>
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
                    <td className="py-4"><StatusBadge status={user.active ? 'Activ' : 'Inactiv'} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-slate-500">
                      {subscriptionUsersLoading ? 'Se incarca membrii...' : 'Nu exista membri atasati sau API-ul nu expune inca relatia subscription_ids pentru utilizatori.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
