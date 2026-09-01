import { BadgeEuro, Bell, CalendarDays, ChevronDown, Info, KeyRound, LogOut, Menu, Search, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!userMenuOpen && !mobileSearchOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setUserMenuOpen(false);
      setMobileSearchOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [userMenuOpen, mobileSearchOpen]);

  const profileItems = [
    { to: '/erp/profile-info', label: t('profile.info'), icon: Info },
    { to: '/erp/profile-security', label: t('profile.security'), icon: KeyRound },
    { to: '/erp/profile-privacy', label: t('profile.privacy', 'Privacy'), icon: ShieldCheck },
    { to: '/erp/profile-announcements', label: t('profile.announcements', 'Anunturi'), icon: Bell },
    ...(hasAnyRight(['events.view', 'events.manage']) ? [{ to: '/erp/profile-events', label: t('profile.events'), icon: CalendarDays }] : []),
    { to: '/erp/profile-services', label: t('profile.services'), icon: BadgeEuro },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1540px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6 xl:px-7">
      <div className="flex min-w-0 items-center gap-2.5">
        <button onClick={onToggleSidebar} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" aria-label={t('common.navigation', 'Deschide navigarea')} aria-controls="primary-navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-slate-400 min-[390px]:block">{t('common.administrator')}</p>
          <h1 className="max-w-[9rem] truncate text-sm font-bold text-slate-950 min-[390px]:max-w-[13rem] min-[390px]:text-base sm:max-w-none sm:text-lg">{organizationName}</h1>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/70 md:flex xl:w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('header.searchPlaceholder')} />
        </div>
        <button
          type="button"
          onClick={() => setMobileSearchOpen((value) => !value)}
          aria-label={mobileSearchOpen ? t('common.close', 'Inchide') : t('header.search', 'Cauta')}
          aria-expanded={mobileSearchOpen}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
        >
          {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
        <div className="hidden md:block"><LanguageSelector /></div>
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((value) => !value)}
            className="inline-flex h-11 max-w-56 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-expanded={userMenuOpen}
          >
            <UserCircle className="h-4 w-4 text-indigo-600" />
            <span className="hidden truncate sm:inline">{currentUser || t('common.administrator')}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {userMenuOpen ? (
            <div className="absolute right-0 mt-2 w-[min(15rem,calc(100vw-1rem))] rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
              {profileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 px-3 pt-2 md:hidden">
                <span className="text-sm font-medium text-slate-600">{t('common.language')}</span>
                <LanguageSelector />
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-md border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 md:hidden"
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </button>
            </div>
          ) : null}
        </div>
        <button onClick={onLogout} aria-label={t('common.logout')} className="hidden h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex">
          <LogOut className="h-4 w-4" /><span className="hidden xl:inline">{t('common.logout')}</span>
        </button>
      </div>
      </div>
      {mobileSearchOpen ? (
        <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-5 md:hidden">
          <div className="flex h-11 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/70">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={mobileSearchInputRef}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={t('header.searchPlaceholder')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setMobileSearchOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
