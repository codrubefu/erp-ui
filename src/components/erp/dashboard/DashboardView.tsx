import { BadgeEuro, Bell, Building2, CalendarClock, Check, RefreshCw, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardService, type DashboardAutomation, type DashboardPayload } from '../../../services/dashboardService';
import { articlesService, type Article } from '../../../services/articlesService';
import { Alert, Button, SectionCard, StatCard } from '../../primitives';
import { useAuth } from '../../../context/useAuth';
import type { DashboardViewProps } from '../shared/types';

const statusColors: Record<string, string> = {
  active: '#2563eb',
  inactive: '#64748b',
  expired: '#f59e0b',
  suspended: '#dc2626',
  pending: '#7c3aed',
  reserved: '#0891b2',
  consumed: '#16a34a',
};

function money(value: number) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);
}

function automationTitle(automation: DashboardAutomation, t: ReturnType<typeof useTranslation>['t']) {
  const values = { count: automation.count ?? 0 };
  const translated = t(`dashboard.automationLabels.${automation.key}`, values);
  return translated === `dashboard.automationLabels.${automation.key}` ? automation.label : translated;
}

function automationHelper(automation: DashboardAutomation, t: ReturnType<typeof useTranslation>['t']) {
  const translated = t(`dashboard.automationHelpers.${automation.key}`);
  return translated === `dashboard.automationHelpers.${automation.key}` ? automation.helper : translated;
}

function statusLabel(status: string, t: ReturnType<typeof useTranslation>['t']) {
  const key = `dashboard.statuses.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function shortText(value: string, max = 180) {
  return value.length > max ? `${value.slice(0, max).trim()}...` : value;
}

export function DashboardView(props: DashboardViewProps) {
  void props;
  const { t } = useTranslation();
  const { hasAnyRight } = useAuth();
  const canViewDashboard = hasAnyRight(['dashboard.view', 'dashboard.manage', 'reports.view', 'reports.manage']);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [announcements, setAnnouncements] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [markingAnnouncementId, setMarkingAnnouncementId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [announcementsError, setAnnouncementsError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!canViewDashboard) return;
    setLoading(true);
    setError('');
    try {
      setDashboard(await dashboardService.getDashboard({ group_by: 'month' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [canViewDashboard, t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError('');
    try {
      const payload = await articlesService.feed({ per_page: 5 });
      setAnnouncements(Array.isArray(payload) ? payload : payload.data ?? []);
    } catch (err) {
      setAnnouncements([]);
      setAnnouncementsError(err instanceof Error ? err.message : t('profile.announcementsLoadError', 'Nu am putut incarca anunturile.'));
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const markAnnouncementViewed = async (article: Article) => {
    setMarkingAnnouncementId(article.id);
    setAnnouncementsError('');
    try {
      const viewed = await articlesService.markViewed(article.id);
      setAnnouncements((prev) => prev.map((item) => (item.id === article.id ? { ...item, viewed_at: viewed.viewed_at ?? new Date().toISOString() } : item)));
    } catch (err) {
      setAnnouncementsError(err instanceof Error ? err.message : t('profile.announcementViewError', 'Nu am putut marca anuntul ca citit.'));
    } finally {
      setMarkingAnnouncementId(null);
    }
  };

  const statusCounts = useMemo(() => {
    const points = dashboard?.member_status ?? [];
    return points.map((item) => ({
      name: statusLabel(item.status, t),
      value: item.count,
      color: statusColors[item.status] ?? '#475569',
    }));
  }, [dashboard, t]);

  const revenueData = useMemo(() => {
    return (dashboard?.revenue_by_period ?? []).map((item) => ({ period: item.period, revenue: item.revenue }));
  }, [dashboard]);

  const activityData = useMemo(() => {
    return (dashboard?.activity ?? []).map((item) => ({ period: item.period, active: item.active, messages: item.messages }));
  }, [dashboard]);

  const announcementsPanel = (
    <SectionCard title={t('profile.announcementsTitle', 'Anunturile mele')} action={<Button type="button" size="sm" onClick={() => void loadAnnouncements()} disabled={announcementsLoading}><RefreshCw size={16} />{t('common.refresh')}</Button>}>
      {announcementsError ? <Alert tone="error" className="mb-3">{announcementsError}</Alert> : null}
      <div className="space-y-3">
        {announcements.length ? announcements.map((article) => (
          <div key={article.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{article.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${article.viewed_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {article.viewed_at ? t('profile.announcementRead', 'Citit') : t('profile.announcementUnread', 'Necitit')}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{shortText(article.description)}</p>
                {!article.viewed_at ? (
                  <Button type="button" size="sm" variant="ghost" className="mt-2 h-8 px-2" onClick={() => void markAnnouncementViewed(article)} disabled={markingAnnouncementId === article.id}>
                    <Check className="h-4 w-4" />
                    {t('profile.markAnnouncementRead', 'Marcheaza citit')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">{announcementsLoading ? t('common.loading') : t('profile.noAnnouncements', 'Nu exista anunturi pentru tine.')}</div>
        )}
      </div>
    </SectionCard>
  );

  if (!canViewDashboard) {
    return (
      <div className="space-y-5">
        {announcementsPanel}
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <SectionCard title={t('nav.dashboard')}>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">{t('dashboard.loading')}</div>
      </SectionCard>
    );
  }

  const stats = dashboard?.stats ?? { active_members: 0, flagged_services: 0, total_revenue: 0, active_locations: 0 };
  const automations = dashboard?.automations ?? [];

  return (
    <div className="space-y-5">
      {error && (
        <Alert tone="error">
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" size="sm" onClick={() => void loadDashboard()}>
              <RefreshCw size={16} />
              {t('common.refresh')}
            </Button>
          </span>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t('dashboard.activeMembers')} value={String(stats.active_members)} change={t('dashboard.liveUpdated')} helper={t('dashboard.activeMembersHelper')} icon={UserCheck} />
        <StatCard title={t('dashboard.flaggedServices')} value={String(stats.flagged_services)} change={t('dashboard.expiredOrSuspended')} helper={t('dashboard.needsFollowUp')} icon={CalendarClock} />
        <StatCard title={t('dashboard.totalRevenue')} value={`${money(stats.total_revenue)} RON`} change={t('dashboard.paymentsCalculated')} helper={t('dashboard.persistentData')} icon={BadgeEuro} />
        <StatCard title={t('dashboard.activeBranches')} value={String(stats.active_locations)} change={t('dashboard.membersByLocation')} helper={t('dashboard.branchesDefined')} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title={t('dashboard.savedTransactionsRevenue')} action={<Button type="button" size="sm" onClick={() => void loadDashboard()} disabled={loading}><RefreshCw size={16} />{t('common.refresh')}</Button>}>
            <div className="h-72 w-full xl:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.length ? revenueData : [{ period: t('dashboard.noData'), revenue: 0 }]}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
        <div>
          <SectionCard title={t('dashboard.memberStatus')}>
            <div className="h-72 w-full xl:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts.length ? statusCounts : [{ name: t('dashboard.noData'), value: 1, color: '#e2e8f0' }]} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={4}>
                    {(statusCounts.length ? statusCounts : [{ name: t('dashboard.noData'), value: 1, color: '#e2e8f0' }]).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(statusCounts.length ? statusCounts : [{ name: t('dashboard.noData'), value: 0, color: '#e2e8f0' }]).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title={t('dashboard.weeklyActivity')}>
            <div className="h-64 w-full xl:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData.length ? activityData : [{ period: t('dashboard.noData'), active: 0, messages: 0 }]}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="active" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="messages" stroke="#0891b2" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
        <div>
          {announcementsPanel}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div>
          <SectionCard title={t('dashboard.activeAutomations')}>
            <div className="space-y-3">
              {automations.length ? automations.map((item) => (
                <div key={item.key} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{automationTitle(item, t)}</p>
                    <p className="text-xs text-slate-500">{automationHelper(item, t)}</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">{t('dashboard.noData')}</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
