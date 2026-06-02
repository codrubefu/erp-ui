import type { ApiPayment } from '../../services/ErpApiService';

export function formatCurrency(amount: string | number, currency = 'RON', locale = 'ro-RO') {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return String(amount);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'RON' }).format(numeric);
}

export function formatApiDate(value?: string | null, locale = 'ro-RO') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: value.includes('T') || value.includes(' ') ? 'short' : undefined }).format(date);
}

export function paymentMethodLabel(payment: Pick<ApiPayment, 'payment_type_id' | 'payment_type'>) {
  if (payment.payment_type_id === 1) return 'Cash';
  if (payment.payment_type_id === 2) return 'Card';
  if (payment.payment_type_id === 3) return 'Bank transfer';
  return payment.payment_type ?? '-';
}

export function currentDateTimeLocal() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function dateTimeLocalToApi(value: string) {
  return value ? value.replace('T', ' ') : value;
}
