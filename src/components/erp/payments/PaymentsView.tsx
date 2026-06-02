import { ChevronLeft, ChevronRight, LinkIcon, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, ButtonLink, DataTable, EmptyTableRow, Input, SectionCard, Select, TableCell, TableHeadCell, TableShell } from '../../primitives';
import type { ApiPayment } from '../../../services/ErpApiService';
import type { PaymentsViewProps } from '../shared/types';
import { formatApiDate, formatCurrency, paymentMethodLabel } from '../../../utils/erp/formatters';
import { paymentService } from '../../../services/paymentService';
import { useAuth } from '../../../context/AuthContext';

type PaymentModelType = ApiPayment['model_type'];

const defaultMeta = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

function normalizeMeta<T>(payload: { data: T[]; meta?: typeof defaultMeta; current_page?: number; last_page?: number; per_page?: number; total?: number }) {
  return {
    current_page: payload.meta?.current_page ?? payload.current_page ?? defaultMeta.current_page,
    last_page: payload.meta?.last_page ?? payload.last_page ?? defaultMeta.last_page,
    per_page: payload.meta?.per_page ?? payload.per_page ?? defaultMeta.per_page,
    total: payload.meta?.total ?? payload.total ?? payload.data.length,
  };
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
      await paymentService.attachModel(payment.id, { model_type: modelType, model_id: Number(modelId) });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut atasa modelul.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/40 p-4">
      <div className="mx-auto grid min-h-full place-items-center">
        <div className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Attach model pentru payment #{payment.id}</h3>
        {error ? <Alert tone="error" className="mt-3">{error}</Alert> : null}
        <div className="mt-4 space-y-4">
          <Select label="model_type" value={modelType} onChange={(event) => setModelType(event.target.value as PaymentModelType)}>
            <option value="subscription_user">subscription_user</option>
            <option value="event_occurrence_user">event_occurrence_user</option>
          </Select>
          <Input label={modelType === 'event_occurrence_user' ? 'model_id participant event occurrence' : 'model_id subscription_user'} type="number" min={1} value={modelId} onChange={(event) => setModelId(event.target.value)} />
          <p className="text-sm text-slate-500">{modelType === 'event_occurrence_user' ? 'ID-ul trebuie sa fie relatia participantului la event occurrence.' : 'ID-ul trebuie sa fie relatia subscription_user.'}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>Anuleaza</Button>
          <Button variant="primary" onClick={() => void save()} disabled={!modelId || saving}>Attach model</Button>
        </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentsView(props: PaymentsViewProps) {
  void props;
  const { hasAnyRight } = useAuth();
  const canViewPayments = hasAnyRight(['payments.view', 'payments.manage']);
  const canManagePayments = hasAnyRight(['payments.create', 'payments.update', 'payments.manage']);
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
      const payload = await paymentService.listPaginated(nextPage, nextPerPage);
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
    if (!canViewPayments) return;
    void loadPayments(1, perPage);
  }, [canViewPayments, loadPayments, perPage]);

  if (!canViewPayments) {
    return <SectionCard title="Payments"><Alert>Nu ai dreptul payments.view.</Alert></SectionCard>;
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
      <SectionCard title="Payments" action={<div className="flex gap-2">{canManagePayments ? <ButtonLink to="/erp/payments/new" variant="primary"><Plus className="h-4 w-4" />Adauga payment</ButtonLink> : null}<Button onClick={() => void loadPayments(page, perPage)} disabled={loading}><RefreshCw className="h-4 w-4" />Refresh</Button></div>}>
        <div className="mb-4 flex items-end gap-3">
          <Select label="per_page" value={perPage} onChange={(event) => { const value = Number(event.target.value); setPerPage(value); setPage(1); void loadPayments(1, value); }}>
            {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <span className="pb-3 text-sm text-slate-600">{loading ? 'Se incarca...' : `Afisare ${payments.length} din ${meta.total} plati.`}</span>
        </div>
        <TableShell>
          <DataTable>
            <thead><tr className="border-b border-slate-200"><TableHeadCell>first_name</TableHeadCell><TableHeadCell>last_name</TableHeadCell><TableHeadCell>payment_type</TableHeadCell><TableHeadCell>model_type</TableHeadCell><TableHeadCell>model_id</TableHeadCell><TableHeadCell>amount</TableHeadCell><TableHeadCell>paid_at</TableHeadCell><TableHeadCell>admin</TableHeadCell><TableHeadCell align="right">Actiuni</TableHeadCell></tr></thead>
            <tbody>{payments.length ? payments.map((payment) => <tr key={payment.id} className="border-b border-slate-100 align-top"><TableCell>{payment.first_name}</TableCell><TableCell>{payment.last_name}</TableCell><TableCell>{paymentMethodLabel(payment)}</TableCell><TableCell>{payment.model_type}</TableCell><TableCell>{payment.model_id ?? '-'}</TableCell><TableCell className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</TableCell><TableCell>{formatApiDate(payment.paid_at)}</TableCell><TableCell>{adminLabel(payment)}</TableCell><TableCell align="right">{canManagePayments ? <Button onClick={() => setAttachPayment(payment)}><LinkIcon className="h-4 w-4" />Attach model</Button> : null}</TableCell></tr>) : <EmptyTableRow colSpan={9}>{loading ? 'Se incarca platile...' : 'Nu exista plati.'}</EmptyTableRow>}</tbody>
          </DataTable>
        </TableShell>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => { const next = Math.max(1, page - 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page <= 1}><ChevronLeft className="h-4 w-4" />Anterior</Button>
          <Button onClick={() => { const next = Math.min(meta.last_page, page + 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page >= meta.last_page}>Urmator<ChevronRight className="h-4 w-4" /></Button>
        </div>
      </SectionCard>
      {attachPayment ? <AttachModelModal payment={attachPayment} onClose={() => setAttachPayment(null)} onSaved={() => { setAttachPayment(null); setSuccess('Model atasat.'); void loadPayments(page, perPage); }} /> : null}
    </div>
  );
}
