import type { ReactNode } from 'react';
import { cn } from '../../../utils/ui/cn';

type SuccessMessageProps = {
  children: ReactNode;
  className?: string;
};

export function SuccessMessage({ children, className }: SuccessMessageProps) {
  return (
    <div className={cn('mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700', className)}>
      {children}
    </div>
  );
}