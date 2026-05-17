import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Edit3, Eye, Plus, RefreshCw, Save, Search, Trash2, Users, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { eventService, type ApiValidationError, type EventItem, type EventPayload, type EventStatus, type EventSubscription, type EventUser, type OccurrenceStatus, type ParticipantStatus, type RecurrenceType, type Weekday } from '../../../services/eventService';
import { SectionCard } from '../../primitives';
import { useEvent, useEventOccurrences, useEventParticipants, useEvents } from './hooks';
import { useAuth } from '../../../context/AuthContext';

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const weekdayLabels: Record<Weekday, string> = { monday: 'Luni', tuesday: 'Marti', wednesday: 'Miercuri', thursday: 'Joi', friday: 'Vineri', saturday: 'Sambata', sunday: 'Duminica' };
const eventStatuses: EventStatus[] = ['active', 'inactive', 'cancelled'];
const occurrenceStatuses: OccurrenceStatus[] = ['scheduled', 'cancelled', 'completed'];
const participantStatuses: ParticipantStatus[] = ['registered', 'attended', 'cancelled', 'no_show'];

function usePermissions() {
  const { hasAnyRight } = useAuth();
  return {
    canViewEvents: hasAnyRight(['events.view', 'events.manage']),
    canManageEvents: hasAnyRight(['events.manage']),
    canViewParticipants: hasAnyRight(['event_participants.view', 'event_participants.manage']),
    canManageParticipants: hasAnyRight(['event_participants.manage']),
  };
}

function fieldError(errors?: Record<string, string[]>, name?: string) {
  if (!errors || !name) return '';
  return errors[name]?.[0] ?? '';
}

function TextField({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select {...props} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">{children}</select>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  return <div className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}><button onClick={onClose} className="mr-3"><X className="inline h-4 w-4" /></button>{message}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status.includes('cancel') || status === 'inactive' ? 'bg-red-50 text-red-700' : status === 'active' || status === 'scheduled' || status === 'registered' || status === 'attended' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

export function RecurrenceBadge({ type }: { type: RecurrenceType }) {
  return <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{type}</span>;
}

export function SubscriptionRequirementBadge({ event }: { event: Pick<EventItem, 'requires_active_subscription' | 'required_subscription'> }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${event.requires_active_subscription ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{event.requires_active_subscription ? `Necesita abonament${event.required_subscription?.name ? `: ${event.required_subscription.name}` : ''}` : 'Fara abonament obligatoriu'}</span>;
}

function DeleteConfirmModal({ label, loading, onCancel, onConfirm }: { label: string; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Confirmare stergere</h3>
        <p className="mt-2 text-sm text-slate-600">Stergi {label}? Actiunea nu poate fi anulata din UI.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Anuleaza</button>
          <button onClick={onConfirm} disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Sterge</button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      <span className="text-sm text-slate-600">Pagina {page} din {lastPage}</span>
      <button disabled={page >= lastPage} onClick={() => onPage(page + 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

function EventsPage() {
  const permissions = usePermissions();
  const [filters, setFilters] = useState({ page: 1, per_page: 15, search: '', status: '', recurrence_type: '', requires_active_subscription: '', sort: 'created_at' as const, direction: 'desc' as const });
  const query = useMemo(() => filters, [filters]);
  const { events, meta, loading, error, reload } = useEvents(query);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);

  if (!permissions.canViewEvents) return <SectionCard title="Evenimente"><p className="text-sm text-slate-600">Nu ai dreptul events.view.</p></SectionCard>;

  const deleteEvent = async () => {
    if (!deleting) return;
    try {
      await eventService.deleteEvent(deleting.id);
      setToast({ type: 'success', message: 'Evenimentul a fost sters.' });
      setDeleting(null);
      await reload();
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Nu am putut sterge evenimentul.' });
    }
  };

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <SectionCard title="Events Management" action={permissions.canManageEvents ? <Link to="new" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Create</Link> : null}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <TextField label="Search titlu" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} />
          <SelectField label="Status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}><option value="">Toate</option>{eventStatuses.map((s) => <option key={s}>{s}</option>)}</SelectField>
          <SelectField label="Recurenta" value={filters.recurrence_type} onChange={(e) => setFilters((p) => ({ ...p, recurrence_type: e.target.value, page: 1 }))}><option value="">Toate</option><option value="once">once</option><option value="weekly">weekly</option><option value="monthly">monthly</option></SelectField>
          <SelectField label="Subscription" value={filters.requires_active_subscription} onChange={(e) => setFilters((p) => ({ ...p, requires_active_subscription: e.target.value, page: 1 }))}><option value="">Toate</option><option value="1">Da</option><option value="0">Nu</option></SelectField>
          <SelectField label="Sortare" value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value as typeof p.sort }))}><option value="created_at">created_at</option><option value="start_date">start_date</option><option value="title">title</option></SelectField>
          <button onClick={() => void reload()} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"><Search className="h-4 w-4" />Cauta</button>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b text-slate-500"><th className="pb-3">Titlu</th><th className="pb-3">Data</th><th className="pb-3">Recurenta</th><th className="pb-3">Subscription</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actiuni</th></tr></thead>
            <tbody>{events.length ? events.map((event) => (
              <tr key={event.id} className="border-b border-slate-100 align-top">
                <td className="py-4 font-semibold text-slate-900">{event.title}<p className="text-xs font-normal text-slate-500">{event.location || '-'}</p></td>
                <td className="py-4 text-slate-600">{event.start_date} {event.start_time}-{event.end_time}</td>
                <td className="py-4"><RecurrenceBadge type={event.recurrence_type} /></td>
                <td className="py-4"><SubscriptionRequirementBadge event={event} /></td>
                <td className="py-4"><StatusBadge status={event.status} /></td>
                <td className="py-4"><div className="flex flex-wrap justify-end gap-2">
                  <Link to={`${event.id}`} className="rounded-xl border px-3 py-2"><Eye className="h-4 w-4" /></Link>
                  {permissions.canManageEvents ? <Link to={`${event.id}/edit`} className="rounded-xl border px-3 py-2"><Edit3 className="h-4 w-4" /></Link> : null}
                  <Link to={`${event.id}/occurrences`} className="rounded-xl border px-3 py-2"><CalendarClock className="h-4 w-4" /></Link>
                  {permissions.canManageEvents ? <button onClick={() => setDeleting(event)} className="rounded-xl border border-red-100 px-3 py-2 text-red-600"><Trash2 className="h-4 w-4" /></button> : null}
                </div></td>
              </tr>
            )) : <tr><td colSpan={6} className="py-10 text-center text-slate-500">{loading ? 'Se incarca evenimentele...' : 'Nu exista evenimente pentru filtrele curente.'}</td></tr>}</tbody>
          </table>
        </div>
        <div className="mt-4"><Pagination page={meta.current_page} lastPage={meta.last_page} onPage={(page) => setFilters((p) => ({ ...p, page }))} /></div>
      </SectionCard>
      {deleting ? <DeleteConfirmModal label={deleting.title} onCancel={() => setDeleting(null)} onConfirm={() => void deleteEvent()} /> : null}
    </div>
  );
}

type FormValues = EventPayload;

const emptyEventForm: FormValues = {
  title: '',
  description: '',
  location: '',
  start_time: '',
  end_time: '',
  recurrence_type: 'once',
  recurrence_days: [],
  monthly_day: null,
  start_date: '',
  end_date: null,
  requires_active_subscription: false,
  required_subscription_id: null,
  max_participants: null,
  status: 'active',
};

function EventForm({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const id = Number(eventId);
  const { event, loading } = useEvent(mode === 'edit' ? id : undefined);
  const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState<FormValues>(emptyEventForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recurrenceType = form.recurrence_type;
  const needsSubscription = form.requires_active_subscription;

  useEffect(() => {
    eventService.getSubscriptions().then((payload) => setSubscriptions(Array.isArray(payload) ? payload : payload.data)).catch(() => setSubscriptions([]));
  }, []);

  useEffect(() => {
    if (event) setForm({ ...event, recurrence_days: event.recurrence_days ?? [], description: event.description ?? '', location: event.location ?? '', end_date: event.end_date ?? null });
  }, [event]);

  useEffect(() => {
    if (recurrenceType === 'once') {
      setForm((prev) => ({ ...prev, recurrence_days: [], monthly_day: null }));
    }
    if (recurrenceType === 'weekly') setForm((prev) => ({ ...prev, monthly_day: null }));
    if (recurrenceType === 'monthly') setForm((prev) => ({ ...prev, recurrence_days: [] }));
  }, [recurrenceType]);

  useEffect(() => {
    if (!needsSubscription) setForm((prev) => ({ ...prev, required_subscription_id: null }));
  }, [needsSubscription]);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Titlul este obligatoriu.';
    if (!form.start_time) nextErrors.start_time = 'Ora de start este obligatorie.';
    if (!form.end_time) nextErrors.end_time = 'Ora de final este obligatorie.';
    if (!form.start_date) nextErrors.start_date = 'Data de start este obligatorie.';
    if (form.requires_active_subscription && !form.required_subscription_id) nextErrors.required_subscription_id = 'Alege subscription-ul necesar.';
    setClientErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (eventSubmit: React.FormEvent<HTMLFormElement>) => {
    eventSubmit.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setServerErrors(undefined);
    const payload = { ...form, description: form.description || null, location: form.location || null, max_participants: form.max_participants ? Number(form.max_participants) : null, monthly_day: form.monthly_day ? Number(form.monthly_day) : null, required_subscription_id: form.requires_active_subscription ? Number(form.required_subscription_id) : null };
    try {
      if (mode === 'edit') await eventService.updateEvent(id, payload);
      else await eventService.createEvent(payload);
      setToast({ type: 'success', message: 'Evenimentul a fost salvat.' });
      setTimeout(() => navigate('/erp/events'), 500);
    } catch (err) {
      const apiError = err as ApiValidationError;
      setServerErrors(apiError.errors);
      setToast({ type: 'error', message: apiError.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <SectionCard title="Eveniment"><p className="text-sm text-slate-500">Se incarca...</p></SectionCard>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <SectionCard title={mode === 'create' ? 'Create Event' : 'Edit Event'} action={<Link to="/erp/events" className="rounded-xl border px-4 py-2 text-sm font-semibold">Inapoi</Link>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField label="title" value={form.title} onChange={(e) => updateField('title', e.target.value)} error={clientErrors.title || fieldError(serverErrors, 'title')} />
          <TextField label="location" value={form.location ?? ''} onChange={(e) => updateField('location', e.target.value)} error={fieldError(serverErrors, 'location')} />
          <TextField label="start_time" type="time" value={form.start_time} onChange={(e) => updateField('start_time', e.target.value)} error={clientErrors.start_time || fieldError(serverErrors, 'start_time')} />
          <TextField label="end_time" type="time" value={form.end_time} onChange={(e) => updateField('end_time', e.target.value)} error={clientErrors.end_time || fieldError(serverErrors, 'end_time')} />
          <TextField label="start_date" type="date" value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} error={clientErrors.start_date || fieldError(serverErrors, 'start_date')} />
          <TextField label="end_date" type="date" value={form.end_date ?? ''} onChange={(e) => updateField('end_date', e.target.value || null)} error={fieldError(serverErrors, 'end_date')} />
          <SelectField label="recurrence_type" value={form.recurrence_type} onChange={(e) => updateField('recurrence_type', e.target.value as RecurrenceType)} error={fieldError(serverErrors, 'recurrence_type')}><option value="once">once</option><option value="weekly">weekly</option><option value="monthly">monthly</option></SelectField>
          {recurrenceType === 'monthly' ? <TextField label="monthly_day" type="number" min={1} max={31} value={form.monthly_day ?? ''} onChange={(e) => updateField('monthly_day', e.target.value ? Number(e.target.value) : null)} error={fieldError(serverErrors, 'monthly_day')} /> : null}
          {recurrenceType === 'weekly' ? <div><span className="mb-2 block text-sm font-medium text-slate-700">recurrence_days</span><div className="grid grid-cols-2 gap-2">{weekdays.map((day) => <label key={day} className="rounded-xl border px-3 py-2 text-sm"><input type="checkbox" checked={(form.recurrence_days ?? []).includes(day)} onChange={(e) => updateField('recurrence_days', e.target.checked ? [...(form.recurrence_days ?? []), day] : (form.recurrence_days ?? []).filter((item) => item !== day))} className="mr-2 accent-violet-600" />{weekdayLabels[day]}</label>)}</div>{fieldError(serverErrors, 'recurrence_days') ? <span className="mt-1 block text-xs text-red-600">{fieldError(serverErrors, 'recurrence_days')}</span> : null}</div> : null}
          <TextField label="max_participants" type="number" min={1} value={form.max_participants ?? ''} onChange={(e) => updateField('max_participants', e.target.value ? Number(e.target.value) : null)} error={fieldError(serverErrors, 'max_participants')} />
          <SelectField label="status" value={form.status} onChange={(e) => updateField('status', e.target.value as EventStatus)} error={fieldError(serverErrors, 'status')}>{eventStatuses.map((status) => <option key={status}>{status}</option>)}</SelectField>
          <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.requires_active_subscription} onChange={(e) => updateField('requires_active_subscription', e.target.checked)} className="accent-violet-600" />requires_active_subscription</label>
          {needsSubscription ? <SelectField label="required_subscription_id" value={form.required_subscription_id ?? ''} onChange={(e) => updateField('required_subscription_id', e.target.value ? Number(e.target.value) : null)} error={clientErrors.required_subscription_id || fieldError(serverErrors, 'required_subscription_id')}><option value="">Selecteaza</option>{subscriptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</SelectField> : null}
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">description</span><textarea value={form.description ?? ''} onChange={(e) => updateField('description', e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />{fieldError(serverErrors, 'description') ? <span className="text-xs text-red-600">{fieldError(serverErrors, 'description')}</span> : null}</label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => navigate('/erp/events')} className="rounded-xl border px-4 py-2 text-sm font-semibold">Anuleaza</button><button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />Salveaza</button></div>
      </SectionCard>
    </form>
  );
}

function EventDetailsPage() {
  const { eventId } = useParams();
  const { event, loading, error } = useEvent(Number(eventId));
  const permissions = usePermissions();
  if (loading) return <SectionCard title="Event Details"><p>Se incarca...</p></SectionCard>;
  if (error || !event) return <SectionCard title="Event Details"><p className="text-red-600">{error || 'Evenimentul nu exista.'}</p></SectionCard>;
  return (
    <SectionCard title={event.title} action={<div className="flex gap-2">{permissions.canManageEvents ? <Link to="edit" className="rounded-xl border px-4 py-2 text-sm font-semibold">Edit</Link> : null}<Link to="occurrences" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">View Occurrences</Link></div>}>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <p><b>descriere:</b> {event.description || '-'}</p><p><b>locatie:</b> {event.location || '-'}</p>
        <p><b>interval orar:</b> {event.start_date} {event.start_time}-{event.end_time}</p><p><b>tip recurență:</b> <RecurrenceBadge type={event.recurrence_type} /></p>
        <p><b>zile/zi lunara:</b> {event.recurrence_type === 'weekly' ? event.recurrence_days?.map((d) => weekdayLabels[d]).join(', ') : event.recurrence_type === 'monthly' ? event.monthly_day : '-'}</p>
        <p><b>conditie participare:</b> <SubscriptionRequirementBadge event={event} /></p><p><b>status:</b> <StatusBadge status={event.status} /></p><p><b>max participanti:</b> {event.max_participants ?? 'nelimitat'}</p>
      </div>
    </SectionCard>
  );
}

function EventOccurrencesPage() {
  const { eventId } = useParams();
  const id = Number(eventId);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', status: '' });
  const { event } = useEvent(id);
  const { occurrences, loading, error, reload } = useEventOccurrences(id, filters);
  const permissions = usePermissions();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const cancelOccurrence = async (occurrenceId: number) => {
    try {
      await eventService.cancelOccurrence(occurrenceId);
      setToast({ type: 'success', message: 'Aparitia a fost anulata.' });
      await reload();
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Nu am putut anula aparitia.' });
    }
  };
  return (
    <SectionCard title={`Aparitii eveniment ${event?.title ?? ''}`} action={<Link to="/erp/events" className="rounded-xl border px-4 py-2 text-sm font-semibold">Inapoi</Link>}>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4"><TextField label="date_from" type="date" value={filters.date_from} onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} /><TextField label="date_to" type="date" value={filters.date_to} onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} /><SelectField label="status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}><option value="">Toate</option>{occurrenceStatuses.map((s) => <option key={s}>{s}</option>)}</SelectField><button onClick={() => void reload()} className="mt-7 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"><RefreshCw className="mr-2 inline h-4 w-4" />Filtreaza</button></div>
      {error ? <p className="mt-4 text-red-600">{error}</p> : null}
      <div className="mt-6 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="pb-3">occurrence_date</th><th className="pb-3">start_datetime</th><th className="pb-3">end_datetime</th><th className="pb-3">status</th><th className="pb-3">participants</th><th className="pb-3">places</th><th className="pb-3 text-right">Actiuni</th></tr></thead><tbody>{occurrences.length ? occurrences.map((o) => <tr key={o.id} className="border-b border-slate-100"><td className="py-4">{o.occurrence_date}</td><td>{o.start_datetime}</td><td>{o.end_datetime}</td><td><StatusBadge status={o.status} /></td><td>{o.participants_count}</td><td>{o.available_places ?? 'nelimitat'}</td><td><div className="flex justify-end gap-2">{permissions.canViewParticipants ? <Link to={`${o.id}/participants`} className="rounded-xl border px-3 py-2"><Users className="h-4 w-4" /></Link> : null}{permissions.canManageParticipants ? <Link to={`${o.id}/participants?add=1`} className="rounded-xl border px-3 py-2"><Plus className="h-4 w-4" /></Link> : null}{permissions.canManageEvents ? <button onClick={() => void cancelOccurrence(o.id)} className="rounded-xl border px-3 py-2 text-red-600"><X className="h-4 w-4" /></button> : null}</div></td></tr>) : <tr><td colSpan={7} className="py-10 text-center text-slate-500">{loading ? 'Se incarca...' : 'Nu exista aparitii.'}</td></tr>}</tbody></table></div>
    </SectionCard>
  );
}

function AddParticipantModal({ occurrenceId, event, availableSlots, onClose, onSaved }: { occurrenceId: number; event?: EventItem; availableSlots?: number | null; onClose: () => void; onSaved: () => void }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<EventUser[]>([]);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<ParticipantStatus>('registered');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const blocked = availableSlots !== null && availableSlots !== undefined && availableSlots <= 0;
  useEffect(() => {
    if (search.length < 2) return;
    eventService.searchUsers(search).then((payload) => setUsers(Array.isArray(payload) ? payload : payload.data)).catch(() => setUsers([]));
  }, [search]);
  const save = async () => {
    if (blocked) return;
    setError('');
    try {
      await eventService.addOccurrenceParticipant(occurrenceId, { user_id: Number(userId), status, notes: notes || null });
      onSaved();
    } catch (err) {
      const apiError = err as ApiValidationError;
      setError(apiError.status === 422 ? 'Userul nu are o subscripție activă necesară pentru acest eveniment.' : apiError.message);
    }
  };
  return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-semibold">Add participant</h3>{event?.requires_active_subscription ? <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />Evenimentul necesita subscription activa.</p> : null}{blocked ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Nu exista locuri disponibile.</p> : null}{error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<div className="mt-4 space-y-3"><TextField label="Search user" value={search} onChange={(e) => setSearch(e.target.value)} /><SelectField label="User" value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Select user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email} ({u.email})</option>)}</SelectField><SelectField label="status" value={status} onChange={(e) => setStatus(e.target.value as ParticipantStatus)}>{participantStatuses.map((s) => <option key={s}>{s}</option>)}</SelectField><label><span className="mb-2 block text-sm font-medium">notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm" /></label></div><div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold">Inchide</button><button onClick={() => void save()} disabled={!userId || blocked} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Adauga</button></div></div></div>;
}

function EventParticipantsPage() {
  const { occurrenceId } = useParams();
  const id = Number(occurrenceId);
  const { participants, loading, error, reload } = useEventParticipants(id);
  const [occurrence, setOccurrence] = useState<{ event?: EventItem; available_places?: number | null } | null>(null);
  const [showAdd, setShowAdd] = useState(new URLSearchParams(window.location.search).get('add') === '1');
  const permissions = usePermissions();
  useEffect(() => {
    eventService.getOccurrence(id).then(setOccurrence).catch(() => setOccurrence(null));
  }, [id]);
  const remove = async (userId: number) => {
    await eventService.removeOccurrenceParticipant(id, userId);
    await reload();
  };
  const update = async (userId: number, status: ParticipantStatus) => {
    await eventService.updateOccurrenceParticipantStatus(id, userId, { status });
    await reload();
  };
  return <SectionCard title="Occurrence Participants" action={permissions.canManageParticipants ? <button onClick={() => setShowAdd(true)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="mr-2 inline h-4 w-4" />Add participant</button> : null}>{error ? <p className="text-red-600">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="pb-3">user name</th><th className="pb-3">email</th><th className="pb-3">status</th><th className="pb-3">registered_at</th><th className="pb-3">notes</th><th className="pb-3 text-right">Actiuni</th></tr></thead><tbody>{participants.length ? participants.map((p) => <tr key={p.user_id ?? p.id} className="border-b border-slate-100"><td className="py-4">{p.user?.name || `${p.user?.first_name ?? p.first_name ?? ''} ${p.user?.last_name ?? p.last_name ?? ''}`.trim() || '-'}</td><td>{p.user?.email ?? p.email ?? '-'}</td><td>{permissions.canManageParticipants ? <select value={p.status} onChange={(e) => void update(p.user_id ?? p.id ?? 0, e.target.value as ParticipantStatus)} className="rounded-xl border px-3 py-2">{participantStatuses.map((s) => <option key={s}>{s}</option>)}</select> : <StatusBadge status={p.status} />}</td><td>{p.registered_at}</td><td>{p.notes || '-'}</td><td className="text-right">{permissions.canManageParticipants ? <button onClick={() => void remove(p.user_id ?? p.id ?? 0)} className="rounded-xl border border-red-100 px-3 py-2 text-red-600"><Trash2 className="h-4 w-4" /></button> : null}</td></tr>) : <tr><td colSpan={6} className="py-10 text-center text-slate-500">{loading ? 'Se incarca...' : 'Nu exista participanti.'}</td></tr>}</tbody></table></div>{showAdd ? <AddParticipantModal occurrenceId={id} event={occurrence?.event} availableSlots={occurrence?.available_places} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); void reload(); }} /> : null}</SectionCard>;
}

export function EventsModuleRoutes() {
  return (
    <Routes>
      <Route path="" element={<EventsPage />} />
      <Route path="events" element={<EventsPage />} />
      <Route path="new" element={<EventForm mode="create" />} />
      <Route path="events/new" element={<EventForm mode="create" />} />
      <Route path=":eventId" element={<EventDetailsPage />} />
      <Route path="events/:eventId" element={<EventDetailsPage />} />
      <Route path=":eventId/edit" element={<EventForm mode="edit" />} />
      <Route path="events/:eventId/edit" element={<EventForm mode="edit" />} />
      <Route path=":eventId/occurrences" element={<EventOccurrencesPage />} />
      <Route path="events/:eventId/occurrences" element={<EventOccurrencesPage />} />
      <Route path=":eventId/occurrences/:occurrenceId/participants" element={<EventParticipantsPage />} />
      <Route path="events/:eventId/occurrences/:occurrenceId/participants" element={<EventParticipantsPage />} />
      <Route path="*" element={<Navigate to="/erp/events" replace />} />
    </Routes>
  );
}
