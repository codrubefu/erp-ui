import { Save } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '../primitives';
import { articlesService, type Article, type ArticlePayload, type ArticleRelation } from '../../services/articlesService';

const emptyForm: ArticlePayload = { title: '', description: '', groups: [], locations: [] };

type ArticleFormProps = {
  mode: 'create' | 'edit';
  initialData?: Article | null;
  onSubmit: (form: ArticlePayload) => void;
  submitting: boolean;
  serverError?: string;
};

function fieldIds(items: Article['groups'] | Article['locations']): number[] {
  return (items ?? []).map((item) => Number(typeof item === 'object' ? item.id : item)).filter(Boolean);
}

function selectedOptions(event: React.ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => Number(option.value));
}

function labelFor(item: ArticleRelation) {
  return item.label || item.name || item.title || `#${item.id}`;
}

export default function ArticleForm({ mode, initialData, onSubmit, submitting, serverError }: ArticleFormProps) {
  const [form, setForm] = useState<ArticlePayload>(emptyForm);
  const [groups, setGroups] = useState<ArticleRelation[]>([]);
  const [locations, setLocations] = useState<ArticleRelation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      groups: fieldIds(initialData?.groups),
      locations: fieldIds(initialData?.locations),
    });
  }, [initialData]);

  useEffect(() => {
    let disposed = false;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const [nextGroups, nextLocations] = await Promise.all([articlesService.groups(), articlesService.locations()]);
        if (disposed) return;
        setGroups(nextGroups);
        setLocations(nextLocations);
      } catch (error) {
        if (!disposed) setOptionsError(error instanceof Error ? error.message : 'Nu am putut incarca grupurile si locatiile.');
      } finally {
        if (!disposed) setLoadingOptions(false);
      }
    }
    void loadOptions();
    return () => {
      disposed = true;
    };
  }, []);

  const title = useMemo(() => (mode === 'create' ? 'Adauga Article' : 'Editeaza Article'), [mode]);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Titlul este obligatoriu.';
    if (!form.description.trim()) nextErrors.description = 'Descrierea este obligatorie.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <SectionCard title={title} action={<Link to="/erp/articles" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Inapoi</Link>}>
        {serverError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{serverError}</p> : null}
        {optionsError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{optionsError}</p> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">title</span>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
            {errors.title ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.title}</span> : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">groups</span>
            <select multiple value={form.groups.map(String)} disabled={loadingOptions} onChange={(event) => setForm((prev) => ({ ...prev, groups: selectedOptions(event) }))} className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
              {groups.map((group) => <option key={group.id} value={group.id}>{labelFor(group)}</option>)}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">description</span>
            <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={5} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
            {errors.description ? <span className="mt-1 block text-xs font-medium text-red-600">{errors.description}</span> : null}
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">locations</span>
            <select multiple value={form.locations.map(String)} disabled={loadingOptions} onChange={(event) => setForm((prev) => ({ ...prev, locations: selectedOptions(event) }))} className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
              {locations.map((location) => <option key={location.id} value={location.id}>{labelFor(location)}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Link to="/erp/articles" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Anuleaza</Link>
          <button disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            Salveaza
          </button>
        </div>
      </SectionCard>
    </form>
  );
}
