import React from 'react';
import { cn } from '../../../utils/ui/cn';

type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100', className)} />
    </label>
  );
}
