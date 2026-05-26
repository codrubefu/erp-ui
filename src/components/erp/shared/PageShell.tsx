import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PageShellProps } from './types';

export function PageShell({ title, subtitle, backLabel, onBack, children }: PageShellProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-3xl bg-violet-50 px-4 py-3 text-sm text-violet-700">{t('common.localFormData')}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
