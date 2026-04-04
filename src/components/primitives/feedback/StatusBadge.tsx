import { cn } from '../../../utils/ui/cn';

type StatusBadgeProps = {
  status: string;
};

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
    Plătit: 'bg-emerald-100 text-emerald-700',
    'În așteptare': 'bg-amber-100 text-amber-700',
    Eșuat: 'bg-rose-100 text-rose-700',
  };

  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', map[status] || 'bg-slate-100 text-slate-700')}>{status}</span>;
}