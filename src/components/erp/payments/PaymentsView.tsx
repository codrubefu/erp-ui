import { ChevronLeft, ChevronRight, Filter, RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard, Select, StatusBadge } from '../../primitives';
import { erpApiService, type ApiPayment } from '../../../services/ErpApiService';
import type { PaymentsViewProps } from '../shared/types';

const paymentTypeLabels: Record<number, string> = {
  1: 'Numerar',
  2: 'Card',
  3: 'Transfer bancar',
};

const defaultPaymentsMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

function paymentUserName(payment: ApiPayment) {
  const fromUser = payment.user ? `${payment.user.first_name ?? ''} ${payment.user.last_name ?? ''}`.trim() : '';
  return fromUser || `${payment.first_name ?? ''} ${payment.last_name ?? ''}`.trim() || '-';
}

function paymentStatus(payment: ApiPayment) {
  return payment.paid_at ? 'Platit' : 'In asteptare';
}

function paymentSubscriptionLabel(payment: ApiPayment) {
  return payment.subscription?.name ?? (payment.subscription_id ? `#${payment.subscription_id}` : '-');
}

function normalizeMeta<T>(payload: Awaited<ReturnType<typeof erpApiService.listPaginated<T>>>) {
  return {
    current_page: payload.meta?.current_page ?? payload.current_page ?? defaultPaymentsMeta.current_page,
    last_page: payload.meta?.last_page ?? payload.last_page ?? defaultPaymentsMeta.last_page,
    per_page: payload.meta?.per_page ?? payload.per_page ?? defaultPaymentsMeta.per_page,
    total: payload.meta?.total ?? payload.total ?? payload.data.length,
  };
}

function isWithinDateRange(payment: ApiPayment, startDate: string, endDate: string) {
  const paymentDate = payment.paid_at?.slice(0, 10) ?? payment.created_at?.slice(0, 10) ?? '';
  if (!paymentDate) return false;
  if (startDate && paymentDate < startDate) return false;
  if (endDate && paymentDate > endDate) return false;
  return true;
}

export function PaymentsView(props: PaymentsViewProps) {
  void props;
  const { t } = useTranslation();
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [paymentsMeta, setPaymentsMeta] = useState(defaultPaymentsMeta);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(15);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const visiblePayments = useMemo(() => {
    if (!startDate && !endDate) return payments;
    return payments.filter((payment) => isWithinDateRange(payment, startDate, endDate));
  }, [endDate, payments, startDate]);

  const loadPayments = useCallback(async (page: number, limit: number, filters: { start: string; end: string }) => {
    setLoading(true);
    setError('');
    try {
      const result = await erpApiService.listPaginated<ApiPayment>('payments', {
        page,
        per_page: limit,
        start_date: filters.start,
        end_date: filters.end,
      });
      const meta = normalizeMeta(result);
      setPayments(result.data);
      setPaymentsMeta(meta);
      setPaymentsPage(meta.current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut incarca payment-urile.');
      setPayments([]);
      setPaymentsMeta(defaultPaymentsMeta);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments(1, paymentsPerPage, { start: '', end: '' });
  }, [loadPayments, paymentsPerPage]);

  const deletePayment = async (payment: ApiPayment) => {
    if (!window.confirm(`Stergi payment-ul #${payment.id}?`)) return;
    setError('');
    setSuccess('');
    try {
      await erpApiService.remove('payments', payment.id);
      setSuccess('Payment sters.');
      await loadPayments(paymentsPage, paymentsPerPage, { start: startDate, end: endDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut sterge payment-ul.');
    }
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p> : null}

      <SectionCard
        title="Payments"
        action={
          <button onClick={() => void loadPayments(paymentsPage, paymentsPerPage, { start: startDate, end: endDate })} disabled={loading} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className="mr-2 inline h-4 w-4" />{t('common.refresh')}
          </button>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[180px_180px_140px_auto]">
          <Input label="Data start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input label="Data end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <Select label={t('users.perPage')} value={paymentsPerPage} onChange={(event) => {
            const nextPerPage = Number(event.target.value);
            setPaymentsPerPage(nextPerPage);
            setPaymentsPage(1);
            void loadPayments(1, nextPerPage, { start: startDate, end: endDate });
          }}>
            {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <div className="flex items-end gap-2">
            <button onClick={() => {
              setPaymentsPage(1);
              void loadPayments(1, paymentsPerPage, { start: startDate, end: endDate });
            }} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <Filter className="mr-2 inline h-4 w-4" />Filtreaza
            </button>
            <button onClick={() => {
              setStartDate('');
              setEndDate('');
              setPaymentsPage(1);
              void loadPayments(1, paymentsPerPage, { start: '', end: '' });
            }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <X className="mr-2 inline h-4 w-4" />Reset
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{loading ? 'Se incarca payment-urile...' : `Afisare ${visiblePayments.length} din ${paymentsMeta.total} payment-uri.`}</span>
          <span>{t('users.pageOf', { page: paymentsMeta.current_page, lastPage: paymentsMeta.last_page })}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">ID</th>
                <th className="pb-3 font-semibold">{t('payments.member')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.subscription')}</th>
                <th className="pb-3 font-semibold">{t('payments.amount')}</th>
                <th className="pb-3 font-semibold">{t('payments.method')}</th>
                <th className="pb-3 font-semibold">{t('common.status')}</th>
                <th className="pb-3 font-semibold">{t('payments.transactionDate')}</th>
                <th className="pb-3 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.length > 0 ? visiblePayments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 align-top">
                  <td className="py-4 font-semibold text-slate-900">#{payment.id}</td>
                  <td className="py-4 text-slate-600">{paymentUserName(payment)}</td>
                  <td className="py-4 text-slate-600">{paymentSubscriptionLabel(payment)}</td>
                  <td className="py-4 font-semibold text-slate-900">{payment.amount}</td>
                  <td className="py-4 text-slate-600">{paymentTypeLabels[payment.payment_type_id] ?? payment.payment_type ?? '-'}</td>
                  <td className="py-4"><StatusBadge status={paymentStatus(payment)} /></td>
                  <td className="py-4 text-slate-600">{payment.paid_at ?? '-'}</td>
                  <td className="py-4 text-right">
                    <button onClick={() => void deletePayment(payment)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">{loading ? 'Se incarca payment-urile...' : 'Nu exista payment-uri pentru filtrele curente.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => {
            const previousPage = Math.max(1, paymentsMeta.current_page - 1);
            setPaymentsPage(previousPage);
            void loadPayments(previousPage, paymentsPerPage, { start: startDate, end: endDate });
          }} disabled={loading || paymentsMeta.current_page <= 1} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            <ChevronLeft className="mr-2 h-4 w-4" />{t('users.previousPage')}
          </button>
          <button onClick={() => {
            const nextPage = Math.min(paymentsMeta.last_page, paymentsMeta.current_page + 1);
            setPaymentsPage(nextPage);
            void loadPayments(nextPage, paymentsPerPage, { start: startDate, end: endDate });
          }} disabled={loading || paymentsMeta.current_page >= paymentsMeta.last_page} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            {t('users.nextPage')}<ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
