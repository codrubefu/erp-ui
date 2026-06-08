import type React from 'react';
import { cn } from '../../../utils/ui/cn';

export function TableShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('overflow-x-auto rounded-xl border border-slate-200', className)}>{children}</div>;
}

export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return <table className={cn('min-w-[920px] w-full border-separate border-spacing-0 text-left text-sm', className)}>{children}</table>;
}

export function TableHeadCell({ align = 'left', className, children }: { align?: 'left' | 'right'; className?: string; children: React.ReactNode }) {
  return <th className={cn('bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500', align === 'right' && 'text-right', className)}>{children}</th>;
}

export function TableCell({ align = 'left', className, children, colSpan }: { align?: 'left' | 'right'; className?: string; children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('border-t border-slate-100 px-4 py-3 align-top', align === 'right' && 'text-right', className)}>{children}</td>;
}

export function EmptyTableRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-slate-500">{children}</TableCell>
    </tr>
  );
}
