import { ArrowLeft } from 'lucide-react';
import type { PageShellProps } from './types';

export function PageShell({ title, subtitle, backLabel, onBack, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-3xl bg-violet-50 p-4 text-sm text-violet-700">Datele completate aici sunt salvate local și rămân valabile.</div>
        </div>
      </div>
      {children}
    </div>
  );
}