import { Eye, Pencil } from 'lucide-react';
import { SectionCard, StatusBadge } from '../../primitives';
import type { AnnouncementsViewProps } from '../shared/types';

export function AnnouncementsView({ items, onCreate, onEdit }: AnnouncementsViewProps) {
  return (
    <SectionCard title="Anunțuri" action={<button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Anunț nou</button>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{item.audience}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Publicare: {item.scheduled}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button>
              <button className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye className="mr-2 inline h-4 w-4" />Preview</button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}