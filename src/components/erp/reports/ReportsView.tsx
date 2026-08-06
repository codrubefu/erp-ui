import { BarChart3, Download, FileSpreadsheet, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, Button, Input, SectionCard, Select } from '../../primitives';
import { useAuth } from '../../../context/useAuth';
import { erpApiService, type ApiLocation, type ApiUser } from '../../../services/ErpApiService';
import { reportingService, type FinancialReportAggregate, type FinancialReportFilters, type ReportExport, type ReportExportFormat } from '../../../services/reportingService';
import { segmentsService, type Segment, type SegmentCriteria } from '../../../services/segmentsService';
import type { ReportsViewProps } from '../shared/types';
import { formatCurrency } from '../../../utils/erp/formatters';

type FilterForm = {
  from: string;
  to: string;
  location_id: string;
  admin_id: string;
  payment_type_id: string;
  status: string;
  subscription_type: string;
  group_by: 'day' | 'month';
  segment_id: string;
};

type SegmentForm = {
  id: number | null;
  name: string;
  active: string;
  expired: boolean;
  expires_in_days: string;
  location_id: string;
  subscription_type: string;
};

const emptyFilters: FilterForm = {
  from: '',
  to: '',
  location_id: '',
  admin_id: '',
  payment_type_id: '',
  status: '',
  subscription_type: '',
  group_by: 'month',
  segment_id: '',
};

const emptySegmentForm: SegmentForm = {
  id: null,
  name: '',
  active: '',
  expired: false,
  expires_in_days: '',
  location_id: '',
  subscription_type: '',
};

const paymentStatuses = ['initiated', 'pending', 'confirmed', 'failed', 'refunded', 'cancelled'] as const;

function optionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildFilters(form: FilterForm): FinancialReportFilters {
  return {
    from: form.from || undefined,
    to: form.to || undefined,
    location_id: optionalNumber(form.location_id),
    admin_id: optionalNumber(form.admin_id),
    payment_type_id: optionalNumber(form.payment_type_id) as 1 | 2 | 3 | undefined,
    status: form.status ? form.status as FinancialReportFilters['status'] : undefined,
    subscription_type: form.subscription_type ? form.subscription_type as FinancialReportFilters['subscription_type'] : undefined,
    group_by: form.group_by,
    segment_id: optionalNumber(form.segment_id),
  };
}

function segmentCriteriaFromForm(form: SegmentForm): SegmentCriteria {
  return {
    active: form.active === '' ? undefined : form.active === 'true',
    expired: form.expired ? true : undefined,
    expires_in_days: optionalNumber(form.expires_in_days),
    location_id: optionalNumber(form.location_id),
    subscription_type: form.subscription_type ? form.subscription_type as SegmentCriteria['subscription_type'] : undefined,
  };
}

function segmentFormFrom(segment: Segment): SegmentForm {
  return {
    id: segment.id,
    name: segment.name,
    active: typeof segment.criteria.active === 'boolean' ? String(segment.criteria.active) : '',
    expired: Boolean(segment.criteria.expired),
    expires_in_days: segment.criteria.expires_in_days ? String(segment.criteria.expires_in_days) : '',
    location_id: segment.criteria.location_id ? String(segment.criteria.location_id) : '',
    subscription_type: segment.criteria.subscription_type ?? '',
  };
}

function userLabel(user: ApiUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || `#${user.id}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function Kpi({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function ReportsView(props: ReportsViewProps) {
  void props;
  const { t } = useTranslation();
  const { hasAnyRight } = useAuth();
  const canViewReports = hasAnyRight(['reports.view', 'reports.manage']);
  const canExportReports = hasAnyRight(['reports.export', 'reports.manage']);
  const canViewSegments = hasAnyRight(['segments.view', 'segments.manage', 'reports.view', 'reports.manage']);
  const canManageSegments = hasAnyRight(['segments.manage']);
  const [filters, setFilters] = useState<FilterForm>(emptyFilters);
  const [report, setReport] = useState<FinancialReportAggregate | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentError, setSegmentError] = useState('');
  const [segmentForm, setSegmentForm] = useState<SegmentForm>(emptySegmentForm);
  const [segmentMembers, setSegmentMembers] = useState<ApiUser[]>([]);
  const [segmentMembersLabel, setSegmentMembersLabel] = useState('');
  const [exportRecord, setExportRecord] = useState<ReportExport | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  const chartData = useMemo(() => report?.revenue_by_period ?? [], [report]);

  const loadReport = useCallback(async () => {
    if (!canViewReports) return;
    setReportLoading(true);
    setReportError('');
    try {
      setReport(await reportingService.getFinancialReport(buildFilters(filters)));
    } catch (err) {
      setReport(null);
      setReportError(err instanceof Error ? err.message : t('reports.financialLoadError'));
    } finally {
      setReportLoading(false);
    }
  }, [canViewReports, filters, t]);

  const loadSegments = useCallback(async () => {
    if (!canViewSegments) return;
    setSegmentsLoading(true);
    setSegmentError('');
    try {
      setSegments(await segmentsService.list());
    } catch (err) {
      setSegments([]);
      setSegmentError(err instanceof Error ? err.message : t('reports.segmentsLoadError'));
    } finally {
      setSegmentsLoading(false);
    }
  }, [canViewSegments, t]);

  useEffect(() => {
    if (!canViewReports) return;
    void loadReport();
  }, [canViewReports, loadReport]);

  useEffect(() => {
    if (!canViewSegments) return;
    void loadSegments();
  }, [canViewSegments, loadSegments]);

  useEffect(() => {
    Promise.all([
      erpApiService.list<ApiLocation>('locations', { per_page: 100 }).catch(() => []),
      erpApiService.list<ApiUser>('admins', { per_page: 100 }).catch(() => []),
    ]).then(([nextLocations, nextAdmins]) => {
      setLocations(nextLocations);
      setAdmins(nextAdmins);
    });
  }, []);

  const updateFilter = <K extends keyof FilterForm>(field: K, value: FilterForm[K]) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const updateSegmentForm = <K extends keyof SegmentForm>(field: K, value: SegmentForm[K]) => {
    setSegmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const createExport = async (format: ReportExportFormat) => {
    setExportLoading(true);
    setExportError('');
    try {
      setExportRecord(await reportingService.createExport(buildFilters(filters), format));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t('reports.exportError'));
    } finally {
      setExportLoading(false);
    }
  };

  const refreshExport = async () => {
    if (!exportRecord) return;
    setExportLoading(true);
    setExportError('');
    try {
      setExportRecord(await reportingService.getExport(exportRecord.id));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t('reports.exportStatusError'));
    } finally {
      setExportLoading(false);
    }
  };

  const downloadExport = async () => {
    if (!exportRecord) return;
    setExportLoading(true);
    setExportError('');
    try {
      const blob = await reportingService.downloadExport(exportRecord.id);
      downloadBlob(blob, `financial-report.${exportRecord.format}`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : t('reports.exportDownloadError'));
    } finally {
      setExportLoading(false);
    }
  };

  const saveSegment = async () => {
    if (!segmentForm.name.trim()) {
      setSegmentError(t('reports.segmentNameRequired'));
      return;
    }
    setSegmentsLoading(true);
    setSegmentError('');
    try {
      const payload = { name: segmentForm.name.trim(), criteria: segmentCriteriaFromForm(segmentForm) };
      if (segmentForm.id) {
        await segmentsService.update(segmentForm.id, payload);
      } else {
        await segmentsService.create(payload);
      }
      setSegmentForm(emptySegmentForm);
      await loadSegments();
    } catch (err) {
      setSegmentError(err instanceof Error ? err.message : t('reports.segmentSaveError'));
    } finally {
      setSegmentsLoading(false);
    }
  };

  const deleteSegment = async (segment: Segment) => {
    if (!window.confirm(t('reports.segmentDeleteConfirm', { name: segment.name }))) return;
    setSegmentsLoading(true);
    setSegmentError('');
    try {
      await segmentsService.delete(segment.id);
      if (filters.segment_id === String(segment.id)) updateFilter('segment_id', '');
      await loadSegments();
    } catch (err) {
      setSegmentError(err instanceof Error ? err.message : t('reports.segmentDeleteError'));
    } finally {
      setSegmentsLoading(false);
    }
  };

  const previewMembers = async (segment: Segment) => {
    setSegmentsLoading(true);
    setSegmentError('');
    try {
      const payload = await segmentsService.listMembers(segment.id, 15);
      setSegmentMembers(payload.data ?? []);
      setSegmentMembersLabel(segment.name);
    } catch (err) {
      setSegmentMembers([]);
      setSegmentError(err instanceof Error ? err.message : t('reports.segmentMembersError'));
    } finally {
      setSegmentsLoading(false);
    }
  };

  if (!canViewReports) {
    return <SectionCard title={t('reports.financialTitle')}><Alert>{t('reports.missingViewRight')}</Alert></SectionCard>;
  }

  return (
    <div className="space-y-6">
      {reportError ? <Alert tone="error">{reportError}</Alert> : null}
      <SectionCard title={t('reports.financialTitle')} action={<Button onClick={() => void loadReport()} disabled={reportLoading}><RefreshCw className="h-4 w-4" />{t('common.refresh')}</Button>}>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-4">
          <Input label={t('reports.filters.from')} type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
          <Input label={t('reports.filters.to')} type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
          <Select label={t('reports.filters.groupBy')} value={filters.group_by} onChange={(event) => updateFilter('group_by', event.target.value as FilterForm['group_by'])}>
            <option value="month">{t('reports.groupBy.month')}</option>
            <option value="day">{t('reports.groupBy.day')}</option>
          </Select>
          <Select label={t('reports.filters.status')} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">{t('common.all')}</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Select label={t('reports.filters.paymentType')} value={filters.payment_type_id} onChange={(event) => updateFilter('payment_type_id', event.target.value)}>
            <option value="">{t('common.all')}</option>
            <option value="1">Cash</option>
            <option value="2">Card</option>
            <option value="3">Bank transfer</option>
          </Select>
          <Select label={t('reports.filters.subscriptionType')} value={filters.subscription_type} onChange={(event) => updateFilter('subscription_type', event.target.value)}>
            <option value="">{t('common.all')}</option>
            <option value="membership">{t('subscriptions.types.membership')}</option>
            <option value="access_pass">{t('subscriptions.types.access_pass')}</option>
          </Select>
          <Select label={t('reports.filters.location')} value={filters.location_id} onChange={(event) => updateFilter('location_id', event.target.value)}>
            <option value="">{t('common.all')}</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </Select>
          <Select label={t('reports.filters.admin')} value={filters.admin_id} onChange={(event) => updateFilter('admin_id', event.target.value)}>
            <option value="">{t('common.all')}</option>
            {admins.map((admin) => <option key={admin.id} value={admin.id}>{userLabel(admin)}</option>)}
          </Select>
          <Select label={t('reports.filters.segment')} value={filters.segment_id} onChange={(event) => updateFilter('segment_id', event.target.value)}>
            <option value="">{t('common.all')}</option>
            {segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
          </Select>
          <div className="flex items-end gap-2 lg:col-span-3">
            <Button onClick={() => void loadReport()} disabled={reportLoading} variant="primary"><BarChart3 className="h-4 w-4" />{reportLoading ? t('common.loading') : t('reports.applyFilters')}</Button>
            <Button onClick={() => setFilters(emptyFilters)}>{t('users.resetFilters')}</Button>
          </div>
        </div>

        {report ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Kpi label={t('reports.kpis.confirmed')} value={formatCurrency(report.totals.confirmed)} helper={t('reports.kpis.transactions', { count: report.totals.count })} />
              <Kpi label={t('reports.kpis.refunded')} value={formatCurrency(report.totals.refunded)} />
              <Kpi label={t('reports.kpis.net')} value={formatCurrency(report.totals.net)} />
              <Kpi label={t('reports.kpis.renewals')} value={String(report.renewals)} />
              <Kpi label={t('reports.kpis.invoiced')} value={formatCurrency(report.receivables.invoiced)} helper={t('reports.receivables')} />
              <Kpi label={t('reports.kpis.paid')} value={formatCurrency(report.receivables.paid)} />
              <Kpi label={t('reports.kpis.outstanding')} value={formatCurrency(report.receivables.outstanding)} />
              <Kpi label={t('reports.kpis.unreconciled')} value={formatCurrency(report.bank_reconciliation.unreconciled)} helper={`${t('reports.kpis.reconciled')}: ${formatCurrency(report.bank_reconciliation.reconciled)}`} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{t('reports.revenueByPeriod')}</h3>
                <div className="mt-4 h-72">
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="total" fill="#5b45f0" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-slate-500">{t('reports.noRevenue')}</p>}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{t('reports.bankReconciliation')}</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>{t('reports.kpis.total')}: <b>{formatCurrency(report.bank_reconciliation.total)}</b></p>
                  <p>{t('reports.kpis.reconciled')}: <b>{formatCurrency(report.bank_reconciliation.reconciled)}</b></p>
                  <p>{t('reports.kpis.unreconciled')}: <b>{formatCurrency(report.bank_reconciliation.unreconciled)}</b></p>
                </div>
              </div>
            </div>
          </>
        ) : <p className="mt-5 text-sm text-slate-500">{reportLoading ? t('common.loading') : t('reports.noFinancialData')}</p>}
      </SectionCard>

      {canExportReports ? (
        <SectionCard title={t('reports.exports')} action={<div className="flex flex-wrap gap-2"><Button onClick={() => void createExport('csv')} disabled={exportLoading}><FileSpreadsheet className="h-4 w-4" />CSV</Button><Button onClick={() => void createExport('xlsx')} disabled={exportLoading}>XLSX</Button></div>}>
          {exportError ? <Alert tone="error" className="mb-4">{exportError}</Alert> : null}
          {exportRecord ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">#{exportRecord.id}</p>
                <p className="text-slate-600">{exportRecord.format.toUpperCase()} - {exportRecord.status}{exportRecord.error ? ` - ${exportRecord.error}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void refreshExport()} disabled={exportLoading}><RefreshCw className="h-4 w-4" />{t('reports.refreshExport')}</Button>
                {exportRecord.status === 'completed' ? <Button onClick={() => void downloadExport()} disabled={exportLoading} variant="primary"><Download className="h-4 w-4" />{t('reports.downloadExport')}</Button> : null}
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">{t('reports.noExport')}</p>}
        </SectionCard>
      ) : null}

      {canViewSegments ? (
        <SectionCard title={t('reports.segments')} action={<Button onClick={() => void loadSegments()} disabled={segmentsLoading}><RefreshCw className="h-4 w-4" />{t('common.refresh')}</Button>}>
          {segmentError ? <Alert tone="error" className="mb-4">{segmentError}</Alert> : null}
          {canManageSegments ? (
            <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-4">
              <Input label={t('reports.segmentName')} value={segmentForm.name} onChange={(event) => updateSegmentForm('name', event.target.value)} />
              <Select label={t('reports.criteria.active')} value={segmentForm.active} onChange={(event) => updateSegmentForm('active', event.target.value)}>
                <option value="">{t('common.all')}</option>
                <option value="true">{t('users.statusActive')}</option>
                <option value="false">{t('users.statusInactive')}</option>
              </Select>
              <Input label={t('reports.criteria.expiresInDays')} type="number" min="0" value={segmentForm.expires_in_days} onChange={(event) => updateSegmentForm('expires_in_days', event.target.value)} />
              <Select label={t('reports.criteria.location')} value={segmentForm.location_id} onChange={(event) => updateSegmentForm('location_id', event.target.value)}>
                <option value="">{t('common.all')}</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </Select>
              <Select label={t('reports.criteria.subscriptionType')} value={segmentForm.subscription_type} onChange={(event) => updateSegmentForm('subscription_type', event.target.value)}>
                <option value="">{t('common.all')}</option>
                <option value="membership">{t('subscriptions.types.membership')}</option>
                <option value="access_pass">{t('subscriptions.types.access_pass')}</option>
              </Select>
              <label className="flex h-10 items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={segmentForm.expired} onChange={(event) => updateSegmentForm('expired', event.target.checked)} className="h-4 w-4 accent-violet-600" />
                {t('reports.criteria.expired')}
              </label>
              <div className="flex items-end gap-2 lg:col-span-2">
                <Button onClick={() => void saveSegment()} disabled={segmentsLoading} variant="primary"><Save className="h-4 w-4" />{segmentForm.id ? t('common.save') : t('common.add')}</Button>
                <Button onClick={() => void saveSegment()} disabled={segmentsLoading} variant="dark"><Save className="h-4 w-4" />{t('common.saveAndClose')}</Button>
                <Button onClick={() => setSegmentForm(emptySegmentForm)}>{t('common.cancel')}</Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{t('reports.segmentName')}</th><th className="px-4 py-3">{t('reports.criteria.title')}</th><th className="px-4 py-3 text-right">{t('common.actions')}</th></tr></thead>
              <tbody>
                {segments.length ? segments.map((segment) => (
                  <tr key={segment.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{segment.name}</td>
                    <td className="px-4 py-3 text-slate-600"><pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(segment.criteria, null, 2)}</pre></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button onClick={() => {
                          const nextFilters = { ...filters, segment_id: String(segment.id) };
                          setFilters(nextFilters);
                          setReportLoading(true);
                          setReportError('');
                          reportingService.getFinancialReport(buildFilters(nextFilters))
                            .then(setReport)
                            .catch((err) => {
                              setReport(null);
                              setReportError(err instanceof Error ? err.message : t('reports.financialLoadError'));
                            })
                            .finally(() => setReportLoading(false));
                        }} size="sm">{t('reports.useSegment')}</Button>
                        <Button onClick={() => void previewMembers(segment)} size="sm">{t('reports.previewMembers')}</Button>
                        {canManageSegments ? <Button onClick={() => setSegmentForm(segmentFormFrom(segment))} size="sm">{t('common.edit')}</Button> : null}
                        {canManageSegments ? <Button onClick={() => void deleteSegment(segment)} size="sm" variant="danger"><Trash2 className="h-4 w-4" />{t('common.delete')}</Button> : null}
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">{segmentsLoading ? t('common.loading') : t('reports.noSegments')}</td></tr>}
              </tbody>
            </table>
          </div>

          {segmentMembersLabel ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{t('reports.previewFor', { name: segmentMembersLabel })}</h3>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {segmentMembers.length ? segmentMembers.map((member) => <div key={member.id} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{userLabel(member)}<p className="text-xs text-slate-500">{member.email}</p></div>) : <p className="text-sm text-slate-500">{t('reports.noSegmentMembers')}</p>}
              </div>
            </div>
          ) : null}
        </SectionCard>
      ) : null}
    </div>
  );
}
