import React from 'react';
import { cn } from '../../../utils/ui/cn';

type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-600">{label}</span>
      <input {...props} className={cn('h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/80', className)} />
    </label>
  );
}
