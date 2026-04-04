import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AdminsView,
  AnnouncementFormPage,
  AnnouncementsView,
  BranchesView,
  DashboardView,
  MemberFormPage,
  MembersView,
  PaymentFormPage,
  PaymentsView,
  QuickCreateMenu,
  ReportsView,
  SmsView,
  SubscriptionFormPage,
  SubscriptionsView,
} from '../../components/erp';
import type {
  Announcement,
  FormMode,
  FormType,
  Member,
  Payment,
  SectionId,
  Subscription,
} from '../../types/erp';
import type { ActivityPoint } from '../../services/ErpJsonDataService';

type ERPContentRoutesProps = {
  membersData: Member[];
  subscriptionsData: Subscription[];
  announcementsData: Announcement[];
  paymentsData: Payment[];
  branchesData: string[];
  activityData: ActivityPoint[];
  navigateToForm: (type: FormType, mode?: Exclude<FormMode, null>, item?: Member | Subscription | Announcement | Payment | null) => void;
  memberForm: Member;
  setMemberForm: React.Dispatch<React.SetStateAction<Member>>;
  subscriptionForm: Subscription;
  setSubscriptionForm: React.Dispatch<React.SetStateAction<Subscription>>;
  announcementForm: Announcement;
  setAnnouncementForm: React.Dispatch<React.SetStateAction<Announcement>>;
  paymentForm: Payment;
  setPaymentForm: React.Dispatch<React.SetStateAction<Payment>>;
  goBackToList: (targetSection: SectionId) => void;
  saveMember: () => void;
  saveSubscription: () => void;
  saveAnnouncement: () => void;
  savePayment: () => void;
};

export default function ERPContentRoutes({
  membersData,
  subscriptionsData,
  announcementsData,
  paymentsData,
  branchesData,
  activityData,
  navigateToForm,
  memberForm,
  setMemberForm,
  subscriptionForm,
  setSubscriptionForm,
  announcementForm,
  setAnnouncementForm,
  paymentForm,
  setPaymentForm,
  goBackToList,
  saveMember,
  saveSubscription,
  saveAnnouncement,
  savePayment,
}: ERPContentRoutesProps) {
  return (
    <Routes>
      <Route
        path="dashboard"
        element={
          <div className="space-y-6">
            <QuickCreateMenu onNavigate={(type) => navigateToForm(type, 'create')} />
            <DashboardView membersData={membersData} subscriptionsData={subscriptionsData} paymentsData={paymentsData} activityData={activityData} />
          </div>
        }
      />

      <Route path="branches" element={<BranchesView branches={branchesData} membersData={membersData} />} />
      <Route path="admins" element={<AdminsView />} />

      <Route path="members" element={<MembersView items={membersData} onCreate={() => navigateToForm('member', 'create')} onEdit={(item) => navigateToForm('member', 'edit', item)} />} />
      <Route path="members/new" element={<MemberFormPage mode="create" data={memberForm} branchOptions={branchesData} subscriptionOptions={subscriptionsData} onChange={(field, value) => setMemberForm((prev) => ({ ...prev, [field]: value } as Member))} onBack={() => goBackToList('members')} onSave={saveMember} />} />
      <Route path="members/edit" element={<MemberFormPage mode="edit" data={memberForm} branchOptions={branchesData} subscriptionOptions={subscriptionsData} onChange={(field, value) => setMemberForm((prev) => ({ ...prev, [field]: value } as Member))} onBack={() => goBackToList('members')} onSave={saveMember} />} />

      <Route path="subscriptions" element={<SubscriptionsView items={subscriptionsData} onCreate={() => navigateToForm('subscription', 'create')} onEdit={(item) => navigateToForm('subscription', 'edit', item)} />} />
      <Route path="subscriptions/new" element={<SubscriptionFormPage mode="create" data={subscriptionForm} onChange={(field, value) => setSubscriptionForm((prev) => ({ ...prev, [field]: value } as Subscription))} onBack={() => goBackToList('subscriptions')} onSave={saveSubscription} />} />
      <Route path="subscriptions/edit" element={<SubscriptionFormPage mode="edit" data={subscriptionForm} onChange={(field, value) => setSubscriptionForm((prev) => ({ ...prev, [field]: value } as Subscription))} onBack={() => goBackToList('subscriptions')} onSave={saveSubscription} />} />

      <Route path="announcements" element={<AnnouncementsView items={announcementsData} onCreate={() => navigateToForm('announcement', 'create')} onEdit={(item) => navigateToForm('announcement', 'edit', item)} />} />
      <Route path="announcements/new" element={<AnnouncementFormPage mode="create" data={announcementForm} onChange={(field, value) => setAnnouncementForm((prev) => ({ ...prev, [field]: value } as Announcement))} onBack={() => goBackToList('announcements')} onSave={saveAnnouncement} />} />
      <Route path="announcements/edit" element={<AnnouncementFormPage mode="edit" data={announcementForm} onChange={(field, value) => setAnnouncementForm((prev) => ({ ...prev, [field]: value } as Announcement))} onBack={() => goBackToList('announcements')} onSave={saveAnnouncement} />} />

      <Route path="sms" element={<SmsView />} />

      <Route path="payments" element={<PaymentsView items={paymentsData} onCreate={() => navigateToForm('payment', 'create')} onEdit={(item) => navigateToForm('payment', 'edit', item)} />} />
      <Route path="payments/new" element={<PaymentFormPage mode="create" data={paymentForm} onChange={(field, value) => setPaymentForm((prev) => ({ ...prev, [field]: value } as Payment))} onBack={() => goBackToList('payments')} onSave={savePayment} />} />
      <Route path="payments/edit" element={<PaymentFormPage mode="edit" data={paymentForm} onChange={(field, value) => setPaymentForm((prev) => ({ ...prev, [field]: value } as Payment))} onBack={() => goBackToList('payments')} onSave={savePayment} />} />

      <Route path="reports" element={<ReportsView membersData={membersData} subscriptionsData={subscriptionsData} paymentsData={paymentsData} announcementsData={announcementsData} />} />

      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
