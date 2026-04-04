import { useMemo } from 'react';
import type { Announcement, FormType, Member, Payment, Subscription } from '../../types/erp';
import { AdminsView } from './admins/AdminsView';
import { AnnouncementFormPage } from './announcements/AnnouncementFormPage';
import { AnnouncementsView } from './announcements/AnnouncementsView';
import { BranchesView } from './branches/BranchesView';
import { DashboardView } from './dashboard/DashboardView';
import { MemberFormPage } from './members/MemberFormPage';
import { MembersView } from './members/MembersView';
import { PaymentFormPage } from './payments/PaymentFormPage';
import { PaymentsView } from './payments/PaymentsView';
import { ReportsView } from './reports/ReportsView';
import { QuickCreateMenu } from './shared/QuickCreateMenu';
import { initialBranches } from './shared/constants';
import type { ContentProps } from './shared/types';
import { SmsView } from './sms/SmsView';
import { SubscriptionFormPage } from './subscriptions/SubscriptionFormPage';
import { SubscriptionsView } from './subscriptions/SubscriptionsView';

export default function Content({ current, page, membersData, subscriptionsData, announcementsData, paymentsData, navigateToForm, memberForm, setMemberForm, subscriptionForm, setSubscriptionForm, announcementForm, setAnnouncementForm, paymentForm, setPaymentForm, goBackToList, saveMember, saveSubscription, saveAnnouncement, savePayment }: ContentProps) {
  const view = useMemo(() => {
    if (page.section === 'memberForm') {
      return <MemberFormPage mode={page.mode ?? 'create'} data={memberForm} onChange={(field, value) => setMemberForm((prev) => ({ ...prev, [field]: value } as Member))} onBack={() => goBackToList('members')} onSave={saveMember} />;
    }
    if (page.section === 'subscriptionForm') {
      return <SubscriptionFormPage mode={page.mode ?? 'create'} data={subscriptionForm} onChange={(field, value) => setSubscriptionForm((prev) => ({ ...prev, [field]: value } as Subscription))} onBack={() => goBackToList('subscriptions')} onSave={saveSubscription} />;
    }
    if (page.section === 'announcementForm') {
      return <AnnouncementFormPage mode={page.mode ?? 'create'} data={announcementForm} onChange={(field, value) => setAnnouncementForm((prev) => ({ ...prev, [field]: value } as Announcement))} onBack={() => goBackToList('announcements')} onSave={saveAnnouncement} />;
    }
    if (page.section === 'paymentForm') {
      return <PaymentFormPage mode={page.mode ?? 'create'} data={paymentForm} onChange={(field, value) => setPaymentForm((prev) => ({ ...prev, [field]: value } as Payment))} onBack={() => goBackToList('payments')} onSave={savePayment} />;
    }

    switch (current) {
      case 'members':
        return <MembersView items={membersData} onCreate={() => navigateToForm('member', 'create')} onEdit={(item: Member) => navigateToForm('member', 'edit', item)} />;
      case 'branches':
        return <BranchesView branches={initialBranches} membersData={membersData} />;
      case 'admins':
        return <AdminsView />;
      case 'subscriptions':
        return <SubscriptionsView items={subscriptionsData} onCreate={() => navigateToForm('subscription', 'create')} onEdit={(item: Subscription) => navigateToForm('subscription', 'edit', item)} />;
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
            <DashboardView membersData={membersData} subscriptionsData={subscriptionsData} paymentsData={paymentsData} />
          </div>
        );
    }
  }, [current, page, membersData, subscriptionsData, announcementsData, paymentsData, navigateToForm, memberForm, subscriptionForm, announcementForm, paymentForm, setMemberForm, setSubscriptionForm, setAnnouncementForm, setPaymentForm, goBackToList, saveMember, saveSubscription, saveAnnouncement, savePayment]);

  return <main className="space-y-6 p-4 md:p-8">{view}</main>;
}