import React from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard, Select, StatusBadge } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import type { PaymentFormPageProps } from '../shared/types';

export function PaymentFormPage({ mode, data, onChange, onBack, onSave, successMessage }: PaymentFormPageProps) {
  const { t } = useTranslation();

  return (
    <PageShell title={mode === 'edit' ? t('payments.edit') : t('payments.addInvoice')} subtitle={t('payments.formSubtitle')} backLabel={t('payments.backToList')} onBack={onBack}>
      <SectionCard title={t('payments.transactionDetails')} action={<StatusBadge status={data.status} />}>
        {successMessage ? <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</p> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label={t('payments.internalId')} value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="PAY-005" />
          <Input label={t('payments.invoice')} value={data.invoice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('invoice', e.target.value)} placeholder="INV-2026-105" />
          <Input label={t('payments.member')} value={data.member} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('member', e.target.value)} placeholder={t('payments.memberPlaceholder')} />
          <Input label={t('payments.amount')} value={data.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('amount', e.target.value)} placeholder="650 RON" />
          <Select label={t('payments.paymentMethod')} value={data.method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('method', e.target.value)}>
            {['Card', 'Numerar', 'Transfer'].map((item) => <option key={item} value={item}>{t(`payments.methods.${item}`)}</option>)}
          </Select>
          <Select label={t('common.status')} value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>
            {['Plătit', 'În așteptare', 'Eșuat'].map((item) => <option key={item} value={item}>{t(`payments.statuses.${item}`)}</option>)}
          </Select>
          <div className="md:col-span-2"><Input label={t('payments.transactionDate')} value={data.transactionDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('transactionDate', e.target.value)} placeholder="2026-04-03" /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />{t('payments.save')}</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
