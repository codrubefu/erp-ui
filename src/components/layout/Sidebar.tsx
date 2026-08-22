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
      { id: 'services', labelKey: 'menu.services', icon: BadgeEuro, rights: ['services.view', 'services.manage'] },
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
    <aside className={cn('fixed inset-y-0 left-0 z-30 w-[17rem] border-r border-slate-200 bg-white px-3 py-4 shadow-[1px_0_0_rgba(15,23,42,0.02)] transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0 shadow-2xl shadow-slate-900/10' : '-translate-x-full')}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-4 pt-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/20">
            O
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">Optimizer ERP</p>
            <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Admin panel</p>
          </div>
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
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="rounded-md bg-slate-100 p-1.5 text-slate-600 ring-1 ring-slate-200">
                        <GroupIcon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{groupLabel}</span>
                    </span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                  </button>
                ) : null}

                {(!isGrouped || isOpen) && (
                  <div className={cn('space-y-1', isGrouped && 'ml-3 border-l border-slate-200 pl-2')}>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = current === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrent(item.id as SectionId)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors duration-150',
                            active ? 'border border-indigo-100 bg-indigo-50 text-indigo-700 shadow-sm' : 'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5 font-medium">
                            <span className={cn('rounded-md p-1.5 transition', active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'bg-slate-100 text-slate-500')}>
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
