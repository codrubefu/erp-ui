import { Pencil } from 'lucide-react';
import { SectionCard, StatusBadge } from '../../primitives';
import type { SubscriptionsViewProps } from '../shared/types';

export function SubscriptionsView({ items, onCreate, onEdit }: SubscriptionsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title="Management abonamente / servicii" action={<button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Creează abonament</button>}>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Durată: {item.duration} • Reînnoiri: {item.renewals}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-sm text-slate-500">Preț</p><p className="font-semibold text-slate-900">{item.price}</p></div>
                  <StatusBadge status={item.status} />
                  <button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <div>
        <SectionCard title="Reguli automatizări">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Notificare expirare</p><p className="mt-1">Trimite SMS cu 7 și 1 zi înainte de expirare.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Suspendare / reluare</p><p className="mt-1">Control manual de către operator sau administrator.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Activare automată</p><p className="mt-1">După confirmarea plății și actualizarea statusului.</p></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}