import React from 'react';
import { cn } from '../../../utils/ui/cn';

type TextareaProps = {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-600">{label}</span>
      <textarea {...props} className={cn('min-h-[112px] w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/80', className)} />
    </label>
  );
}
