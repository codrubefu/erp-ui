import {
  BadgeEuro,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  CalendarDays,
  FileBarChart2,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../LanguageSelector';

type SectionId = 'dashboard' | 'branches' | 'admins' | 'access' | 'members' | 'subscriptions' | 'events' | 'articles' | 'announcements' | 'sms' | 'payments' | 'reports';

type SidebarProps = {
  current: SectionId;
  setCurrent: (id: SectionId) => void;
  open: boolean;
};

type NavItem = {
  id: SectionId;
  labelKey: string;
  icon: LucideIcon;
  rights?: string[];
};

type NavGroup = {
  id: string;
  labelKey?: string;
  icon?: LucideIcon;
  items: readonly NavItem[];
};

const navGroups: readonly NavGroup[] = [
  {
    id: 'general',
    items: [{ id: 'dashboard', labelKey: 'menu.dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'organization',
    labelKey: 'menu.organization',
    icon: Building2,
    items: [
      { id: 'branches', labelKey: 'menu.branches', icon: Building2, rights: ['locations.view', 'locations.manage'] },
      { id: 'admins', labelKey: 'menu.admins', icon: UserCheck, rights: ['users.view', 'users.manage'] },
      { id: 'access', labelKey: 'menu.access', icon: ShieldCheck, rights: ['groups.view', 'groups.manage'] },
    ],
  },
  {
    id: 'management',
    items: [
      { id: 'members', labelKey: 'menu.users', icon: Users, rights: ['users.view', 'users.manage'] },
      { id: 'subscriptions', labelKey: 'menu.subscriptions', icon: BadgeEuro, rights: ['subscriptions.view', 'subscriptions.manage'] },
      { id: 'events', labelKey: 'menu.events', icon: CalendarDays, rights: ['events.view', 'events.manage'] },
      { id: 'articles', labelKey: 'menu.articles', icon: Bell, rights: ['articles.view', 'articles.manage'] },
      { id: 'sms', labelKey: 'menu.sms', icon: MessageSquare },
      { id: 'payments', labelKey: 'menu.payments', icon: CreditCard },
      { id: 'reports', labelKey: 'menu.reports', icon: FileBarChart2 },
    ],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Sidebar({ current, setCurrent, open }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ organization: true });
  const { hasAnyRight } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 w-[17rem] border-r border-slate-200 bg-[#faf7ff] p-4 transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-full flex-col">
        <nav className="mt-4 space-y-3">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !item.rights || hasAnyRight(item.rights));
            if (visibleItems.length === 0) return null;
            const GroupIcon = group.icon ?? Building2;
            const isGrouped = Boolean(group.labelKey);
            const isOpen = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1">
                {isGrouped ? (
                  <button
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <GroupIcon className="h-4 w-4" />
                      </span>
                      {group.labelKey ? t(group.labelKey) : ''}
                    </span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                  </button>
                ) : null}

                {(!isGrouped || isOpen) && (
                  <div className={cn('space-y-1', isGrouped && 'ml-3 border-l border-violet-100 pl-3')}>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = current === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrent(item.id as SectionId)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm transition',
                            active ? 'bg-white text-violet-700 shadow-md ring-1 ring-violet-100' : 'text-slate-600 hover:bg-white hover:shadow-sm'
                          )}
                        >
                          <span className="flex items-center gap-2.5 font-medium">
                            <span className={cn('rounded-xl p-2', active ? 'bg-violet-100' : 'bg-slate-100')}>
                              <Icon className="h-4 w-4" />
                            </span>
                            {t(item.labelKey)}
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

        <div className="mt-auto rounded-3xl border border-violet-100 bg-white p-3.5 shadow-sm">
          <div className="mb-2.5"><LanguageSelector /></div>
          <p className="text-sm font-semibold text-slate-900">{t('common.currentRole')}</p>
          <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('common.administrator')}</p>
              <p className="text-xs text-slate-500">{t('common.fullAccess')}</p>
            </div>
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
