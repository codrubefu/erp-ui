import React from 'react';
import { cn } from '../../../utils/ui/cn';

type SelectProps = {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-600">{label}</span>
      <select {...props} className={cn('h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100', className)}>
        {children}
      </select>
    </label>
  );
}
