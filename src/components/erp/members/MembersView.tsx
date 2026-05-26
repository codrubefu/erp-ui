import { Edit3, Filter, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard, StatusBadge } from '../../primitives';
import { erpApiService, type ApiGroup, type ApiLocation, type ApiSubscription, type ApiUser, type ApiUserSubscription, type ApiUserSubscriptionAssignment } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';

type UserFormTab = 'details' | 'subscriptions';

type UserForm = {
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  active: boolean;
  group_ids: string;
  location_ids: string;
  subscriptions: ApiUserSubscriptionAssignment[];
};

type MembersViewProps = {
  resource?: string;
  title?: string;
  addLabel?: string;
  countLabel?: string;
  singularLabel?: string;
  entityLabel?: string;
  newEntityLabel?: string;
  showGroupsInList?: boolean;
};

const emptyForm: UserForm = {
  user_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  active: true,
  group_ids: '',
  location_ids: '',
  subscriptions: [],
};

function toIdList(value: string) {
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean);
}

function relationIds(items?: Array<{ id?: number }>) {
  return items?.map((item) => item.id).filter(Boolean).join(', ') ?? '';
}

function relationLabels(items?: Array<{ id?: number; label?: string; name?: string }>) {
  if (!items?.length) return '-';
  return items.map((item) => item.label || item.name || `#${item.id}`).join(', ');
}

function mergeById<T extends { id?: number }>(...groups: Array<T[] | undefined>) {
  const items = new Map<number, T>();
  groups.flatMap((group) => group ?? []).forEach((item) => {
    if (item.id) items.set(item.id, { ...items.get(item.id), ...item });
  });
  return Array.from(items.values());
}

function selectedIds(value: string) {
  return toIdList(value).map(String);
}

function idsFromSelect(options: HTMLCollectionOf<HTMLOptionElement>) {
  return Array.from(options)
    .filter((option) => option.selected)
    .map((option) => option.value)
    .join(', ');
}

function userName(user: ApiUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function subscriptionAssignmentsFromUser(user: ApiUser): ApiUserSubscriptionAssignment[] {
  const source = user.active_subscriptions?.length
    ? user.active_subscriptions
    : mergeById(user.subscriptions).filter((subscription) => subscriptionIsActive(user, subscription.id, subscription));

  return source.map((subscription) => {
    const historyItem = user.subscription_history?.find((item) => item.subscription_id === subscription.id);
    return {
      id: subscription.id,
      start_date: historyItem?.start_date ?? subscription.start_date ?? subscription.pivot?.start_date ?? todayDate(),
    };
  }) ?? [];
}

function hasActiveSubscription(user: ApiUser) {
  return user.has_active_subscription ?? Boolean(user.active_subscriptions?.length);
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}

function addDays(date: string | undefined, days: number | null | undefined) {
  if (!date || !days) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function subscriptionStartDate(subscription?: ApiSubscription | ApiUserSubscription | null) {
  return subscription?.start_date ?? subscription?.pivot?.start_date ?? null;
}

function subscriptionExpiresAt(subscription?: ApiSubscription | ApiUserSubscription | null) {
  return subscription?.expires_at ?? subscription?.pivot?.expires_at ?? null;
}

function subscriptionIsActive(user: ApiUser | null, subscriptionId: number, fallback?: ApiSubscription | ApiUserSubscription | null) {
  if (user?.active_subscriptions?.some((subscription) => subscription.id === subscriptionId)) return true;
  if (fallback?.pivot?.is_active !== undefined) return fallback.pivot.is_active;
  if (fallback?.expires_at) return fallback.expires_at >= todayDate();
  if (fallback?.pivot?.expires_at) return fallback.pivot.expires_at >= todayDate();
  return fallback?.is_active ?? true;
}

function subscriptionHistoryRows(user: ApiUser | null) {
  if (!user) return [];
  if (user.subscription_history?.length) return user.subscription_history.filter((item) => !item.is_active);

  return mergeById(user.subscriptions, user.active_subscriptions).map((subscription) => ({
    id: subscription.pivot?.id ?? null,
    subscription_id: subscription.id,
    name: subscription.name,
    start_date: subscriptionStartDate(subscription),
    expires_at: subscriptionExpiresAt(subscription),
    is_active: subscriptionIsActive(user, subscription.id, subscription),
  })).filter((item) => !item.is_active);
}

function userSubscriptionLabels(user: ApiUser) {
  return relationLabels(mergeById(user.subscriptions, user.active_subscriptions));
}

function buildPayload(form: UserForm) {
  const payload: Record<string, unknown> = {
    user_code: form.user_code.trim() || null,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone || null,
    active: form.active,
    group_ids: toIdList(form.group_ids),
    location_ids: toIdList(form.location_ids),
    subscriptions: form.subscriptions.map((subscription) => ({
      id: subscription.id,
      start_date: subscription.start_date || todayDate(),
    })),
  };

  const password = form.password.trim();
  if (password) {
    payload.password = password;
  }

  return payload;
}

function usersFromSearchPayload(payload: ApiUser[] | { data?: ApiUser[] }) {
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

function formFromUser(user: ApiUser): UserForm {
  return {
    user_code: user.user_code ?? '',
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
    active: Boolean(user.active),
    group_ids: relationIds(user.groups),
    location_ids: relationIds(user.locations),
    subscriptions: subscriptionAssignmentsFromUser(user),
  };
}

export function MembersView({
  resource = 'clients',
  title,
  addLabel,
  countLabel,
  singularLabel,
  entityLabel,
  newEntityLabel,
  showGroupsInList = false,
}: MembersViewProps = {}) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [activeFormTab, setActiveFormTab] = useState<UserFormTab>('details');
  const [subscriptionToAdd, setSubscriptionToAdd] = useState('');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(todayDate());

  const resolvedTitle = title ?? t('members.title');
  const resolvedAddLabel = addLabel ?? t('members.add');
  const resolvedCountLabel = countLabel ?? t('members.countLabel');
  const resolvedSingularLabel = singularLabel ?? t('members.singularLabel');
  const resolvedEntityLabel = entityLabel ?? t('members.entityLabel');
  const resolvedNewEntityLabel = newEntityLabel ?? t('members.newEntityLabel');

  const selectedGroupIds = useMemo(() => selectedIds(form.group_ids), [form.group_ids]);
  const selectedLocationIds = useMemo(() => selectedIds(form.location_ids), [form.location_ids]);
  const selectedSubscriptionIds = useMemo(() => form.subscriptions.map((subscription) => String(subscription.id)), [form.subscriptions]);

  const loadLookups = useCallback(async () => {
    try {
      const [groupData, locationData, subscriptionData] = await Promise.all([
        erpApiService.list<ApiGroup>('groups', { per_page: 100 }),
        erpApiService.list<ApiLocation>('locations', { per_page: 100 }),
        erpApiService.list<ApiSubscription>('subscriptions', { per_page: 100, is_active: '1' }),
      ]);
      setGroups(groupData);
      setLocations(locationData);
      setSubscriptions(subscriptionData);
    } catch {
      setGroups([]);
      setLocations([]);
      setSubscriptions([]);
    }
  }, []);

  const fetchUsers = useCallback(async (search: string, limit: number) => {
    setLoading(true);
    setError('');
    try {
      const data = search.trim()
        ? usersFromSearchPayload(await erpApiService.searchUsersByCode(search.trim(), 1, limit))
        : await erpApiService.list<ApiUser>(resource, { per_page: limit });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.loadError', { label: resolvedCountLabel }));
    } finally {
      setLoading(false);
    }
  }, [resolvedCountLabel, resource, t]);

  const loadUsers = useCallback(() => fetchUsers(searchTerm, perPage), [fetchUsers, searchTerm, perPage]);

  useEffect(() => {
    void loadLookups();
    void fetchUsers('', 15);
  }, [fetchUsers, loadLookups]);

  const resetFilters = () => {
    setSearchTerm('');
    setPerPage(15);
    void fetchUsers('', 15);
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    setFormOpen(true);
  };

  const startEdit = async (user: ApiUser) => {
    let selectedUser = user;
    try {
      selectedUser = await erpApiService.get<ApiUser>('users', user.id);
    } catch {
      selectedUser = user;
    }
    setEditing(selectedUser);
    setForm(formFromUser(selectedUser));
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
  };

  const updateSubscriptionStartDate = (subscriptionId: number, startDate: string) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((subscription) => (
        subscription.id === subscriptionId ? { ...subscription, start_date: startDate } : subscription
      )),
    }));
  };

  const addSubscriptionAssignment = () => {
    const subscriptionId = Number(subscriptionToAdd);
    if (!subscriptionId) return;
    setForm((prev) => {
      if (prev.subscriptions.some((subscription) => subscription.id === subscriptionId)) return prev;
      return {
        ...prev,
        subscriptions: [...prev.subscriptions, { id: subscriptionId, start_date: subscriptionStartDate || todayDate() }],
      };
    });
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
  };

  const removeSubscriptionAssignment = (subscriptionId: number) => {
    setForm((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((subscription) => subscription.id !== subscriptionId),
    }));
  };

  const saveUser = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await erpApiService.update<ApiUser>(resource, editing.id, buildPayload(form));
      } else {
        await erpApiService.create<ApiUser>(resource, buildPayload(form));
      }
      closeForm();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.saveError', { label: resolvedSingularLabel }));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: ApiUser) => {
    if (!window.confirm(t('users.deleteConfirm', { label: resolvedSingularLabel, name: userName(user) }))) return;
    setError('');
    try {
      await erpApiService.remove(resource, user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.deleteError', { label: resolvedSingularLabel }));
    }
  };

  if (formOpen) {
    return (
      <PageShell
        title={editing ? t('users.editTitle', { label: resolvedEntityLabel }) : resolvedAddLabel}
        subtitle={t('users.formSubtitle', { target: editing ? resolvedEntityLabel : resolvedNewEntityLabel })}
        backLabel={t('common.backToList', { list: resolvedCountLabel })}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={editing ? t('users.editCardTitle', { label: resolvedEntityLabel, id: editing.id }) : t('users.addCardTitle', { label: resolvedEntityLabel })}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
            {[
              ['details', 'Date utilizator'],
              ['subscriptions', 'Abonamente'],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveFormTab(tab as UserFormTab)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeFormTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeFormTab === 'details' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t('users.userCode')} value={form.user_code} onChange={(event) => setForm((prev) => ({ ...prev, user_code: event.target.value }))} placeholder="USR00000000000000000000000000001" maxLength={32} />
              <Input label={t('users.firstName')} value={form.first_name} onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))} placeholder="John" />
              <Input label={t('users.lastName')} value={form.last_name} onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))} placeholder="Doe" />
              <Input label={t('members.email')} type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="john@example.com" />
              <Input label={t('members.phone')} value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+15550001111" />
              <Input label={editing ? t('users.newPassword') : t('users.password')} type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder={editing ? t('users.changePasswordHint') : 'password'} />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
                {t('users.activeUser')}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.groups')}</span>
                <select
                  multiple
                  value={selectedGroupIds}
                  onChange={(event) => {
                    const groupIds = idsFromSelect(event.currentTarget.selectedOptions);
                    setForm((prev) => ({ ...prev, group_ids: groupIds }));
                  }}
                  className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {groups.map((group) => <option key={group.id} value={group.id}>{group.label || group.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">{t('articles.locations')}</span>
                <select
                  multiple
                  value={selectedLocationIds}
                  onChange={(event) => {
                    const locationIds = idsFromSelect(event.currentTarget.selectedOptions);
                    setForm((prev) => ({ ...prev, location_ids: locationIds }));
                  }}
                  className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Adauga abonament</span>
                  <select value={subscriptionToAdd} onChange={(event) => setSubscriptionToAdd(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                    <option value="">Selecteaza abonamentul</option>
                    {subscriptions.filter((subscription) => !selectedSubscriptionIds.includes(String(subscription.id))).map((subscription) => (
                      <option key={subscription.id} value={subscription.id}>{subscription.name}</option>
                    ))}
                  </select>
                </label>
                <Input label="Data start" type="date" value={subscriptionStartDate} onChange={(event) => setSubscriptionStartDate(event.target.value)} />
                <div className="flex items-end">
                  <button onClick={addSubscriptionAssignment} disabled={!subscriptionToAdd} className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
                    <Plus className="mr-2 inline h-4 w-4" />Adauga
                  </button>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Abonamente curente</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Abonament</th>
                        <th className="px-4 py-3 font-semibold">Adaugat</th>
                        <th className="px-4 py-3 font-semibold">Expira</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.subscriptions.length > 0 ? form.subscriptions.map((assignment) => {
                        const userSubscription = mergeById(editing?.subscriptions, editing?.active_subscriptions).find((item) => item.id === assignment.id);
                        const subscription = subscriptions.find((item) => item.id === assignment.id) ?? userSubscription;
                        const persistedExpiresAt = subscriptionExpiresAt(userSubscription);
                        const expiresAt = persistedExpiresAt ?? addDays(assignment.start_date, subscription?.duration_days);
                        return (
                          <tr key={assignment.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{subscription?.name ?? `#${assignment.id}`}</p>
                              <p className="text-xs text-slate-500">{subscription?.duration_days ? `${subscription.duration_days} zile` : 'Fara expirare automata'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Input label="Data start" type="date" value={assignment.start_date ?? ''} onChange={(event) => updateSubscriptionStartDate(assignment.id, event.target.value)} />
                            </td>
                            <td className="px-4 py-3 text-slate-600">{expiresAt ?? 'Fara expirare automata'}</td>
                            <td className="px-4 py-3"><StatusBadge status={subscriptionIsActive(editing, assignment.id, userSubscription ?? subscription) ? 'Activ' : 'Expirat'} /></td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => removeSubscriptionAssignment(assignment.id)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" />Sterge
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Nu exista abonamente atasate.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Istoric abonamente</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Abonament</th>
                        <th className="px-4 py-3 font-semibold">Adaugat</th>
                        <th className="px-4 py-3 font-semibold">Expira</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionHistoryRows(editing).length ? subscriptionHistoryRows(editing).map((item) => (
                        <tr key={`${item.subscription_id}-${item.id ?? item.start_date}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(item.start_date)}</td>
                          <td className="px-4 py-3 text-slate-600">{item.expires_at ? formatDate(item.expires_at) : 'Fara expirare automata'}</td>
                          <td className="px-4 py-3"><StatusBadge status={item.is_active ? 'Activ' : 'Expirat'} /></td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">Nu exista istoric pentru acest utilizator.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
            <button onClick={() => void saveUser()} disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="mr-2 inline h-4 w-4" />{saving ? t('users.saving') : t('common.save')}
            </button>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={resolvedTitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <Filter className="mr-2 inline h-4 w-4" />{t('users.resetFilters')}
            </button>
            <button onClick={() => void loadUsers()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />{t('common.refresh')}
            </button>
            <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="mr-2 inline h-4 w-4" />{resolvedAddLabel}
            </button>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
          <Input
            label={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadUsers();
            }}
            placeholder={t('users.searchPlaceholder')}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.perPage')}</span>
            <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => void loadUsers()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{t('common.search')}</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('users.showingCount', { count: users.length, label: resolvedCountLabel })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">{t('users.user')}</th>
                <th className="pb-3 font-semibold">{t('users.contact')}</th>
                {showGroupsInList ? <th className="pb-3 font-semibold">{t('users.groups')}</th> : null}
                <th className="pb-3 font-semibold">{t('users.subscriptions')}</th>
                <th className="pb-3 font-semibold">{t('articles.locations')}</th>
                <th className="pb-3 font-semibold">{t('common.status')}</th>
                <th className="pb-3 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 align-top">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{userName(user)}</p>
                    <p className="text-xs text-slate-500">{user.user_code || `#${user.id}`}</p>
                  </td>
                  <td className="py-4 text-slate-600">
                    <p>{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone || '-'}</p>
                  </td>
                  {showGroupsInList ? <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.groups)}</td> : null}
                  <td className="max-w-[260px] py-4 text-slate-600">
                    <p>{userSubscriptionLabels(user)}</p>
                    <div className="mt-2"><StatusBadge status={hasActiveSubscription(user) ? 'Activ' : 'Fara abonament activ'} /></div>
                  </td>
                  <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.locations)}</td>
                  <td className="py-4"><StatusBadge status={user.active ? t('users.statusActive') : t('users.statusInactive')} /></td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => void startEdit(user)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Edit3 className="mr-2 h-4 w-4" />{t('common.edit')}
                      </button>
                      <button onClick={() => void deleteUser(user)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={showGroupsInList ? 7 : 6} className="py-10 text-center text-sm text-slate-500">{loading ? t('users.loadingList', { label: resolvedCountLabel }) : t('users.emptyList', { label: resolvedCountLabel })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

    </div>
  );
}
