import React from 'react';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  helper: string;
};

export function StatCard({ title, value, change, icon: Icon, helper }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_28px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_16px_38px_rgba(79,70,229,0.10)] lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950 xl:text-3xl">{value}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600">{change}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 p-2.5 text-indigo-600 ring-1 ring-indigo-100 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
