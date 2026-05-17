import { BadgeEuro, Building2, CalendarClock, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SectionCard, StatCard } from '../../primitives';
import { parsePrice } from '../../../utils/erp/parsePrice';
import type { DashboardViewProps } from '../shared/types';

export function DashboardView({ membersData, subscriptionsData, paymentsData, activityData }: DashboardViewProps) {
  const { t } = useTranslation();
  const branchesCount = new Set(membersData.map((item) => item.branch).filter(Boolean)).size;
  const activeMembers = membersData.filter((item) => item.status === 'Activ').length;
  const expiringSoon = membersData.filter((item) => item.status === 'Expirat' || item.status === 'Suspendat').length;
  const totalRevenue = paymentsData.filter((item) => item.status === 'Platit' || item.status === 'Plătit').reduce((sum, item) => sum + parsePrice(item.amount), 0);
  const revenueData = paymentsData.slice(0, 6).map((item, index) => ({ month: `P${index + 1}`, revenue: parsePrice(item.amount) }));
  const statusCounts = ['Activ', 'Expirat', 'Suspendat', 'Rezervat'].map((status, index) => ({
    name: status,
    value: membersData.filter((item) => item.status === status).length,
    color: ['#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t('dashboard.activeMembers')} value={String(activeMembers)} change={t('dashboard.liveUpdated')} helper={t('dashboard.activeMembersHelper')} icon={UserCheck} />
        <StatCard title={t('dashboard.flaggedSubscriptions')} value={String(expiringSoon)} change={t('dashboard.expiredOrSuspended')} helper={t('dashboard.needsFollowUp')} icon={CalendarClock} />
        <StatCard title={t('dashboard.totalRevenue')} value={`${totalRevenue.toLocaleString('ro-RO')} RON`} change={t('dashboard.paymentsCalculated')} helper={t('dashboard.persistentData')} icon={BadgeEuro} />
        <StatCard title={t('dashboard.activeBranches')} value={String(branchesCount)} change={t('dashboard.membersByLocation')} helper={t('dashboard.branchesDefined')} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title={t('dashboard.savedTransactionsRevenue')} action={<button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('dashboard.autoUpdated')}</button>}>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.length ? revenueData : [{ month: 'P1', revenue: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" radius={[12, 12, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
        <div>
          <SectionCard title={t('dashboard.memberStatus')}>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={4}>
                    {statusCounts.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {statusCounts.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title={t('dashboard.weeklyActivity')}>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="active" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="messages" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
        <div>
          <SectionCard title={t('dashboard.activeAutomations')}>
            <div className="space-y-3">
              {[
                t('dashboard.automationExpiryNotifications'),
                t('dashboard.automationPaymentActivation'),
                t('dashboard.automationServiceExpiry'),
                t('dashboard.automationScheduledAnnouncements'),
                t('dashboard.automationSubscriptionsTotal', { count: subscriptionsData.length }),
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.localSessionData')}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
