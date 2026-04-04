import {
  BadgeEuro,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  MessageSquare,
  UserCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

type SectionId = 'dashboard' | 'branches' | 'admins' | 'members' | 'subscriptions' | 'announcements' | 'sms' | 'payments' | 'reports';

type SidebarProps = {
  current: SectionId;
  setCurrent: (id: SectionId) => void;
  open: boolean;
};

type NavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  label?: string;
  icon?: LucideIcon;
  items: readonly NavItem[];
};

const navGroups: readonly NavGroup[] = [
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
      { id: 'announcements', label: 'Anunturi', icon: Bell },
      { id: 'sms', label: 'SMS & Notificari', icon: MessageSquare },
      { id: 'payments', label: 'Plati & Facturare', icon: CreditCard },
      { id: 'reports', label: 'Rapoarte', icon: FileBarChart2 },
    ],
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
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
              <p className="text-xs text-slate-500">Acces complet module si rapoarte</p>
            </div>
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
