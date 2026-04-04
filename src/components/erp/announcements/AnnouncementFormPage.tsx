import React from 'react';
import { Eye, Save } from 'lucide-react';
import { Input, SectionCard, Select, StatusBadge, Textarea } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import type { AnnouncementFormPageProps } from '../shared/types';

export function AnnouncementFormPage({ mode, data, onChange, onBack, onSave }: AnnouncementFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare anunț' : 'Adăugare anunț'} subtitle="Segmentare, programare publicare și conținut pentru comunicarea către membri." backLabel="Înapoi la anunțuri" onBack={onBack}>
      <SectionCard title="Detalii anunț" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID anunț" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="ANN-004" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Draft', 'Programat', 'Publicat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Titlu" value={data.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('title', e.target.value)} placeholder="Titlu anunț" /></div>
          <Input label="Audiență" value={data.audience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('audience', e.target.value)} placeholder="Toți membrii activi" />
          <Input label="Dată programare" value={data.scheduled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('scheduled', e.target.value)} placeholder="2026-04-15 10:00" />
          <div className="md:col-span-2"><Textarea label="Conținut" value={data.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('content', e.target.value)} placeholder="Textul anunțului..." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Eye className="mr-2 inline h-4 w-4" />Preview</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează anunț</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}