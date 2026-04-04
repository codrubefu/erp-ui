import { Receipt } from 'lucide-react';
import type { ReportsViewProps } from '../shared/types';

export function ReportsView({ membersData, subscriptionsData, paymentsData, announcementsData }: ReportsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
      {[
        { title: 'Raport membri', desc: `${membersData.length} înregistrări salvate.` },
        { title: 'Raport abonamente', desc: `${subscriptionsData.length} tipuri de abonamente.` },
        { title: 'Raport plăți', desc: `${paymentsData.length} tranzacții existente.` },
        { title: 'Raport comunicări', desc: `${announcementsData.length} anunțuri salvate.` },
      ].map((item) => (
        <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Receipt className="h-6 w-6 text-violet-600" />
          <h4 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          <button className="mt-5 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Deschide raport</button>
        </div>
      ))}
    </div>
  );
}