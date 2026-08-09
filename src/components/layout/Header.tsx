import { BadgeEuro, Bell, CalendarDays, ChevronDown, Info, KeyRound, LogOut, Menu, Search, ShieldCheck, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '../LanguageSelector';
import { useAuth } from '../../context/useAuth';

type HeaderProps = {
  onToggleSidebar: () => void;
  onLogout: () => void;
  currentUser: string;
  organizationName: string;
};

export function Header({ onToggleSidebar, onLogout, currentUser, organizationName }: HeaderProps) {
  const { t } = useTranslation();
  const { hasAnyRight } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const profileItems = [
    { to: '/erp/profile-info', label: t('profile.info'), icon: Info },
    { to: '/erp/profile-security', label: t('profile.security'), icon: KeyRound },
    { to: '/erp/profile-privacy', label: t('profile.privacy', 'Privacy'), icon: ShieldCheck },
    { to: '/erp/profile-announcements', label: t('profile.announcements', 'Anunturi'), icon: Bell },
    ...(hasAnyRight(['events.view', 'events.manage']) ? [{ to: '/erp/profile-events', label: t('profile.events'), icon: CalendarDays }] : []),
    { to: '/erp/profile-subscriptions', label: t('profile.subscriptions'), icon: BadgeEuro },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 shadow-[0_1px_12px_rgba(15,23,42,0.025)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-7 xl:px-10">
      <div className="flex min-w-0 items-center gap-2.5">
        <button onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" aria-label="Toggle navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-slate-400">{t('common.administrator')}</p>
          <h1 className="truncate text-lg font-bold tracking-[-0.015em] text-slate-950">{organizationName}</h1>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/60 md:flex xl:w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('header.searchPlaceholder')} />
        </div>
        <div className="hidden md:block"><LanguageSelector /></div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((value) => !value)}
            className="inline-flex h-10 max-w-56 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:shadow-md"
          >
            <UserCircle className="h-4 w-4 text-indigo-600" />
            <span className="hidden truncate sm:inline">{currentUser || t('common.administrator')}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {userMenuOpen ? (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              {profileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
        <button onClick={onLogout} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <LogOut className="h-4 w-4" /><span className="hidden xl:inline">{t('common.logout')}</span>
        </button>
      </div>
      </div>
    </header>
  );
}
