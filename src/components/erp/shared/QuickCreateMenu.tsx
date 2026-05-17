import { BadgeEuro, Bell, CreditCard, FileText, Users } from 'lucide-react';
import type React from 'react';
import { SectionCard } from '../../primitives';
import type { FormType } from '../../../types/erp';
import type { QuickCreateMenuProps } from './types';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function QuickCreateMenu({ onNavigate }: QuickCreateMenuProps) {
  const { hasAnyRight } = useAuth();
  const { t } = useTranslation();
  const actions: Array<{ key: FormType; label: string; icon: React.ComponentType<{ className?: string }>; rights?: string[] }> = [
    { key: 'member', label: t('quick.member'), icon: Users, rights: ['users.manage'] },
    { key: 'subscription', label: t('quick.subscription'), icon: BadgeEuro, rights: ['subscriptions.create', 'subscriptions.manage'] },
    { key: 'article', label: t('quick.article'), icon: Bell, rights: ['articles.create', 'articles.manage'] },
    { key: 'payment', label: t('quick.payment'), icon: CreditCard },
  ].filter((item) => !item.rights || hasAnyRight(item.rights));

  return (
    <SectionCard title={t('quick.title')} action={<FileText className="h-5 w-5 text-violet-600" />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} className="rounded-3xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
              <div className="inline-flex rounded-2xl bg-violet-100 p-3 text-violet-700"><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-base font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{t('quick.description')}</p>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
