import { MessageSquare, Phone } from 'lucide-react';
import { SectionCard } from '../../primitives';

export function SmsView() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title="SMS și notificări" action={<button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">SMS nou</button>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><Phone className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">SMS individual</h4></div><p className="mt-3 text-sm text-slate-600">Trimitere către un singur membru din profil sau listă.</p></div>
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">SMS bulk</h4></div><p className="mt-3 text-sm text-slate-600">Se poate crea campania și salva, fără trimitere automată implicită.</p></div>
            <div className="rounded-3xl border border-slate-200 p-5 md:col-span-2">
              <h4 className="font-semibold text-slate-900">Șabloane disponibile</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Expirare abonament', 'Confirmare plată', 'Program modificat', 'Reminder participare'].map((template) => <span key={template} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{template}</span>)}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      <div>
        <SectionCard title="Log mesaje">
          <div className="space-y-3 text-sm">
            {['SMS trimis către Andrei Popescu', 'Draft bulk creat pentru membri expirați', 'Reminder participare salvat ca șablon', 'Notificare expirare pregătită pentru 19 membri'].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3 text-slate-600">{item}</div>)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}