import { Edit3, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, SectionCard } from '../../primitives';
import { erpApiService, type ApiGroup, type ApiRight, type ApiUser } from '../../../services/ErpApiService';

type ResourceKey = 'groups' | 'rights';
type ApiRecord = (ApiGroup | ApiRight) & { id: number };
type FieldKind = 'text' | 'textarea' | 'ids';

type FieldConfig = {
  name: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  placeholder?: string;
};

type ResourceConfig = {
  key: ResourceKey;
  label: string;
  title: string;
  searchPlaceholder: string;
  fields: FieldConfig[];
  columns: Array<{ key: string; label: string; render?: (item: ApiRecord, users: ApiUser[]) => string }>;
};

type FormState = Record<string, string | boolean>;

function userName(user: ApiUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
}

function groupUsers(group: ApiRecord, users: ApiUser[]) {
  const names = users
    .filter((user) => user.groups?.some((userGroup) => userGroup.id === group.id))
    .map(userName);

  return names.length ? names.join(', ') : '-';
}

function relationLabels(items?: Array<{ id?: number; label?: string; name?: string }>) {
  if (!items?.length) return '-';
  return items.map((item) => item.label || item.name || `#${item.id}`).join(', ');
}

function relationIds(items?: Array<{ id?: number }>) {
  return items?.map((item) => item.id).filter(Boolean).join(', ') ?? '';
}

function selectedIds(value: string | boolean) {
  return String(value ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean)
    .map(String);
}

function idsFromSelect(options: HTMLCollectionOf<HTMLOptionElement>) {
  return Array.from(options)
    .filter((option) => option.selected)
    .map((option) => option.value)
    .join(', ');
}

function emptyForm(config: ResourceConfig): FormState {
  return config.fields.reduce<FormState>((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, {});
}

function valueFromItem(item: ApiRecord, field: FieldConfig) {
  if (field.name === 'right_ids' && 'rights' in item) return relationIds(item.rights);
  const raw = (item as unknown as Record<string, unknown>)[field.name];
  if (Array.isArray(raw)) return raw.map((entry) => Number((entry as { id?: number }).id)).filter(Boolean).join(', ');
  return raw == null ? '' : String(raw);
}

function itemToForm(config: ResourceConfig, item: ApiRecord): FormState {
  return config.fields.reduce<FormState>((acc, field) => {
    acc[field.name] = valueFromItem(item, field);
    return acc;
  }, emptyForm(config));
}

function serializeForm(config: ResourceConfig, form: FormState) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    const value = form[field.name];
    if (field.kind === 'ids') {
      acc[field.name] = String(value ?? '')
        .split(',')
        .map((part) => Number(part.trim()))
        .filter(Boolean);
      return acc;
    }
    if (value !== '' && value !== undefined) acc[field.name] = value;
    return acc;
  }, {});
}

function readValue(item: ApiRecord, key: string) {
  const value = (item as unknown as Record<string, unknown>)[key];
  if (value == null || value === '') return '-';
  return String(value);
}

const resources: ResourceConfig[] = [
  {
    key: 'groups',
    label: 'Grupuri de utilizatori',
    title: 'Grupuri de utilizatori',
    searchPlaceholder: 'Cauta grupuri',
    fields: [
      { name: 'name', label: 'Cod', required: true },
      { name: 'label', label: 'Denumire', required: true },
      { name: 'description', label: 'Descriere', kind: 'textarea' },
      { name: 'right_ids', label: 'Drepturi', kind: 'ids' },
    ],
    columns: [
      { key: 'name', label: 'Cod' },
      { key: 'label', label: 'Denumire' },
      { key: 'description', label: 'Descriere' },
      { key: 'rights', label: 'Drepturi', render: (item) => ('rights' in item ? relationLabels(item.rights) : '-') },
      { key: 'users', label: 'Useri', render: groupUsers },
    ],
  },
  {
    key: 'rights',
    label: 'Drepturi',
    title: 'Drepturi acces',
    searchPlaceholder: 'Cauta drepturi',
    fields: [
      { name: 'name', label: 'Cod', required: true },
      { name: 'label', label: 'Denumire', required: true },
      { name: 'description', label: 'Descriere', kind: 'textarea' },
    ],
    columns: [
      { key: 'name', label: 'Cod' },
      { key: 'label', label: 'Denumire' },
      { key: 'description', label: 'Descriere' },
      { key: 'groups_count', label: 'Grupuri' },
    ],
  },
];

export function GroupsRightsView() {
  const [activeKey, setActiveKey] = useState<ResourceKey>('groups');
  const [items, setItems] = useState<Record<ResourceKey, ApiRecord[]>>({ groups: [], rights: [] });
  const [rights, setRights] = useState<ApiRight[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ApiRecord | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(resources[0]));

  const config = useMemo(() => resources.find((resource) => resource.key === activeKey) ?? resources[0], [activeKey]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await erpApiService.list<ApiUser>('users', { per_page: 100 });
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }, []);

  const loadRights = useCallback(async () => {
    try {
      const data = await erpApiService.list<ApiRight>('rights', { per_page: 100 });
      setRights(data);
    } catch {
      setRights([]);
    }
  }, []);

  const loadItems = useCallback(async (resourceKey: ResourceKey, currentSearch: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await erpApiService.list<ApiRecord>(resourceKey, { search: currentSearch, per_page: 50 });
      setItems((prev) => ({ ...prev, [resourceKey]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut incarca datele.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadRights();
  }, [loadRights, loadUsers]);

  useEffect(() => {
    setEditing(null);
    setSearch('');
    setForm(emptyForm(config));
    void loadItems(config.key, '');
  }, [activeKey, config, loadItems]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm(config));
  };

  const startEdit = (item: ApiRecord) => {
    setEditing(item);
    setForm(itemToForm(config, item));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = serializeForm(config, form);
      if (editing) {
        await erpApiService.update(config.key, editing.id, payload);
      } else {
        await erpApiService.create(config.key, payload);
      }
      setEditing(null);
      setForm(emptyForm(config));
      await loadItems(config.key, search);
      await loadUsers();
      await loadRights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvarea a esuat.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ApiRecord) => {
    if (!window.confirm(`Stergi inregistrarea #${item.id}?`)) return;
    setError('');
    try {
      await erpApiService.remove(config.key, item.id);
      await loadItems(config.key, search);
      await loadUsers();
      await loadRights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stergerea a esuat.');
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Grupuri si Drepturi"
        action={
          <button onClick={() => loadItems(config.key, search)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {resources.map((resource) => (
            <button
              key={resource.key}
              onClick={() => setActiveKey(resource.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeKey === resource.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {resource.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SectionCard
          title={config.title}
          action={
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void loadItems(config.key, search);
                }}
                placeholder={config.searchPlaceholder}
                className="w-56 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-400"
              />
              <button onClick={() => loadItems(config.key, search)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Cauta</button>
            </div>
          }
        >
          {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">ID</th>
                  {config.columns.map((column) => <th key={column.key} className="px-3 py-3">{column.label}</th>)}
                  <th className="px-3 py-3 text-right">Actiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items[config.key].map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-3 py-4 font-semibold text-slate-900">{item.id}</td>
                    {config.columns.map((column) => (
                      <td key={column.key} className="max-w-[320px] px-3 py-4 text-slate-600">{column.render ? column.render(item, users) : readValue(item, column.key)}</td>
                    ))}
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700" title="Editeaza">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600" title="Sterge">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && items[config.key].length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 2} className="px-3 py-8 text-center text-slate-500">Nu exista inregistrari pentru filtrul curent.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {loading ? <p className="mt-4 text-sm text-slate-500">Se incarca...</p> : null}
        </SectionCard>

        <SectionCard
          title={editing ? `Editare #${editing.id}` : `Adauga ${config.label.toLowerCase()}`}
          action={
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              {editing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editing ? 'Anuleaza' : 'Nou'}
            </button>
          }
        >
          <div className="space-y-4">
            {config.fields.map((field) => {
              const value = form[field.name];
              if (field.kind === 'textarea') {
                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                    <textarea
                      value={String(value ?? '')}
                      onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                      className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>
                );
              }
              if (field.name === 'right_ids') {
                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                    <select
                      multiple
                      value={selectedIds(value)}
                      onChange={(event) => {
                        const rightIds = idsFromSelect(event.currentTarget.selectedOptions);
                        setForm((prev) => ({ ...prev, [field.name]: rightIds }));
                      }}
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {rights.map((right) => <option key={right.id} value={right.id}>{right.label || right.name}</option>)}
                    </select>
                  </label>
                );
              }
              return (
                <Input
                  key={field.name}
                  label={field.label}
                  required={field.required}
                  value={String(value ?? '')}
                  placeholder={field.placeholder}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                />
              );
            })}
            <button onClick={save} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
