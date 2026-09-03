import type React from 'react';
import { cn } from '../../../utils/ui/cn';

export function TableShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm', className)}><div className="overflow-x-auto">{children}</div></div>;
}

export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return <table className={cn('min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm text-slate-700 [&_tbody_tr:nth-child(even)]:bg-slate-50/45', className)}>{children}</table>;
}

export function TableHeadCell({ align = 'left', className, children }: { align?: 'left' | 'right'; className?: string; children: React.ReactNode }) {
  return <th className={cn('border-b border-slate-200 bg-slate-50 px-4 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500 first:pl-5 last:pr-5', align === 'right' && 'text-right', className)}>{children}</th>;
}

export function TableCell({ align = 'left', className, children, colSpan }: { align?: 'left' | 'right'; className?: string; children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('border-b border-slate-100 px-4 py-3 align-top transition-colors first:pl-5 last:pr-5 group-hover:bg-indigo-50/30', align === 'right' && 'text-right', className)}>{children}</td>;
}

export function EmptyTableRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-slate-500">{children}</TableCell>
    </tr>
  );
}
