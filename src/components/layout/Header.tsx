import { LogOut, Menu, Plus, Search, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../LanguageSelector';

type HeaderProps = {
  onToggleSidebar: () => void;
  onQuickCreate: () => void;
  onLogout: () => void;
  currentUser: string;
  organizationName: string;
};

export function Header({ onToggleSidebar, onQuickCreate, onLogout, currentUser, organizationName }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <button onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" aria-label="Toggle navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">{t('common.administrator')}</p>
          <h1 className="truncate text-lg font-bold text-slate-950">{organizationName}</h1>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex xl:w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('header.searchPlaceholder')} />
        </div>
        <div className="hidden md:block"><LanguageSelector /></div>
        <div className="hidden h-10 max-w-52 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 lg:flex">
          <UserCircle className="h-4 w-4 text-indigo-600" />
          <span className="truncate">{currentUser || t('common.administrator')}</span>
        </div>
        <button onClick={onQuickCreate} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#5b45f0] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4c38d6]">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('common.quickAction')}</span>
        </button>
        <button onClick={onLogout} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <LogOut className="h-4 w-4" /><span className="hidden xl:inline">{t('common.logout')}</span>
        </button>
      </div>
      </div>
    </header>
  );
}
