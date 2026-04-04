import { useEffect, useState } from 'react';
import Content from './components/AppContent';
import { Header, LoginView, Sidebar } from './components/AppLayout';

type MemberStatus = 'Activ' | 'Suspendat' | 'Expirat' | 'Rezervat';
type SubscriptionStatus = 'Activ' | 'Expirat' | 'Suspendat' | 'Consumat' | 'Rezervat';
type AnnouncementStatus = 'Draft' | 'Programat' | 'Publicat';
type PaymentStatus = 'Plătit' | 'În așteptare' | 'Eșuat';
type PaymentMethod = 'Card' | 'Numerar' | 'Transfer';
export type SectionId = 'dashboard' | 'branches' | 'admins' | 'members' | 'subscriptions' | 'announcements' | 'sms' | 'payments' | 'reports';
type FormSection = 'list' | 'memberForm' | 'subscriptionForm' | 'announcementForm' | 'paymentForm';
export type FormMode = 'create' | 'edit' | null;
export type FormType = 'member' | 'subscription' | 'announcement' | 'payment';

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


const STORAGE_KEYS = {
  auth: 'master-erp-auth',
  user: 'master-erp-user',
  members: 'master-erp-members',
  subscriptions: 'master-erp-subscriptions',
  announcements: 'master-erp-announcements',
  payments: 'master-erp-payments',
};
const initialMembers: Member[] = [
  {
    id: 'MBR-001',
    name: 'Andrei Popescu',
    email: 'andrei.popescu@example.com',
    phone: '+40 723 123 456',
    subscription: 'Premium 12 luni',
    status: 'Activ',
    lastContact: '2026-04-01',
    address: 'Iași, Str. Primăverii 24',
    notes: 'Preferă notificare prin SMS înainte de expirare.',
    branch: 'Iași Centru',
  },
  {
    id: 'MBR-002',
    name: 'Ioana Mihai',
    email: 'ioana.mihai@example.com',
    phone: '+40 744 222 111',
    subscription: 'Standard 3 luni',
    status: 'Suspendat',
    lastContact: '2026-03-29',
    address: 'Iași, Bd. Independenței 11',
    notes: 'Suspendare temporară la cerere.',
    branch: 'Iași Copou',
  },
  {
    id: 'MBR-003',
    name: 'Radu Neagu',
    email: 'radu.neagu@example.com',
    phone: '+40 752 889 110',
    subscription: 'Premium 12 luni',
    status: 'Expirat',
    lastContact: '2026-03-27',
    address: 'Iași, Str. Sărărie 70',
    notes: 'Necesită follow-up pentru reactivare.',
    branch: 'Iași Nicolina',
  },
  {
    id: 'MBR-004',
    name: 'Elena Tudor',
    email: 'elena.tudor@example.com',
    phone: '+40 733 909 818',
    subscription: 'Standard 3 luni',
    status: 'Activ',
    lastContact: '2026-04-02',
    address: 'Iași, Str. Anastasie Panu 8',
    notes: 'Contact principal pentru părinte / tutore.',
    branch: 'Iași Centru',
  },
  {
    id: 'MBR-005',
    name: 'Mihai Dobre',
    email: 'mihai.dobre@example.com',
    phone: '+40 745 500 123',
    subscription: 'Premium 12 luni',
    status: 'Rezervat',
    lastContact: '2026-03-31',
    address: 'Iași, Str. Toma Cozma 14',
    notes: 'Așteaptă confirmarea slotului de antrenament.',
    branch: 'Iași Copou',
  },
];

const initialSubscriptions: Subscription[] = [
  {
    id: 'SUB-001',
    name: 'Premium 12 luni',
    duration: '12 luni',
    price: '2400 RON',
    status: 'Activ',
    renewals: 34,
    description: 'Acces complet și beneficii premium.',
  },
  {
    id: 'SUB-002',
    name: 'Standard 3 luni',
    duration: '3 luni',
    price: '650 RON',
    status: 'Activ',
    renewals: 51,
    description: 'Abonament standard cu acces programat.',
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ANN-001',
    title: 'Program special de Paște',
    audience: 'Toți membrii activi',
    scheduled: '2026-04-12 10:00',
    status: 'Programat',
    content: 'Programul de sărbători va avea intervale speciale și clase reorganizate.',
  },
  {
    id: 'ANN-002',
    title: 'Mentenanță sistem plăți',
    audience: 'Administrator / Operator',
    scheduled: '2026-04-05 22:00',
    status: 'Draft',
    content: 'Sistemul de plăți va intra în mentenanță pentru actualizări API.',
  },
  {
    id: 'ANN-003',
    title: 'Open Day & înscrieri noi',
    audience: 'Lead-uri și membri expirați',
    scheduled: '2026-04-08 09:00',
    status: 'Publicat',
    content: 'Invitație la evenimentul de prezentare și înscrieri noi.',
  },
];

const initialPayments: Payment[] = [
  { id: 'PAY-001', invoice: 'INV-2026-101', member: 'Andrei Popescu', amount: '650 RON', method: 'Card', status: 'Plătit', transactionDate: '2026-04-01' },
  { id: 'PAY-002', invoice: 'INV-2026-102', member: 'Elena Tudor', amount: '300 RON', method: 'Numerar', status: 'Plătit', transactionDate: '2026-04-02' },
  { id: 'PAY-003', invoice: 'INV-2026-103', member: 'Mihai Dobre', amount: '1200 RON', method: 'Transfer', status: 'În așteptare', transactionDate: '2026-04-02' },
  { id: 'PAY-004', invoice: 'INV-2026-104', member: 'Radu Neagu', amount: '650 RON', method: 'Card', status: 'Eșuat', transactionDate: '2026-03-29' },
];
const emptyForms: {
  member: Member;
  subscription: Subscription;
  announcement: Announcement;
  payment: Payment;
} = {
  member: {
    id: '',
    name: '',
    email: '',
    phone: '',
    subscription: '',
    status: 'Activ',
    lastContact: '',
    address: '',
    notes: '',
    branch: 'Iași Centru',
  },
  subscription: {
    id: '',
    name: '',
    duration: '',
    price: '',
    status: 'Activ',
    renewals: 0,
    description: '',
  },
  announcement: {
    id: '',
    title: '',
    audience: '',
    scheduled: '',
    status: 'Draft',
    content: '',
  },
  payment: {
    id: '',
    invoice: '',
    member: '',
    amount: '',
    method: 'Card',
    status: 'În așteptare',
    transactionDate: '',
  },
};

function loadStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}


export default function ERPAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadStoredValue(STORAGE_KEYS.auth, false));
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [currentUser, setCurrentUser] = useState(() => loadStoredValue(STORAGE_KEYS.user, 'Administrator'));

  const [current, setCurrent] = useState<SectionId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<AppPage>({ section: 'list', mode: null });

  const [membersData, setMembersData] = useState<Member[]>(() => loadStoredValue(STORAGE_KEYS.members, initialMembers));
  const [subscriptionsData, setSubscriptionsData] = useState<Subscription[]>(() => loadStoredValue(STORAGE_KEYS.subscriptions, initialSubscriptions));
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(() => loadStoredValue(STORAGE_KEYS.announcements, initialAnnouncements));
  const [paymentsData, setPaymentsData] = useState<Payment[]>(() => loadStoredValue(STORAGE_KEYS.payments, initialPayments));

  const [memberForm, setMemberForm] = useState(emptyForms.member);
  const [subscriptionForm, setSubscriptionForm] = useState(emptyForms.subscription);
  const [announcementForm, setAnnouncementForm] = useState(emptyForms.announcement);
  const [paymentForm, setPaymentForm] = useState(emptyForms.payment);

  useEffect(() => saveStoredValue(STORAGE_KEYS.auth, isAuthenticated), [isAuthenticated]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.user, currentUser), [currentUser]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.members, membersData), [membersData]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.subscriptions, subscriptionsData), [subscriptionsData]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.announcements, announcementsData), [announcementsData]);
  useEffect(() => saveStoredValue(STORAGE_KEYS.payments, paymentsData), [paymentsData]);

  const navigateToForm = (type: FormType, mode: Exclude<FormMode, null> = 'create', item: Member | Subscription | Announcement | Payment | null = null) => {
    if (type === 'member') {
      setMemberForm(item ? { ...(item as Member) } : { ...emptyForms.member, id: `MBR-${String(membersData.length + 1).padStart(3, '0')}` });
      setCurrent('members');
      setPage({ section: 'memberForm', mode });
      return;
    }
    if (type === 'subscription') {
      setSubscriptionForm(item ? { ...(item as Subscription) } : { ...emptyForms.subscription, id: `SUB-${String(subscriptionsData.length + 1).padStart(3, '0')}` });
      setCurrent('subscriptions');
      setPage({ section: 'subscriptionForm', mode });
      return;
    }
    if (type === 'announcement') {
      setAnnouncementForm(item ? { ...(item as Announcement) } : { ...emptyForms.announcement, id: `ANN-${String(announcementsData.length + 1).padStart(3, '0')}`, scheduled: `${formatDate()} 10:00` });
      setCurrent('announcements');
      setPage({ section: 'announcementForm', mode });
      return;
    }
    if (type === 'payment') {
      setPaymentForm(item ? { ...(item as Payment) } : { ...emptyForms.payment, id: `PAY-${String(paymentsData.length + 1).padStart(3, '0')}`, invoice: `INV-${new Date().getFullYear()}-${String(paymentsData.length + 101).padStart(3, '0')}`, transactionDate: formatDate() });
      setCurrent('payments');
      setPage({ section: 'paymentForm', mode });
    }
  };

  const goBackToList = (targetSection: SectionId) => {
    setCurrent(targetSection);
    setPage({ section: 'list', mode: null });
  };

  const upsertById = <T extends { id: string }>(list: T[], item: T) => {
    const exists = list.some((entry) => entry.id === item.id);
    return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
  };

  const saveMember = () => {
    const payload = { ...memberForm, branch: memberForm.branch || 'Iași Centru', lastContact: formatDate() };
    setMembersData((prev) => upsertById(prev, payload));
    goBackToList('members');
  };

  const saveSubscription = () => {
    const payload = { ...subscriptionForm, renewals: Number(subscriptionForm.renewals) || 0 };
    setSubscriptionsData((prev) => upsertById(prev, payload));
    goBackToList('subscriptions');
  };

  const saveAnnouncement = () => {
    setAnnouncementsData((prev) => upsertById(prev, { ...announcementForm }));
    goBackToList('announcements');
  };

  const savePayment = () => {
    setPaymentsData((prev) => upsertById(prev, { ...paymentForm }));
    goBackToList('payments');
  };

  const handleSidebarChange = (id: SectionId) => {
    setCurrent(id);
    setPage({ section: 'list', mode: null });
    setSidebarOpen(false);
  };

  const handleQuickCreate = () => {
    if (current === 'members') return navigateToForm('member', 'create');
    if (current === 'subscriptions') return navigateToForm('subscription', 'create');
    if (current === 'announcements') return navigateToForm('announcement', 'create');
    if (current === 'payments') return navigateToForm('payment', 'create');
    return navigateToForm('member', 'create');
  };

  const handleLogin = () => {
    setCurrentUser(credentials.username || 'Administrator');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
  };

  if (!isAuthenticated) {
    return <LoginView credentials={credentials} onChange={(field, value) => setCredentials((prev) => ({ ...prev, [field]: value }))} onSubmit={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar current={current} setCurrent={handleSidebarChange} open={sidebarOpen} />
        <div className="min-w-0 flex-1">
          <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} onQuickCreate={handleQuickCreate} onLogout={handleLogout} currentUser={currentUser} />
          <Content
            current={current}
            page={page}
            membersData={membersData}
            subscriptionsData={subscriptionsData}
            announcementsData={announcementsData}
            paymentsData={paymentsData}
            navigateToForm={navigateToForm}
            memberForm={memberForm}
            setMemberForm={setMemberForm}
            subscriptionForm={subscriptionForm}
            setSubscriptionForm={setSubscriptionForm}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            goBackToList={goBackToList}
            saveMember={saveMember}
            saveSubscription={saveSubscription}
            saveAnnouncement={saveAnnouncement}
            savePayment={savePayment}
          />
        </div>
      </div>
    </div>
  );
}

