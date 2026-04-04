import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Content from '../components/erp/Content';
import { Header, LoginView, Sidebar } from '../components/AppLayout';
import { erpJsonDataService, type ActivityPoint } from '../services/ErpJsonDataService';
import type {
  Announcement,
  AppPage,
  Credentials,
  FormMode,
  FormType,
  Member,
  Payment,
  SectionId,
  Subscription,
} from '../types/erp';

const SECTION_IDS: SectionId[] = ['dashboard', 'branches', 'admins', 'members', 'subscriptions', 'announcements', 'sms', 'payments', 'reports'];

const STORAGE_KEYS = {
  auth: 'master-erp-auth',
  user: 'master-erp-user',
  members: 'master-erp-members',
  subscriptions: 'master-erp-subscriptions',
  announcements: 'master-erp-announcements',
  payments: 'master-erp-payments',
};

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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const routeSection = pathname.split('/')[2];

  const resolvedRouteSection: SectionId = routeSection && SECTION_IDS.includes(routeSection as SectionId)
    ? (routeSection as SectionId)
    : 'dashboard';

  const [isAuthenticated, setIsAuthenticated] = useState(() => loadStoredValue(STORAGE_KEYS.auth, false));
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const [currentUser, setCurrentUser] = useState(() => loadStoredValue(STORAGE_KEYS.user, 'Administrator'));

  const [current, setCurrent] = useState<SectionId>(resolvedRouteSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<AppPage>({ section: 'list', mode: null });

  const [membersData, setMembersData] = useState<Member[]>(() => loadStoredValue(STORAGE_KEYS.members, []));
  const [subscriptionsData, setSubscriptionsData] = useState<Subscription[]>(() => loadStoredValue(STORAGE_KEYS.subscriptions, []));
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(() => loadStoredValue(STORAGE_KEYS.announcements, []));
  const [paymentsData, setPaymentsData] = useState<Payment[]>(() => loadStoredValue(STORAGE_KEYS.payments, []));
  const [branchesData, setBranchesData] = useState<string[]>([]);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);

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

  useEffect(() => {
    if (!routeSection) return;
    if (SECTION_IDS.includes(routeSection as SectionId)) {
      setCurrent(routeSection as SectionId);
      return;
    }
    navigate('/erp/dashboard', { replace: true });
  }, [routeSection, navigate]);

  useEffect(() => {
    let disposed = false;

    const loadSeedData = async () => {
      try {
        const seed = await erpJsonDataService.loadSeedData();
        if (disposed) return;

        setBranchesData(seed.branches);
        setActivityData(seed.activity);

        setMembersData((prev) => (prev.length > 0 ? prev : seed.members));
        setSubscriptionsData((prev) => (prev.length > 0 ? prev : seed.subscriptions));
        setAnnouncementsData((prev) => (prev.length > 0 ? prev : seed.announcements));
        setPaymentsData((prev) => (prev.length > 0 ? prev : seed.payments));
      } catch (error) {
        console.error('Failed loading ERP seed data from /public/json', error);
      }
    };

    void loadSeedData();
    return () => {
      disposed = true;
    };
  }, []);

  const navigateToForm = (type: FormType, mode: Exclude<FormMode, null> = 'create', item: Member | Subscription | Announcement | Payment | null = null) => {
    if (type === 'member') {
      setMemberForm(item ? { ...(item as Member) } : { ...emptyForms.member, id: `MBR-${String(membersData.length + 1).padStart(3, '0')}` });
      setCurrent('members');
      navigate('/erp/members');
      setPage({ section: 'memberForm', mode });
      return;
    }
    if (type === 'subscription') {
      setSubscriptionForm(item ? { ...(item as Subscription) } : { ...emptyForms.subscription, id: `SUB-${String(subscriptionsData.length + 1).padStart(3, '0')}` });
      setCurrent('subscriptions');
      navigate('/erp/subscriptions');
      setPage({ section: 'subscriptionForm', mode });
      return;
    }
    if (type === 'announcement') {
      setAnnouncementForm(item ? { ...(item as Announcement) } : { ...emptyForms.announcement, id: `ANN-${String(announcementsData.length + 1).padStart(3, '0')}`, scheduled: `${formatDate()} 10:00` });
      setCurrent('announcements');
      navigate('/erp/announcements');
      setPage({ section: 'announcementForm', mode });
      return;
    }
    if (type === 'payment') {
      setPaymentForm(item ? { ...(item as Payment) } : { ...emptyForms.payment, id: `PAY-${String(paymentsData.length + 1).padStart(3, '0')}`, invoice: `INV-${new Date().getFullYear()}-${String(paymentsData.length + 101).padStart(3, '0')}`, transactionDate: formatDate() });
      setCurrent('payments');
      navigate('/erp/payments');
      setPage({ section: 'paymentForm', mode });
    }
  };

  const goBackToList = (targetSection: SectionId) => {
    setCurrent(targetSection);
    navigate(`/erp/${targetSection}`);
    setPage({ section: 'list', mode: null });
  };

  const upsertById = <T extends { id: string }>(list: T[], item: T) => {
    const exists = list.some((entry) => entry.id === item.id);
    return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
  };

  const saveMember = () => {
    const defaultBranch = branchesData[0] ?? 'Iași Centru';
    const payload = { ...memberForm, branch: memberForm.branch || defaultBranch, lastContact: formatDate() };
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
    navigate(`/erp/${id}`);
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
            branchesData={branchesData}
            activityData={activityData}
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


