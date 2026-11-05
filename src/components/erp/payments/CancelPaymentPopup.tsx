import { Ban, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Textarea } from '../../primitives';
import type { ApiPayment } from '../../../services/ErpApiService';
import { paymentService } from '../../../services/paymentService';

type CancelPaymentPopupProps = {
  payment: ApiPayment;
  onClose: () => void;
  onCancelled: (payment: ApiPayment) => void | Promise<void>;
};

export function CancelPaymentPopup({ payment, onClose, onCancelled }: CancelPaymentPopupProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await onCancelled(await paymentService.cancel(payment.id, reason.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payments.cancelFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/40 p-4">
      <div className="mx-auto grid min-h-full max-w-lg place-items-center">
        <div className="w-full rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('payments.cancelTitle')}</h3>
              <p className="text-sm text-slate-500">{payment.receipt_number}</p>
            </div>
            <Button onClick={onClose} size="icon"><X className="h-4 w-4" /></Button>
          </div>

          <Alert tone="error" className="mb-4">{t('payments.cancelWarning')}</Alert>
          {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

          <Textarea label={t('payments.cancelReason')} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />

          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={onClose}>{t('payments.cancelKeep')}</Button>
            <Button variant="dark" onClick={() => void submit()} disabled={saving || !reason.trim()}>
              <Ban className="h-4 w-4" />{saving ? t('common.saving') : t('payments.cancelConfirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
