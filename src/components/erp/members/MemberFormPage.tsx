import React from 'react';
import { Save } from 'lucide-react';
import { Input, SectionCard, Select, StatusBadge, Textarea } from '../../primitives';
import { initialBranches, initialSubscriptions } from '../shared/constants';
import { PageShell } from '../shared/PageShell';
import type { MemberFormPageProps } from '../shared/types';

export function MemberFormPage({ mode, data, onChange, onBack, onSave }: MemberFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare membru' : 'Adăugare membru'} subtitle="Profil complet membru / client, date contact, abonament și observații interne." backLabel="Înapoi la membri" onBack={onBack}>
      <SectionCard title="Date membru" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID membru" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="MBR-006" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Activ', 'Expirat', 'Suspendat', 'Rezervat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <Input label="Nume complet" value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)} placeholder="Nume membru" />
          <Input label="Telefon" value={data.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('phone', e.target.value)} placeholder="+40 7xx xxx xxx" />
          <Input label="E-mail" value={data.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('email', e.target.value)} placeholder="email@exemplu.ro" />
          <Select label="Filială" value={data.branch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('branch', e.target.value)}>
            <option value="">Selectează filiala</option>
            {initialBranches.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select label="Abonament asociat" value={data.subscription} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('subscription', e.target.value)}>
            <option value="">Selectează abonament</option>
            {initialSubscriptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </Select>
          <div className="md:col-span-2"><Input label="Adresă" value={data.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('address', e.target.value)} placeholder="Oraș, stradă, număr" /></div>
          <div className="md:col-span-2"><Textarea label="Observații" value={data.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('notes', e.target.value)} placeholder="Detalii interne, preferințe, istoric scurt..." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează membru</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}