import { ChevronLeft, ChevronRight, Download, LinkIcon, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, ButtonLink, DataTable, EmptyTableRow, SectionCard, Select, StatusBadge, TableCell, TableHeadCell, TableShell } from '../../primitives';
import type { ApiPayment } from '../../../services/ErpApiService';
import type { PaymentsViewProps } from '../shared/types';
import { formatApiDate, formatCurrency, paymentMethodLabel } from '../../../utils/erp/formatters';
import { paymentService } from '../../../services/paymentService';
import { useAuth } from '../../../context/useAuth';

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
  const name = 'name' in admin ? admin.name : undefined;
  return name || `${admin.first_name ?? ''} ${admin.last_name ?? ''}`.trim() || admin.email || `#${admin.id ?? payment.admin_id}`;
}

function resolvePaymentModelLink(payment: ApiPayment) {
  if (payment.model_type === 'service_user' && payment.service_id) {
    return {
      to: `/erp/services/${payment.service_id}/members`,
      label: 'Vezi service',
      title: `Deschide membrii pentru service #${payment.service_id}`,
    };
  }

  return null;
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
  const [success] = useState('');
  const [receiptLoadingId, setReceiptLoadingId] = useState<number | null>(null);

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

  const downloadReceipt = async (payment: ApiPayment) => {
    setReceiptLoadingId(payment.id);
    setError('');
    try {
      const blob = await paymentService.downloadReceipt(payment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.receipt_number ?? payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut descarca receipt-ul.');
    } finally {
      setReceiptLoadingId(null);
    }
  };

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
      <SectionCard title="Payments" action={<>{canManagePayments ? <ButtonLink to="/erp/payments/new" variant="primary"><Plus className="h-4 w-4" />Adauga payment</ButtonLink> : null}<Button onClick={() => void loadPayments(page, perPage)} disabled={loading}><RefreshCw className="h-4 w-4" />Refresh</Button></>}>
        <div className="mb-4 grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[160px_1fr]">
          <Select label="per_page" value={perPage} onChange={(event) => { const value = Number(event.target.value); setPerPage(value); setPage(1); void loadPayments(1, value); }}>
            {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <span className="pb-2 text-sm font-medium text-slate-600">{loading ? 'Se incarca...' : `Afisare ${payments.length} din ${meta.total} plati.`}</span>
        </div>
        <TableShell>
          <DataTable className="min-w-[1100px]">
            <thead><tr><TableHeadCell>first_name</TableHeadCell><TableHeadCell>last_name</TableHeadCell><TableHeadCell>status</TableHeadCell><TableHeadCell>payment_type</TableHeadCell><TableHeadCell>provider</TableHeadCell><TableHeadCell>receipt</TableHeadCell><TableHeadCell>model</TableHeadCell><TableHeadCell>amount</TableHeadCell><TableHeadCell>paid_at</TableHeadCell><TableHeadCell>lifecycle</TableHeadCell><TableHeadCell>admin</TableHeadCell><TableHeadCell align="right">Actiuni</TableHeadCell></tr></thead>
            <tbody>{payments.length ? payments.map((payment) => {
              const modelLink = resolvePaymentModelLink(payment);

              const canDownloadReceipt = payment.status === 'confirmed' && Boolean(payment.receipt_number);

              return <tr key={payment.id} className="group align-top transition-colors hover:bg-indigo-50/30"><TableCell className="font-medium text-slate-900">{payment.first_name}</TableCell><TableCell className="font-medium text-slate-900">{payment.last_name}</TableCell><TableCell>{payment.status ? <StatusBadge status={payment.status} /> : '-'}</TableCell><TableCell>{paymentMethodLabel(payment)}</TableCell><TableCell><p>{payment.provider ?? '-'}</p><p className="text-xs text-slate-500">{payment.provider_transaction_id ?? payment.external_reference ?? ''}</p></TableCell><TableCell>{payment.receipt_number ?? '-'}</TableCell><TableCell><p>{payment.model_type}</p><p className="text-xs text-slate-500">model_id {payment.model_id ?? '-'}</p><p className="text-xs text-slate-500">org {payment.organization_id ?? '-'} / loc {payment.location_id ?? '-'}</p></TableCell><TableCell className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</TableCell><TableCell>{formatApiDate(payment.paid_at)}</TableCell><TableCell><p>confirmed {formatApiDate(payment.confirmed_at)}</p><p>failed {formatApiDate(payment.failed_at)}</p>{payment.failure_reason ? <p className="text-xs text-red-600">{payment.failure_reason}</p> : null}</TableCell><TableCell>{adminLabel(payment)}</TableCell><TableCell align="right"><div className="flex flex-wrap justify-end gap-2">{canDownloadReceipt ? <Button onClick={() => void downloadReceipt(payment)} disabled={receiptLoadingId === payment.id} size="sm"><Download className="h-4 w-4" />Receipt</Button> : null}{modelLink ? <ButtonLink to={modelLink.to} size="sm" title={modelLink.title}><LinkIcon className="h-4 w-4" />{modelLink.label}</ButtonLink> : <span className="text-sm text-slate-500">Model fara ruta directa</span>}</div></TableCell></tr>;
            }) : <EmptyTableRow colSpan={12}>{loading ? 'Se incarca platile...' : 'Nu exista plati.'}</EmptyTableRow>}</tbody>
          </DataTable>
        </TableShell>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button onClick={() => { const next = Math.max(1, page - 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page <= 1}><ChevronLeft className="h-4 w-4" />Anterior</Button>
          <Button onClick={() => { const next = Math.min(meta.last_page, page + 1); setPage(next); void loadPayments(next, perPage); }} disabled={loading || page >= meta.last_page}>Urmator<ChevronRight className="h-4 w-4" /></Button>
        </div>
      </SectionCard>
    </div>
  );
}
