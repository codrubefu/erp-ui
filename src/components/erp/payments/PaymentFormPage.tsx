import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input, SectionCard, Select } from '../../primitives';
import { PageShell } from '../shared/PageShell';
import { erpApiService, type ApiPayment } from '../../../services/ErpApiService';
import type { PaymentFormPageProps } from '../shared/types';

type PaymentModelType = ApiPayment['model_type'];

const initialForm = {
  first_name: '',
  last_name: '',
  payment_type_id: '1',
  model_type: 'subscription_user' as PaymentModelType,
  model_id: '',
  amount: '',
  paid_at: '',
};

export function PaymentFormPage(props: PaymentFormPageProps) {
  void props;
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.first_name.trim()) nextErrors.first_name = 'first_name este obligatoriu.';
    if (!form.last_name.trim()) nextErrors.last_name = 'last_name este obligatoriu.';
    if (!form.payment_type_id) nextErrors.payment_type_id = 'payment_type_id este obligatoriu.';
    if (!form.model_type) nextErrors.model_type = 'model_type este obligatoriu.';
    if (!form.model_id) nextErrors.model_id = 'model_id este obligatoriu.';
    if (!form.amount) nextErrors.amount = 'amount este obligatoriu.';
    if (!form.paid_at) nextErrors.paid_at = 'paid_at este obligatoriu.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      await erpApiService.create<ApiPayment>('payments', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        payment_type_id: Number(form.payment_type_id),
        model_type: form.model_type,
        model_id: Number(form.model_id),
        amount: Number(form.amount),
        paid_at: form.paid_at,
      });
      navigate('/erp/payments');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Nu am putut salva plata.');
    } finally {
      setSaving(false);
    }
  };

  const modelIdLabel = form.model_type === 'event_occurrence_user' ? 'model_id participant event occurrence' : 'model_id subscription_user';

  return (
    <PageShell title="Adauga payment" subtitle="Creeaza o plata asociata explicit unui subscription_user sau event_occurrence_user." backLabel="Inapoi la payments" onBack={() => navigate('/erp/payments')}>
      <form onSubmit={save}>
        <SectionCard title="Payment details">
          {serverError ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</p> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><Input label="first_name" value={form.first_name} onChange={(event) => updateField('first_name', event.target.value)} />{errors.first_name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.first_name}</p> : null}</div>
            <div><Input label="last_name" value={form.last_name} onChange={(event) => updateField('last_name', event.target.value)} />{errors.last_name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.last_name}</p> : null}</div>
            <div><Select label="payment_type_id" value={form.payment_type_id} onChange={(event) => updateField('payment_type_id', event.target.value)}><option value="1">1 - cash</option><option value="2">2 - card</option><option value="3">3 - bank_transfer</option></Select>{errors.payment_type_id ? <p className="mt-1 text-xs font-medium text-red-600">{errors.payment_type_id}</p> : null}</div>
            <div><Select label="model_type" value={form.model_type} onChange={(event) => updateField('model_type', event.target.value as PaymentModelType)}><option value="subscription_user">subscription_user</option><option value="event_occurrence_user">event_occurrence_user</option></Select>{errors.model_type ? <p className="mt-1 text-xs font-medium text-red-600">{errors.model_type}</p> : null}</div>
            <div><Input label={modelIdLabel} type="number" min={1} value={form.model_id} onChange={(event) => updateField('model_id', event.target.value)} />{errors.model_id ? <p className="mt-1 text-xs font-medium text-red-600">{errors.model_id}</p> : null}<p className="mt-1 text-xs text-slate-500">{form.model_type === 'event_occurrence_user' ? 'ID-ul apartine relatiei participantului la event occurrence.' : 'ID-ul apartine relatiei subscription_user.'}</p></div>
            <div><Input label="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} />{errors.amount ? <p className="mt-1 text-xs font-medium text-red-600">{errors.amount}</p> : null}</div>
            <div><Input label="paid_at" type="datetime-local" value={form.paid_at} onChange={(event) => updateField('paid_at', event.target.value)} />{errors.paid_at ? <p className="mt-1 text-xs font-medium text-red-600">{errors.paid_at}</p> : null}</div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/erp/payments')} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anuleaza</button>
            <button disabled={saving} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save className="mr-2 inline h-4 w-4" />Salveaza payment</button>
          </div>
        </SectionCard>
      </form>
    </PageShell>
  );
}
