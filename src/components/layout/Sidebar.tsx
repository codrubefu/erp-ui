import {
  BadgeEuro,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  CalendarDays,
  Megaphone,
  FileBarChart2,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';
import type { SectionId } from '../../types/erp';

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
      { id: 'location-groups', labelKey: 'menu.locationGroups', icon: FolderTree, rights: ['location_groups.view', 'location_groups.manage'] },
      { id: 'admins', labelKey: 'menu.admins', icon: UserCheck, rights: ['users.view', 'users.manage'] },
      { id: 'access', labelKey: 'menu.access', icon: ShieldCheck, rights: ['groups.view', 'groups.manage'] },
      { id: 'custom-fields', labelKey: 'menu.customFields', icon: SlidersHorizontal ,rights: ['custom-fields.view', 'custom-fields.manage'] },
    ],
  },
  {
    id: 'management',
    items: [
      { id: 'members', labelKey: 'menu.users', icon: Users, rights: ['users.view', 'users.manage'] },
      { id: 'subscriptions', labelKey: 'menu.subscriptions', icon: BadgeEuro, rights: ['subscriptions.view', 'subscriptions.manage'] },
      { id: 'events', labelKey: 'menu.events', icon: CalendarDays, rights: ['events.view', 'events.manage'] },
      { id: 'articles', labelKey: 'menu.articles', icon: Bell, rights: ['articles.view', 'articles.manage'] },
      { id: 'campaigns', labelKey: 'menu.campaigns', icon: Megaphone, rights: ['campaigns.view', 'campaigns.manage', 'reports.manage', 'users.manage'] },
      { id: 'sms', labelKey: 'menu.sms', icon: MessageSquare, rights: ['sms.view', 'sms.manage'] },
      { id: 'payments', labelKey: 'menu.payments', icon: CreditCard, rights: ['payments.view', 'payments.manage'] },
      { id: 'reports', labelKey: 'menu.reports', icon: FileBarChart2, rights: ['reports.view', 'reports.manage'] },
    ],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Sidebar({ current, setCurrent, open }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ organization: false });
  const { hasAnyRight } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200/70 bg-white/95 p-3.5 shadow-[8px_0_30px_rgba(15,23,42,0.025)] backdrop-blur-xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0 shadow-2xl shadow-slate-900/10' : '-translate-x-full')}>
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-100 px-2 pb-4 pt-2">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-indigo-500">ERP Console</p>
        </div>

        <nav className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !item.rights || hasAnyRight(item.rights));
            if (visibleItems.length === 0) return null;
            const GroupIcon = group.icon ?? Building2;
            const isGrouped = Boolean(group.labelKey);
            const isOpen = openGroups[group.id] ?? true;
            const groupLabel = group.labelKey ? t(group.labelKey) : '';

            return (
              <div key={group.id} className="space-y-1">
                {isGrouped ? (
                  <button
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="rounded-lg bg-slate-100/80 p-1.5 text-slate-600 ring-1 ring-slate-200/60">
                        <GroupIcon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{groupLabel}</span>
                    </span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                  </button>
                ) : null}

                {(!isGrouped || isOpen) && (
                  <div className={cn('space-y-1.5', isGrouped && 'ml-3 border-l border-slate-200/70 pl-2')}>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = current === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrent(item.id as SectionId)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-sm transition-all duration-200',
                            active ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-100/80 hover:text-slate-950'
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5 font-medium">
                            <span className={cn('rounded-lg p-1.5 transition', active ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-slate-100 text-slate-500')}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="truncate">{t(item.labelKey)}</span>
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
      </div>
    </aside>
  );
}
