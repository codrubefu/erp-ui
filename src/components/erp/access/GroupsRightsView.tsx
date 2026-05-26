import { Edit3, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard } from '../../primitives';
import { erpApiService, type ApiGroup, type ApiRight, type ApiUser } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';

type ResourceKey = 'groups' | 'rights';
type ApiRecord = (ApiGroup | ApiRight) & { id: number };
type FieldKind = 'text' | 'textarea' | 'ids';

type FieldConfig = {
  name: string;
  labelKey: string;
  kind?: FieldKind;
  required?: boolean;
  placeholder?: string;
};

type ResourceConfig = {
  key: ResourceKey;
  labelKey: string;
  titleKey: string;
  searchPlaceholderKey: string;
  fields: FieldConfig[];
  columns: Array<{ key: string; labelKey: string; render?: (item: ApiRecord, users: ApiUser[]) => string }>;
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
    labelKey: 'access.groups',
    titleKey: 'access.groups',
    searchPlaceholderKey: 'access.searchGroups',
    fields: [
      { name: 'name', labelKey: 'access.code', required: true },
      { name: 'label', labelKey: 'access.label', required: true },
      { name: 'description', labelKey: 'access.description', kind: 'textarea' },
      { name: 'right_ids', labelKey: 'access.rights', kind: 'ids' },
    ],
    columns: [
      { key: 'name', labelKey: 'access.code' },
      { key: 'label', labelKey: 'access.label' },
      { key: 'description', labelKey: 'access.description' },
      { key: 'rights', labelKey: 'access.rights', render: (item) => ('rights' in item ? relationLabels(item.rights) : '-') },
      { key: 'users', labelKey: 'access.users', render: groupUsers },
    ],
  },
  {
    key: 'rights',
    labelKey: 'access.rights',
    titleKey: 'access.accessRights',
    searchPlaceholderKey: 'access.searchRights',
    fields: [
      { name: 'name', labelKey: 'access.code', required: true },
      { name: 'label', labelKey: 'access.label', required: true },
      { name: 'description', labelKey: 'access.description', kind: 'textarea' },
    ],
    columns: [
      { key: 'name', labelKey: 'access.code' },
      { key: 'label', labelKey: 'access.label' },
      { key: 'description', labelKey: 'access.description' },
      { key: 'groups_count', labelKey: 'access.groupsColumn' },
    ],
  },
];

export function GroupsRightsView() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<ResourceKey>('groups');
  const [items, setItems] = useState<Record<ResourceKey, ApiRecord[]>>({ groups: [], rights: [] });
  const [rights, setRights] = useState<ApiRight[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ApiRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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
      setError(err instanceof Error ? err.message : t('access.loadError'));
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
    setFormOpen(false);
    setSearch('');
    setForm(emptyForm(config));
    void loadItems(config.key, '');
  }, [activeKey, config, loadItems]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm(config));
    setFormOpen(true);
  };

  const startEdit = (item: ApiRecord) => {
    setEditing(item);
    setForm(itemToForm(config, item));
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm(config));
    setFormOpen(false);
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
      closeForm();
      await loadItems(config.key, search);
      await loadUsers();
      await loadRights();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('access.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ApiRecord) => {
    if (!window.confirm(t('access.deleteConfirm', { id: item.id }))) return;
    setError('');
    try {
      await erpApiService.remove(config.key, item.id);
      await loadItems(config.key, search);
      await loadUsers();
      await loadRights();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('access.deleteError'));
    }
  };

  if (formOpen) {
    return (
      <PageShell
        title={editing ? t('access.editResource', { resource: t(config.labelKey).toLowerCase() }) : t('access.addResource', { resource: t(config.labelKey).toLowerCase() })}
        subtitle={t('access.formSubtitle')}
        backLabel={t('access.backToResource', { resource: t(config.titleKey).toLowerCase() })}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={editing ? t('access.editCardTitle', { id: editing.id }) : t('access.addResource', { resource: t(config.labelKey).toLowerCase() })}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="space-y-4">
            {config.fields.map((field) => {
              const value = form[field.name];
              if (field.kind === 'textarea') {
                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{t(field.labelKey)}</span>
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
                    <span className="mb-2 block text-sm font-medium text-slate-700">{t(field.labelKey)}</span>
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
                  label={t(field.labelKey)}
                  required={field.required}
                  value={String(value ?? '')}
                  placeholder={field.placeholder}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                />
              );
            })}
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100 disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" /> {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t('access.title')}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => loadItems(config.key, search)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <RefreshCw className="h-4 w-4" /> {t('common.refresh')}
            </button>
            <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> {t('access.new')}
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {resources.map((resource) => (
            <button
              key={resource.key}
              onClick={() => setActiveKey(resource.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeKey === resource.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {t(resource.labelKey)}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t(config.titleKey)}
        action={
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadItems(config.key, search);
              }}
              placeholder={t(config.searchPlaceholderKey)}
              className="w-56 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-400"
            />
            <button onClick={() => loadItems(config.key, search)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('common.search')}</button>
          </div>
        }
      >
          {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">ID</th>
                  {config.columns.map((column) => <th key={column.key} className="px-3 py-3">{t(column.labelKey)}</th>)}
                  <th className="px-3 py-3 text-right">{t('common.actions')}</th>
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
                        <button onClick={() => startEdit(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700" title={t('common.edit')}>
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600" title={t('common.delete')}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && items[config.key].length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 2} className="px-3 py-8 text-center text-slate-500">{t('access.empty')}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {loading ? <p className="mt-4 text-sm text-slate-500">{t('common.loading')}</p> : null}
      </SectionCard>
    </div>
  );
}
