import { useMemo } from 'react';
import type { Announcement, FormType, Payment } from '../../types/erp';
import { GroupsRightsView } from './access/GroupsRightsView';
import { AdminsView } from './admins/AdminsView';
import { AnnouncementFormPage } from './announcements/AnnouncementFormPage';
import { AnnouncementsView } from './announcements/AnnouncementsView';
import { ArticlesModuleRoutes } from './articles/ArticlesModule';
import { BranchesView } from './branches/BranchesView';
import { DashboardView } from './dashboard/DashboardView';
import { EventsModuleRoutes } from './events/EventsModule';
import { MembersView } from './members/MembersView';
import { PaymentFormPage } from './payments/PaymentFormPage';
import { PaymentsView } from './payments/PaymentsView';
import { ReportsView } from './reports/ReportsView';
import { QuickCreateMenu } from './shared/QuickCreateMenu';
import type { ContentProps } from './shared/types';
import { SmsView } from './sms/SmsView';
import { SubscriptionsView } from './subscriptions/SubscriptionsView';

export default function Content({ current, page, membersData, subscriptionsData, announcementsData, paymentsData, activityData, navigateToForm, announcementForm, setAnnouncementForm, paymentForm, setPaymentForm, goBackToList, saveAnnouncement, savePayment }: ContentProps) {
  const view = useMemo(() => {
    if (page.section === 'memberForm') {
      return <MembersView />;
    }
    if (page.section === 'subscriptionForm') {
      return <SubscriptionsView openOnMount={page.mode === 'create'} />;
    }
    if (page.section === 'announcementForm') {
      return <AnnouncementFormPage mode={page.mode ?? 'create'} data={announcementForm} onChange={(field, value) => setAnnouncementForm((prev) => ({ ...prev, [field]: value } as Announcement))} onBack={() => goBackToList('announcements')} onSave={saveAnnouncement} />;
    }
    if (page.section === 'paymentForm') {
      return <PaymentFormPage mode={page.mode ?? 'create'} data={paymentForm} onChange={(field, value) => setPaymentForm((prev) => ({ ...prev, [field]: value } as Payment))} onBack={() => goBackToList('payments')} onSave={savePayment} />;
    }

    switch (current) {
      case 'members':
        return <MembersView />;
      case 'branches':
        return <BranchesView />;
      case 'admins':
        return <AdminsView />;
      case 'access':
        return <GroupsRightsView />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'events':
        return <EventsModuleRoutes />;
      case 'articles':
        return <ArticlesModuleRoutes />;
      case 'announcements':
        return <AnnouncementsView items={announcementsData} onCreate={() => navigateToForm('announcement', 'create')} onEdit={(item: Announcement) => navigateToForm('announcement', 'edit', item)} />;
      case 'sms':
        return <SmsView />;
      case 'payments':
        return <PaymentsView items={paymentsData} onCreate={() => navigateToForm('payment', 'create')} onEdit={(item: Payment) => navigateToForm('payment', 'edit', item)} />;
      case 'reports':
        return <ReportsView membersData={membersData} subscriptionsData={subscriptionsData} paymentsData={paymentsData} announcementsData={announcementsData} />;
      default:
        return (
          <div className="space-y-6">
            <QuickCreateMenu onNavigate={(type: FormType) => navigateToForm(type, 'create')} />
            <DashboardView membersData={membersData} subscriptionsData={subscriptionsData} paymentsData={paymentsData} activityData={activityData} />
          </div>
        );
    }
  }, [current, page, membersData, subscriptionsData, announcementsData, paymentsData, activityData, navigateToForm, announcementForm, paymentForm, setAnnouncementForm, setPaymentForm, goBackToList, saveAnnouncement, savePayment]);

  return <main className="space-y-6 p-4 md:p-8">{view}</main>;
}

