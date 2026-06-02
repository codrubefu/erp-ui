import { ChevronLeft, ChevronRight, LinkIcon, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, SectionCard, Select } from '../../primitives';
import { erpApiService, type ApiPayment } from '../../../services/ErpApiService';
import type { PaymentsViewProps } from '../shared/types';

type PaymentModelType = ApiPayment['model_type'];

const defaultMeta = { current_page: 1, last_page: 1, per_page: 15, total: 0 };
const paymentTypeLabels: Record<number, string> = { 1: 'cash', 2: 'card', 3: 'bank_transfer' };

function normalizeMeta<T>(payload: Awaited<ReturnType<typeof erpApiService.listPaginated<T>>>) {
  return {
    current_page: payload.meta?.current_page ?? payload.current_page ?? defaultMeta.current_page,
    last_page: payload.meta?.last_page ?? payload.last_page ?? defaultMeta.last_page,
    per_page: payload.meta?.per_page ?? payload.per_page ?? defaultMeta.per_page,
    total: payload.meta?.total ?? payload.total ?? payload.data.length,
  };
}

function formatAmount(amount: string | number) {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return String(amount);
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(numeric);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(date);
}

function adminLabel(payment: ApiPayment) {
  const admin = payment.admin;
  if (!admin) return payment.admin_id ? `#${payment.admin_id}` : '-';
  return admin.name || `${admin.first_name ?? ''} ${admin.last_name ?? ''}`.trim() || admin.email || `#${admin.id ?? payment.admin_id}`;
}

function AttachModelModal({ payment, onClose, onSaved }: { payment: ApiPayment; onClose: () => void; onSaved: () => void }) {
  const [modelType, setModelType] = useState<PaymentModelType>(payment.model_type ?? 'subscription_user');
  const [modelId, setModelId] = useState(payment.model_id ? String(payment.model_id) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!modelId) return;
    setSaving(true);
    setError('');
    try {
      await erpApiService.attachPaymentModel<ApiPayment>(payment.id, { model_type: modelType, model_id: Number(modelId) });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut atasa modelul.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Attach model pentru payment #{payment.id}</h3>
        {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <div className="mt-4 space-y-4">
          <Select label="model_type" value={modelType} onChange={(event) => setModelType(event.target.value as PaymentModelType)}>
            <option value="subscription_user">subscription_user</option>
            <option value="event_occurrence_user">event_occurrence_user</option>
          </Select>
          <Input label={modelType === 'event_occurrence_user' ? 'model_id participant event occurrence' : 'model_id subscription_user'} type="number" min={1} value={modelId} onChange={(event) => setModelId(event.target.value)} />
          <p className="text-sm text-slate-500">{modelType === 'event_occurrence_user' ? 'ID-ul trebuie sa fie relatia participantului la event occurrence.' : 'ID-ul trebuie sa fie relatia subscription_user.'}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anuleaza</button>
          <button onClick={() => void save()} disabled={!modelId || saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Attach model</button>
        </div>
      </div>
    </div>
  );
}

export function PaymentsView(props: PaymentsViewProps) {
  void props;
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [meta, setMeta] = useState(defaultMeta);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attachPayment, setAttachPayment] = useState<ApiPayment | null>(null);

  const loadPayments = useCallback(async (nextPage = page, nextPerPage = perPage) => {
    setLoading(true);
    setError('');
    try {
      const payload = await erpApiService.listPaginated<ApiPayment>('payments', { page: nextPage, per_page: nextPerPage });
      setPayments(payload.data);
      const nextMeta = normalizeMeta(payload);
      setMeta(nextMeta);
      setPage(nextMeta.current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut incarca platile.');
      setPayments([]);
      setMeta(defaultMeta);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    void loadPayments(1, perPage);
  }, [loadPayments, perPage]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p> : null}
      <SectionCard title="Payments" action={<div className="flex gap-2"><Link to="/erp/payments/new" className="inline-flex items-center rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="mr-2 h-4 w-4" />Adauga payment</Link><button onClick={() => void loadPayments(page, perPage)} disabled={loading} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button></div>}>
        <div className="mb-4 flex items-end gap-3">
          <Select label="per_page" value={perPage} onChange={(event) => { const value = Number(event.target.value); setPerPage(value); setPage(1); void loadPayments(1, value); }}>
            {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <span className="pb-3 text-sm text-slate-600">{loading ? 'Se incarca...' : `Afisare ${payments.length} din ${meta.total} plati.`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3">first_name</th><th className="pb-3">last_name</th><th className="pb-3">payment_type</th><th className="pb-3">model_type</th><th className="pb-3">model_id</th><th className="pb-3">amount</th><th className="pb-3">paid_at</th><th className="pb-3">admin</th><th className="pb-3 text-right">Actiuni</th></tr></thead>
            <tbody>{payments.length ? payments.map((payment) => <tr key={payment.id} className="border-b border-slate-100 align-top"><td className="py-4">{payment.first_name}</td><td className="py-4">{payment.last_name}</td><td className="py-4">{payment.payment_type ?? paymentTypeLabels[payment.payment_type_id] ?? '-'}</td><td className="py-4">{payment.model_type}</td><td className="py-4">{payment.model_id ?? '-'}</td><td className="py-4 font-semibold text-slate-900">{formatAmount(payment.amount)}</td><td className="py-4">{formatDate(payment.paid_at)}</td><td className="py-4">{adminLabel(payment)}</td><td className="py-4 text-right"><button onClick={() => setAttachPayment(payment)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><LinkIcon className="mr-2 h-4 w-4" />Attach model</button></td></tr>) : <tr><td colSpan={9} className="py-10 text-center text-slate-500">{loading ? 'Se incarca platile...' : 'Nu exista plati.'}</td></tr>}</tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { const next = Math.max(1, page - 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page <= 1} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"><ChevronLeft className="mr-2 h-4 w-4" />Anterior</button>
          <button onClick={() => { const next = Math.min(meta.last_page, page + 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page >= meta.last_page} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">Urmator<ChevronRight className="ml-2 h-4 w-4" /></button>
        </div>
      </SectionCard>
      {attachPayment ? <AttachModelModal payment={attachPayment} onClose={() => setAttachPayment(null)} onSaved={() => { setAttachPayment(null); setSuccess('Model atasat.'); void loadPayments(page, perPage); }} /> : null}
    </div>
  );
}
