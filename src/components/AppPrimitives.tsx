import React from 'react';

type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

type SelectProps = {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

type TextareaProps = {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  helper: string;
};

type SectionCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

type StatusBadgeProps = {
  status: string;
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function parsePrice(value: string | number) {
  const numeric = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function StatCard({ title, value, change, icon: Icon, helper }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-emerald-600">{change}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, string> = {
    Activ: 'bg-emerald-100 text-emerald-700',
    Expirat: 'bg-amber-100 text-amber-700',
    Suspendat: 'bg-rose-100 text-rose-700',
    Consumat: 'bg-slate-200 text-slate-700',
    Rezervat: 'bg-cyan-100 text-cyan-700',
    Draft: 'bg-slate-100 text-slate-700',
    Programat: 'bg-violet-100 text-violet-700',
    Publicat: 'bg-emerald-100 text-emerald-700',
    Platit: 'bg-emerald-100 text-emerald-700',
    'În a?teptare': 'bg-amber-100 text-amber-700',
    'E?uat': 'bg-rose-100 text-rose-700',
  };

  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', map[status] || 'bg-slate-100 text-slate-700')}>{status}</span>;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  );
}

export function Select({ label, children, ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, ...props }: TextareaProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea {...props} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  );
}

