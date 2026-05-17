import { MessageSquare, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SectionCard } from '../../primitives';

export function SmsView() {
  const { t } = useTranslation();
  const templates = ['expiry', 'payment', 'schedule', 'reminder'].map((key) => t(`sms.templates.${key}`));
  const logItems = ['sent', 'draft', 'savedReminder', 'expiryPrepared'].map((key) => t(`sms.log.${key}`));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title={t('sms.title')} action={<button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">{t('sms.new')}</button>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><Phone className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">{t('sms.individual')}</h4></div><p className="mt-3 text-sm text-slate-600">{t('sms.individualDescription')}</p></div>
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">{t('sms.bulk')}</h4></div><p className="mt-3 text-sm text-slate-600">{t('sms.bulkDescription')}</p></div>
            <div className="rounded-3xl border border-slate-200 p-5 md:col-span-2">
              <h4 className="font-semibold text-slate-900">{t('sms.templatesTitle')}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {templates.map((template) => <span key={template} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{template}</span>)}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      <div>
        <SectionCard title={t('sms.logTitle')}>
          <div className="space-y-3 text-sm">
            {logItems.map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3 text-slate-600">{item}</div>)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
