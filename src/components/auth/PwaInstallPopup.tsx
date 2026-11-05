import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePwaInstall } from '../../utils/pwaInstall';

const DISMISS_KEY = 'master-erp-pwa-popup-dismissed';

export function PwaInstallPopup() {
  const { t } = useTranslation();
  const { canInstall, showIosHint, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => window.sessionStorage.getItem(DISMISS_KEY) === '1');

  if (dismissed || (!canInstall && !showIosHint)) return null;

  const close = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={close} aria-label={t('login.installLater')} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <img src="/pwa-64x64.png" alt="" className="h-12 w-12 rounded-xl" />
          <h3 id="pwa-install-title" className="text-lg font-semibold text-slate-900">{t('login.installTitle')}</h3>
        </div>
        <p className="mt-3 text-sm text-slate-600">{canInstall ? t('login.installDescription') : t('login.installIosHint')}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={close} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {t('login.installLater')}
          </button>
          {canInstall ? (
            <button
              type="button"
              onClick={async () => {
                await install();
                close();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5b45f0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4c38d6]"
            >
              <Download className="h-4 w-4" /> {t('login.installApp')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
