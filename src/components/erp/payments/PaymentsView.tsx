import { Download, Pencil } from 'lucide-react';
import { SectionCard, StatusBadge } from '../../primitives';
import type { PaymentsViewProps } from '../shared/types';

export function PaymentsView({ items, onCreate, onEdit }: PaymentsViewProps) {
  return (
    <SectionCard title="Plăți și facturare" action={<div className="flex gap-2"><button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Download className="mr-2 inline h-4 w-4" />Export</button><button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Adaugă plată</button></div>}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Factură</th>
              <th className="pb-3 font-semibold">Membru</th>
              <th className="pb-3 font-semibold">Sumă</th>
              <th className="pb-3 font-semibold">Metodă</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-4 font-semibold text-slate-900">{item.invoice}</td>
                <td className="py-4 text-slate-600">{item.member}</td>
                <td className="py-4 text-slate-600">{item.amount}</td>
                <td className="py-4 text-slate-600">{item.method}</td>
                <td className="py-4"><StatusBadge status={item.status} /></td>
                <td className="py-4 text-right"><button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}