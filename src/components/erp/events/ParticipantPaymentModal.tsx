import { Save, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select } from '../../primitives';
import type { EventItem, EventParticipant } from '../../../services/eventService';
import { paymentService } from '../../../services/paymentService';
import { currentDateTimeLocal, dateTimeLocalToApi } from '../../../utils/erp/formatters';

function participantPaymentModelId(participant: EventParticipant) {
  return participant.id ?? null;
}

export function ParticipantPaymentModal({ participant, occurrence, onClose, onSaved }: { participant: EventParticipant; occurrence: { event?: EventItem } | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const modelId = participantPaymentModelId(participant);
  const event = occurrence?.event;
  const [firstName, setFirstName] = useState(participant.user?.first_name ?? participant.first_name ?? '');
  const [lastName, setLastName] = useState(participant.user?.last_name ?? participant.last_name ?? '');
  const [amount, setAmount] = useState(event?.payment_amount ? String(event.payment_amount) : '');
  const [currency, setCurrency] = useState(event?.payment_type ?? 'RON');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [paidAt, setPaidAt] = useState(currentDateTimeLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const savePayment = async () => {
    const numericAmount = Number(amount);
    const numericPaymentTypeId = Number(paymentTypeId);
    setError('');

    if (!modelId) {
      setError(t('events.missingParticipantModelId'));
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !paidAt) {
      setError(t('events.participantPaymentRequired'));
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t('events.paymentAmountPositive'));
      return;
    }
    if (![1, 2, 3].includes(numericPaymentTypeId)) {
      setError(t('events.selectPaymentMethod'));
      return;
    }

    setSaving(true);
    try {
      await paymentService.create({
        model_type: 'event_occurrence_user',
        model_id: modelId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        amount: numericAmount,
        payment_type_id: numericPaymentTypeId as 1 | 2 | 3,
        paid_at: dateTimeLocalToApi(paidAt),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('events.paymentSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('events.addParticipantPayment')}</h3>
            <p className="text-sm text-slate-500">{t('events.linkedEventOccurrenceUser', { id: modelId ?? '-' })}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="first_name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <Input label="last_name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          <Input label="amount" type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <Input label="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} />
          <Select label="payment method" value={paymentTypeId} onChange={(event) => setPaymentTypeId(event.target.value)}>
            <option value="">{t('common.select')}</option>
            <option value="1">Cash</option>
            <option value="2">Card</option>
            <option value="3">Bank transfer</option>
          </Select>
          <Input label="paid_at" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
        </div>
        <p className="mt-3 text-xs text-slate-500">{t('events.currencyInformative')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t('common.cancel')}</button>
          <button onClick={() => void savePayment()} disabled={saving} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save className="mr-2 inline h-4 w-4" />{saving ? t('common.saving') : t('events.savePayment')}
          </button>
        </div>
      </div>
    </div>
  );
}
