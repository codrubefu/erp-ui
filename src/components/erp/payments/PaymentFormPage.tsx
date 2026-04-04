import React from 'react';
import { Save } from 'lucide-react';
import { Input, SectionCard, Select, StatusBadge } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import type { PaymentFormPageProps } from '../shared/types';

export function PaymentFormPage({ mode, data, onChange, onBack, onSave }: PaymentFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare plată / factură' : 'Adăugare plată / factură'} subtitle="Gestionare tranzacții, statusuri și asociere cu membrul și factura." backLabel="Înapoi la plăți" onBack={onBack}>
      <SectionCard title="Detalii tranzacție" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID intern" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="PAY-005" />
          <Input label="Factură" value={data.invoice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('invoice', e.target.value)} placeholder="INV-2026-105" />
          <Input label="Membru" value={data.member} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('member', e.target.value)} placeholder="Nume membru" />
          <Input label="Sumă" value={data.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('amount', e.target.value)} placeholder="650 RON" />
          <Select label="Metodă plată" value={data.method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('method', e.target.value)}>{['Card', 'Numerar', 'Transfer'].map((item) => <option key={item}>{item}</option>)}</Select>
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Plătit', 'În așteptare', 'Eșuat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Data tranzacției" value={data.transactionDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('transactionDate', e.target.value)} placeholder="2026-04-03" /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează tranzacție</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}