import type React from 'react';
import type {
  Announcement,
  AppPage,
  FormMode,
  FormType,
  Member,
  Payment,
  SectionId,
  Subscription,
} from '../../../types/erp';
import type { ActivityPoint } from '../../../services/ErpJsonDataService';

export type DashboardViewProps = {
  membersData: Member[];
  subscriptionsData: Subscription[];
  paymentsData: Payment[];
  activityData: ActivityPoint[];
};

export type MembersViewProps = {
  items: Member[];
  onCreate: () => void;
  onEdit: (item: Member) => void;
};

export type BranchesViewProps = {
  branches: string[];
  membersData: Member[];
};

export type SubscriptionsViewProps = {
  items: Subscription[];
  onCreate: () => void;
  onEdit: (item: Subscription) => void;
};

export type AnnouncementsViewProps = {
  items: Announcement[];
  onCreate: () => void;
  onEdit: (item: Announcement) => void;
};

export type PaymentsViewProps = {
  items: Payment[];
  onCreate: () => void;
  onEdit: (item: Payment) => void;
};

export type ReportsViewProps = {
  membersData: Member[];
  subscriptionsData: Subscription[];
  paymentsData: Payment[];
  announcementsData: Announcement[];
};

export type PageShellProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
};

export type MemberFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Member;
  branchOptions: string[];
  subscriptionOptions: Subscription[];
  onChange: (field: keyof Member, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export type SubscriptionFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Subscription;
  onChange: (field: keyof Subscription, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export type AnnouncementFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Announcement;
  onChange: (field: keyof Announcement, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export type PaymentFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Payment;
  onChange: (field: keyof Payment, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export type QuickCreateMenuProps = {
  onNavigate: (type: FormType) => void;
};

export type ContentProps = {
  current: SectionId;
  page: AppPage;
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
