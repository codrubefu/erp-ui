import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PaginationState = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type PaginationProps = {
  pagination: PaginationState;
  loading?: boolean;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

const DEFAULT_PER_PAGE_OPTIONS = [15, 25, 50, 100];

export function Pagination({ pagination, loading = false, perPageOptions = DEFAULT_PER_PAGE_OPTIONS, onPageChange, onPerPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const { current_page: page, last_page: lastPage, per_page: perPage } = pagination;
  const buttonClass = 'inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <div className="flex flex-wrap items-center gap-3">
        <span>{t('users.pageOf', { page, lastPage })}</span>
        {onPerPageChange ? (
          <label className="flex items-center gap-2">
            <span>{t('users.perPage')}</span>
            <select
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              disabled={loading}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              {perPageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={loading || page <= 1} className={buttonClass}>
          <ChevronLeft className="mr-1 h-4 w-4" />{t('users.previousPage')}
        </button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={loading || page >= lastPage} className={buttonClass}>
          {t('users.nextPage')}<ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
