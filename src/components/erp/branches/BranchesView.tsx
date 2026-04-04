import { Building2 } from 'lucide-react';
import { SectionCard } from '../../primitives';
import type { BranchesViewProps } from '../shared/types';

export function BranchesView({ branches, membersData }: BranchesViewProps) {
  return (
    <SectionCard title="Filiale" action={<span className="rounded-2xl bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">{branches.length} filiale</span>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {branches.map((branch) => {
          const membersCount = membersData.filter((member) => member.branch === branch).length;
          const activeMembers = membersData.filter((member) => member.branch === branch && member.status === 'Activ').length;
          return (
            <div key={branch} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{branch}</h4>
                  <p className="mt-1 text-sm text-slate-500">Filială operațională</p>
                </div>
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Total membri:</span> {membersCount}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Membri activi:</span> {activeMembers}</div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}