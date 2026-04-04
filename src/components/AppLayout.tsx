import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BadgeEuro,
  Bell,
  MessageSquare,
  CreditCard,
  FileBarChart2,
  Search,
  ChevronRight,
  Menu,
  LogOut,
  Lock,
  User,
  Building2,
  UserCheck,
} from 'lucide-react';
import type { Credentials, SectionId } from '../App';

type LoginViewProps = {
  credentials: Credentials;
  onChange: (field: keyof Credentials, value: string) => void;
  onSubmit: () => void;
};

type HeaderProps = {
  onToggleSidebar: () => void;
  onQuickCreate: () => void;
  onLogout: () => void;
  currentUser: string;
};

type SidebarProps = {
  current: SectionId;
  setCurrent: (id: SectionId) => void;
  open: boolean;
};

const navGroups = [
  {
    id: 'general',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'organization',
    label: 'Organizare',
    icon: Building2,
    items: [
      { id: 'branches', label: 'Filiale', icon: Building2 },
      { id: 'admins', label: 'Administratori', icon: UserCheck },
    ],
  },
  {
    id: 'management',
    items: [
      { id: 'members', label: 'Membri', icon: Users },
      { id: 'subscriptions', label: 'Abonamente', icon: BadgeEuro },
      { id: 'announcements', label: 'Anun?uri', icon: Bell },
      { id: 'sms', label: 'SMS & Notificari', icon: MessageSquare },
      { id: 'payments', label: 'Pla?i & Facturare', icon: CreditCard },
      { id: 'reports', label: 'Rapoarte', icon: FileBarChart2 },
    ],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function LoginView({ credentials, onChange, onSubmit }: LoginViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-fuchsia-50 p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Master ERP</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight">Autentificare �n platforma de management pentru membri ?i opera?iuni.</h1>
            <p className="mt-4 max-w-xl text-base text-white/80">Acces rapid la membri, filiale, administratori, abonamente, anun?uri, pla?i ?i rapoarte. Datele introduse �n interfa?a sunt salvate local ?i ram�n valabile dupa refresh.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['Organizare', 'Filiale ?i administratori'],
              ['Abonamente', 'Creare ?i editare'],
              ['Pla?i', 'Istoric ?i facturare'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-lg font-semibold">{title}</p>
                <p className="mt-1 text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Login</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Conectare cont</h2>
              <p className="mt-2 text-sm text-slate-500">Pentru demo, orice date introduse sunt acceptate.</p>
            </div>
            <form
              className="space-y-5"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User className="h-4 w-4 text-violet-600" /> Utilizator / E-mail
                </div>
                <input
                  value={credentials.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('username', e.target.value)}
                  placeholder="admin@master-erp.ro"
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="h-4 w-4 text-violet-600" /> Parola
                </div>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('password', e.target.value)}
                  placeholder="Introdu parola"
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200">
                Intra �n aplica?ie
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ onToggleSidebar, onQuickCreate, onLogout, currentUser }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Master ERP</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Cauta membri, facturi, anun?uri..." />
        </div>
        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block">{currentUser || 'Administrator'}</div>
        <button onClick={onQuickCreate} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200">Ac?iune rapida</button>
        <button onClick={onLogout} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
          <LogOut className="mr-2 inline h-4 w-4" />Logout
        </button>
      </div>
    </header>
  );
}

export function Sidebar({ current, setCurrent, open }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ organization: true });

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-[#faf7ff] p-5 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-full flex-col">
        <nav className="mt-6 space-y-4">
          {navGroups.map((group) => {
            const GroupIcon = group.icon ?? Building2;
            const isGrouped = Boolean(group.label);
            const isOpen = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1">
                {isGrouped ? (
                  <button
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <GroupIcon className="h-4 w-4" />
                      </span>
                      {group.label}
                    </span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                  </button>
                ) : null}

                {(!isGrouped || isOpen) && (
                  <div className={cn('space-y-1', isGrouped && 'ml-4 border-l border-violet-100 pl-3')}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = current === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrent(item.id as SectionId)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition',
                            active ? 'bg-white text-violet-700 shadow-md ring-1 ring-violet-100' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                          )}
                        >
                          <span className="flex items-center gap-3 font-medium">
                            <span className={cn('rounded-xl p-2', active ? 'bg-violet-100' : 'bg-slate-100')}>
                              <Icon className="h-4 w-4" />
                            </span>
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Rol activ</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Administrator</p>
              <p className="text-xs text-slate-500">Acces complet module ?i rapoarte</p>
            </div>
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
