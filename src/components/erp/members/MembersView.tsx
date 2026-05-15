import { Edit3, Filter, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, SectionCard, StatusBadge } from '../../primitives';
import { erpApiService, type ApiGroup, type ApiLocation, type ApiSubscription, type ApiUser } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';

type UserForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  active: boolean;
  group_ids: string;
  location_ids: string;
  subscription_ids: string;
};

type MembersViewProps = {
  resource?: string;
  title?: string;
  addLabel?: string;
  countLabel?: string;
  singularLabel?: string;
  showGroupsInList?: boolean;
};

const emptyForm: UserForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  active: true,
  group_ids: '',
  location_ids: '',
  subscription_ids: '',
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

function buildPayload(form: UserForm, mode: 'create' | 'edit') {
  const payload: Record<string, unknown> = {
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone || null,
    active: form.active,
    group_ids: toIdList(form.group_ids),
    location_ids: toIdList(form.location_ids),
    subscription_ids: toIdList(form.subscription_ids),
  };

  if (mode === 'create' || form.password.trim()) {
    payload.password = form.password;
  }

  return payload;
}

function formFromUser(user: ApiUser): UserForm {
  return {
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
    active: Boolean(user.active),
    group_ids: relationIds(user.groups),
    location_ids: relationIds(user.locations),
    subscription_ids: relationIds(user.subscriptions),
  };
}

export function MembersView({
  resource = 'clients',
  title = 'Management membri',
  addLabel = 'Adauga membru',
  countLabel = 'membri',
  singularLabel = 'membrul',
  showGroupsInList = false,
}: MembersViewProps = {}) {
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

  const selectedGroupIds = useMemo(() => selectedIds(form.group_ids), [form.group_ids]);
  const selectedLocationIds = useMemo(() => selectedIds(form.location_ids), [form.location_ids]);
  const selectedSubscriptionIds = useMemo(() => selectedIds(form.subscription_ids), [form.subscription_ids]);

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
      const data = await erpApiService.list<ApiUser>(resource, { search, per_page: limit });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Nu am putut incarca ${countLabel}.`);
    } finally {
      setLoading(false);
    }
  }, [countLabel, resource]);

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
    setFormOpen(true);
  };

  const startEdit = (user: ApiUser) => {
    setEditing(user);
    setForm(formFromUser(user));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveUser = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await erpApiService.update<ApiUser>(resource, editing.id, buildPayload(form, 'edit'));
      } else {
        await erpApiService.create<ApiUser>(resource, buildPayload(form, 'create'));
      }
      closeForm();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Nu am putut salva ${singularLabel}.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: ApiUser) => {
    if (!window.confirm(`Stergi ${singularLabel} ${userName(user)}?`)) return;
    setError('');
    try {
      await erpApiService.remove(resource, user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Nu am putut sterge ${singularLabel}.`);
    }
  };

  if (formOpen) {
    return (
      <PageShell
        title={editing ? `Editare ${singularLabel}` : addLabel}
        subtitle={`Configureaza datele pentru ${editing ? singularLabel : 'un membru nou'} fara a afisa lista in fundal.`}
        backLabel={`Inapoi la ${countLabel}`}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={editing ? `Editare user #${editing.id}` : 'Adaugare user'}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />Inchide
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Prenume" value={form.first_name} onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))} placeholder="John" />
            <Input label="Nume" value={form.last_name} onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))} placeholder="Doe" />
            <Input label="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="john@example.com" />
            <Input label="Telefon" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+15550001111" />
            <Input label={editing ? 'Parola noua' : 'Parola'} type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder={editing ? 'Completeaza doar daca o schimbi' : 'password'} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
              User activ
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Grupuri</span>
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
              <span className="mb-2 block text-sm font-medium text-slate-700">Locatii</span>
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
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Abonamente</span>
              <select
                multiple
                value={selectedSubscriptionIds}
                onChange={(event) => {
                  const subscriptionIds = idsFromSelect(event.currentTarget.selectedOptions);
                  setForm((prev) => ({ ...prev, subscription_ids: subscriptionIds }));
                }}
                className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                {subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>{subscription.name}</option>)}
              </select>
              <p className="mt-2 text-xs text-slate-500">Selecteaza zero, unul sau mai multe abonamente pentru acest membru.</p>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anuleaza</button>
            <button onClick={() => void saveUser()} disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="mr-2 inline h-4 w-4" />{saving ? 'Se salveaza...' : 'Salveaza user'}
            </button>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={title}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <Filter className="mr-2 inline h-4 w-4" />Reseteaza filtre
            </button>
            <button onClick={() => void loadUsers()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />Refresh
            </button>
            <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="mr-2 inline h-4 w-4" />{addLabel}
            </button>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
          <Input
            label="Cautare"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadUsers();
            }}
            placeholder="Cauta dupa nume, email sau telefon"
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Pe pagina</span>
            <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => void loadUsers()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Cauta</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Afisare <span className="font-semibold text-slate-900">{users.length}</span> {countLabel} din API
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Contact</th>
                {showGroupsInList ? <th className="pb-3 font-semibold">Grupuri</th> : null}
                <th className="pb-3 font-semibold">Abonamente</th>
                <th className="pb-3 font-semibold">Locatii</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 align-top">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{userName(user)}</p>
                    <p className="text-xs text-slate-500">#{user.id}</p>
                  </td>
                  <td className="py-4 text-slate-600">
                    <p>{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone || '-'}</p>
                  </td>
                  {showGroupsInList ? <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.groups)}</td> : null}
                  <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.subscriptions)}</td>
                  <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.locations)}</td>
                  <td className="py-4"><StatusBadge status={user.active ? 'Activ' : 'Inactiv'} /></td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(user)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Edit3 className="mr-2 h-4 w-4" />Editeaza
                      </button>
                      <button onClick={() => void deleteUser(user)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />Sterge
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={showGroupsInList ? 7 : 6} className="py-10 text-center text-sm text-slate-500">{loading ? `Se incarca ${countLabel}...` : `Nu exista ${countLabel} pentru filtrul curent.`}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

    </div>
  );
}
