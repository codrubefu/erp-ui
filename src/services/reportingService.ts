import { apiClient } from '../api/apiClient';
import { apiHeaders, endpoint, extractErrorMessage, parseJsonResponse } from '../api/apiCore';

export type FinancialReportGroupBy = 'day' | 'month';
export type ReportExportFormat = 'csv' | 'xlsx';
export type ReportExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type FinancialReportFilters = {
  from?: string;
  to?: string;
  organization_id?: number;
  location_id?: number;
  admin_id?: number;
  payment_type_id?: 1 | 2 | 3;
  status?: 'initiated' | 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled';
  service_type?: 'membership' | 'access_pass';
  group_by?: FinancialReportGroupBy;
  segment_id?: number;
};

export type FinancialReportAggregate = {
  totals: {
    confirmed: number;
    refunded: number;
    net: number;
    count: number;
  };
  revenue_by_period: Array<{
    period: string;
    total: number;
  }>;
  receivables: {
    invoiced: number;
    paid: number;
    outstanding: number;
  };
  renewals: number;
  bank_reconciliation: {
    total: number;
    reconciled: number;
    unreconciled: number;
  };
};

export type ReportExport = {
  id: string;
  organization_id: number;
  requested_by: number;
  format: ReportExportFormat;
  filters: FinancialReportFilters;
  status: ReportExportStatus;
  path?: string | null;
  error?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function queryFrom(filters: object) {
  const query = new URLSearchParams();
  Object.entries(filters as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

async function downloadExport(exportId: string) {
  const response = await fetch(endpoint(`/reports/exports/${exportId}/download`), {
    headers: apiHeaders(),
  });
  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new Error(extractErrorMessage(payload, `Cererea a esuat (${response.status}).`));
  }
  return response.blob();
}

export const reportingService = {
  getFinancialReport: (filters: FinancialReportFilters) => {
    const query = queryFrom(filters);
    return apiClient<FinancialReportAggregate>(`/reports/financial${query ? `?${query}` : ''}`);
  },
  createExport: (filters: FinancialReportFilters, format: ReportExportFormat) => {
    return apiClient<ReportExport>('/reports/financial/exports', {
      method: 'POST',
      body: JSON.stringify({ ...filters, format }),
    });
  },
  getExport: (exportId: string) => apiClient<ReportExport>(`/reports/exports/${exportId}`),
  downloadExport,
};
