export type MemberStatus = 'Activ' | 'Suspendat' | 'Expirat' | 'Rezervat';
export type SubscriptionStatus = 'Activ' | 'Expirat' | 'Suspendat' | 'Consumat' | 'Rezervat';
export type AnnouncementStatus = 'Draft' | 'Programat' | 'Publicat';
export type PaymentStatus = 'Plătit' | 'În așteptare' | 'Eșuat';
export type PaymentMethod = 'Card' | 'Numerar' | 'Transfer';

export type SectionId =
  | 'dashboard'
  | 'branches'
  | 'admins'
  | 'access'
  | 'members'
  | 'subscriptions'
  | 'events'
  | 'articles'
  | 'announcements'
  | 'sms'
  | 'payments'
  | 'reports';

export type FormSection = 'list' | 'memberForm' | 'subscriptionForm' | 'announcementForm' | 'paymentForm';
export type FormMode = 'create' | 'edit' | null;
export type FormType = 'member' | 'subscription' | 'article' | 'announcement' | 'payment';

export type Credentials = {
  username: string;
  password: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subscription: string;
  status: MemberStatus;
  lastContact: string;
  address: string;
  notes: string;
  branch: string;
};

export type Subscription = {
  id: string;
  name: string;
  duration: string;
  price: string;
  status: SubscriptionStatus;
  renewals: number;
  description: string;
};

export type Announcement = {
  id: string;
  title: string;
  audience: string;
  scheduled: string;
  status: AnnouncementStatus;
  content: string;
};

export type Payment = {
  id: string;
  invoice: string;
  member: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionDate: string;
};

export type AppPage = {
  section: FormSection;
  mode: FormMode;
};
