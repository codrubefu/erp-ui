import React from 'react';
import { Save } from 'lucide-react';
import { Input, SectionCard, Select, StatusBadge, Textarea } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import type { SubscriptionFormPageProps } from '../shared/types';

export function SubscriptionFormPage({ mode, data, onChange, onBack, onSave }: SubscriptionFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare abonament' : 'Adăugare abonament'} subtitle="Configurare durată, preț, status și descriere pentru serviciu sau plan." backLabel="Înapoi la abonamente" onBack={onBack}>
      <SectionCard title="Detalii abonament" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID abonament" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="SUB-005" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Activ', 'Expirat', 'Suspendat', 'Consumat', 'Rezervat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Denumire abonament" value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)} placeholder="Premium 6 luni" /></div>
          <Input label="Durată" value={data.duration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('duration', e.target.value)} placeholder="6 luni / 10 ședințe" />
          <Input label="Preț" value={data.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('price', e.target.value)} placeholder="1200 RON" />
          <Input label="Număr reînnoiri" type="number" value={data.renewals} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('renewals', e.target.value)} placeholder="0" />
          <div className="md:col-span-2"><Textarea label="Descriere" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('description', e.target.value)} placeholder="Beneficii, acces, limitări, reguli de consum." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează abonament</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}