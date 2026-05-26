import { LogOut, Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../LanguageSelector';

type HeaderProps = {
  onToggleSidebar: () => void;
  onQuickCreate: () => void;
  onLogout: () => void;
  currentUser: string;
};

export function Header({ onToggleSidebar, onQuickCreate, onLogout, currentUser }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-2.5">
        <button onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 md:text-xl">Master Erp</h1>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('header.searchPlaceholder')} />
        </div>
        <LanguageSelector />
        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 md:block">{currentUser || t('common.administrator')}</div>
        <button onClick={onQuickCreate} className="rounded-2xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200">{t('common.quickAction')}</button>
        <button onClick={onLogout} className="rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700">
          <LogOut className="mr-2 inline h-4 w-4" />{t('common.logout')}
        </button>
      </div>
    </header>
  );
}
