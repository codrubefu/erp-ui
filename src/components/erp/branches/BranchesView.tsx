import { Building2, Edit3, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard } from '../../primitives';
import { erpApiService, type ApiLocation } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';

type LocationForm = {
  name: string;
  description: string;
  user_ids: string;
};

const emptyForm: LocationForm = {
  name: '',
  description: '',
  user_ids: '',
};

function toIdList(value: string) {
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean);
}

function buildPayload(form: LocationForm) {
  return {
    name: form.name,
    description: form.description || null,
    user_ids: toIdList(form.user_ids),
  };
}

function formFromLocation(location: ApiLocation): LocationForm {
  return {
    name: location.name ?? '',
    description: location.description ?? '',
    user_ids: '',
  };
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return value.slice(0, 10);
}

export function BranchesView() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ApiLocation | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<LocationForm>(emptyForm);

  const fetchLocations = useCallback(async (search: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await erpApiService.list<ApiLocation>('locations', { search, per_page: 100 });
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('branches.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocations = useCallback(() => fetchLocations(searchTerm), [fetchLocations, searchTerm]);

  useEffect(() => {
    void fetchLocations('');
  }, [fetchLocations]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const startEdit = (location: ApiLocation) => {
    setEditing(location);
    setForm(formFromLocation(location));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveLocation = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await erpApiService.update<ApiLocation>('locations', editing.id, buildPayload(form));
      } else {
        await erpApiService.create<ApiLocation>('locations', buildPayload(form));
      }
      closeForm();
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('branches.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (location: ApiLocation) => {
    if (!window.confirm(t('branches.deleteConfirm', { name: location.name }))) return;
    setError('');
    try {
      await erpApiService.remove('locations', location.id);
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('branches.deleteError'));
    }
  };

  if (formOpen) {
    return (
      <PageShell
        title={editing ? t('branches.edit') : t('branches.add')}
        subtitle={t('branches.formSubtitle')}
        backLabel={t('branches.backToList')}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <SectionCard
          title={editing ? t('branches.editCardTitle', { id: editing.id }) : t('branches.add')}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label={t('branches.name')} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Main Office" />
            <Input label={t('branches.description')} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Headquarters" />
            <div className="md:col-span-2">
              <Input label={t('branches.userIds')} value={form.user_ids} onChange={(event) => setForm((prev) => ({ ...prev, user_ids: event.target.value }))} placeholder="1, 2" />
              <p className="mt-2 text-xs text-slate-500">{t('branches.userIdsHint')}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={closeForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
            <button onClick={() => void saveLocation()} disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="mr-2 inline h-4 w-4" />{saving ? t('common.saving') : t('branches.save')}
            </button>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t('branches.title')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void loadLocations()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />{t('common.refresh')}
            </button>
            <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="mr-2 inline h-4 w-4" />{t('branches.add')}
            </button>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            label={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadLocations();
            }}
            placeholder={t('branches.searchPlaceholder')}
          />
          <div className="flex items-end">
            <button onClick={() => void loadLocations()} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{t('common.search')}</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('branches.showingCount', { count: locations.length })}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {locations.map((location) => (
            <div key={location.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{location.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{location.description || t('branches.defaultDescription')}</p>
                </div>
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">{t('branches.users')}:</span> {location.users_count ?? 0}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">{t('branches.updated')}:</span> {formatDate(location.updated_at)}</div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => startEdit(location)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Edit3 className="mr-2 h-4 w-4" />{t('common.edit')}
                </button>
                <button onClick={() => void deleteLocation(location)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                </button>
              </div>
            </div>
          ))}
          {!loading && locations.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 xl:col-span-3">{t('branches.empty')}</div> : null}
          {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 xl:col-span-3">{t('branches.loadingList')}</div> : null}
        </div>
      </SectionCard>

    </div>
  );
}
