import React from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input, SectionCard, StatusBadge, Textarea } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import type { SubscriptionFormPageProps } from '../shared/types';

export function SubscriptionFormPage({ mode, data, onChange, onBack, onSave }: SubscriptionFormPageProps) {
  const { t } = useTranslation();

  return (
    <PageShell title={mode === 'edit' ? t('subscriptions.edit') : t('subscriptions.add')} subtitle={t('subscriptions.formSubtitle')} backLabel={t('subscriptions.backToList')} onBack={onBack}>
      <SectionCard title={t('subscriptions.details')} action={<StatusBadge status={data.is_active ? 'Activ' : 'Inactiv'} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label={t('subscriptions.id')} value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="5" />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={data.is_active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('is_active', String(e.target.checked))} className="h-4 w-4 accent-violet-600" />
            {t('common.status')}
          </label>
          <div className="md:col-span-2"><Input label={t('subscriptions.name')} value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)} placeholder={t('subscriptions.namePlaceholder')} /></div>
          <Input label={t('subscriptions.duration')} type="number" value={data.duration_days ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('duration_days', e.target.value)} placeholder={t('subscriptions.durationPlaceholder')} />
          <Input label={t('subscriptions.price')} value={data.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('price', e.target.value)} placeholder="1200 RON" />
          <Input label="Moneda" value={data.currency} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('currency', e.target.value)} placeholder="EUR" />
          <Input label="Numar maxim utilizatori" type="number" value={data.max_users ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('max_users', e.target.value)} placeholder="25" />
          <div className="md:col-span-2"><Textarea label={t('subscriptions.description')} value={data.description ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('description', e.target.value)} placeholder={t('subscriptions.descriptionPlaceholder')} /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />{t('subscriptions.save')}</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
