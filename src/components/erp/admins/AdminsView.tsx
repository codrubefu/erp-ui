import { SectionCard, StatusBadge } from '../../primitives';

export function AdminsView() {
  return (
    <SectionCard title="Administratori" action={<button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Adaugă administrator</button>}>
      <div className="space-y-3">
        {['Administrator', 'Operator 1', 'Manager Filială'].map((role, index) => (
          <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <div>
              <p className="font-semibold text-slate-900">{role}</p>
              <p className="text-sm text-slate-500">Acces configurabil pe module</p>
            </div>
            <StatusBadge status="Activ" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}