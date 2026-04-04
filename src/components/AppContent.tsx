import React, { useMemo, useState } from 'react';
import {
  Users,
  BadgeEuro,
  Bell,
  MessageSquare,
  CreditCard,
  FileBarChart2,
  Plus,
  Filter,
  Download,
  Phone,
  CalendarClock,
  UserCheck,
  Receipt,
  Pencil,
  Save,
  Eye,
  ArrowLeft,
  FileText,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type {
  Announcement,
  AppPage,
  FormMode,
  FormType,
  Member,
  Payment,
  SectionId,
  Subscription,
} from '../App';
import { LoginView, Header, Sidebar } from './AppLayout';
export { LoginView, Header, Sidebar };
import { cn, parsePrice, StatCard, SectionCard, StatusBadge, Input, Select, Textarea } from './AppPrimitives';


type DashboardViewProps = {
  membersData: Member[];
  subscriptionsData: Subscription[];
  paymentsData: Payment[];
};

type MembersViewProps = {
  items: Member[];
  onCreate: () => void;
  onEdit: (item: Member) => void;
};

type BranchesViewProps = {
  branches: string[];
  membersData: Member[];
};

type SubscriptionsViewProps = {
  items: Subscription[];
  onCreate: () => void;
  onEdit: (item: Subscription) => void;
};

type AnnouncementsViewProps = {
  items: Announcement[];
  onCreate: () => void;
  onEdit: (item: Announcement) => void;
};

type PaymentsViewProps = {
  items: Payment[];
  onCreate: () => void;
  onEdit: (item: Payment) => void;
};

type ReportsViewProps = {
  membersData: Member[];
  subscriptionsData: Subscription[];
  paymentsData: Payment[];
  announcementsData: Announcement[];
};

type PageShellProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
};

type MemberFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Member;
  onChange: (field: keyof Member, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

type SubscriptionFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Subscription;
  onChange: (field: keyof Subscription, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

type AnnouncementFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Announcement;
  onChange: (field: keyof Announcement, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

type PaymentFormPageProps = {
  mode: Exclude<FormMode, null>;
  data: Payment;
  onChange: (field: keyof Payment, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

type QuickCreateMenuProps = {
  onNavigate: (type: FormType) => void;
};

type ContentProps = {
  current: SectionId;
  page: AppPage;
  membersData: Member[];
  subscriptionsData: Subscription[];
  announcementsData: Announcement[];
  paymentsData: Payment[];
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


const initialBranches = ['Iași Centru', 'Iași Copou', 'Iași Nicolina'];

const initialMembers: Member[] = [
  {
    id: 'MBR-001',
    name: 'Andrei Popescu',
    email: 'andrei.popescu@example.com',
    phone: '+40 723 123 456',
    subscription: 'Premium 12 luni',
    status: 'Activ',
    lastContact: '2026-04-01',
    address: 'IaÈ™i, Str. PrimÄƒverii 24',
    notes: 'PreferÄƒ notificare prin SMS Ã®nainte de expirare.',
    branch: 'IaÈ™i Centru',
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


const activityData = [
  { day: 'Lun', active: 112, messages: 18 },
  { day: 'Mar', active: 120, messages: 25 },
  { day: 'Mie', active: 117, messages: 22 },
  { day: 'Joi', active: 134, messages: 29 },
  { day: 'Vin', active: 142, messages: 35 },
  { day: 'Sâm', active: 156, messages: 31 },
  { day: 'Dum', active: 98, messages: 12 },
];

function DashboardView({ membersData, subscriptionsData, paymentsData }: DashboardViewProps) {
  const branchesCount = new Set(membersData.map((item) => item.branch).filter(Boolean)).size;
  const activeMembers = membersData.filter((item) => item.status === 'Activ').length;
  const expiringSoon = membersData.filter((item) => item.status === 'Expirat' || item.status === 'Suspendat').length;
  const totalRevenue = paymentsData.filter((item) => item.status === 'Plătit').reduce((sum, item) => sum + parsePrice(item.amount), 0);
  const revenueData = paymentsData.slice(0, 6).map((item, index) => ({ month: `P${index + 1}`, revenue: parsePrice(item.amount) }));
  const statusCounts = ['Activ', 'Expirat', 'Suspendat', 'Rezervat'].map((status, index) => ({
    name: status,
    value: membersData.filter((item) => item.status === status).length,
    color: ['#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Membri activi" value={String(activeMembers)} change="Date actualizate live" helper="Membri cu status activ" icon={UserCheck} />
        <StatCard title="Abonamente cu atenționare" value={String(expiringSoon)} change="Expirate sau suspendate" helper="Necesită follow-up" icon={CalendarClock} />
        <StatCard title="Încasări totale" value={`${totalRevenue.toLocaleString('ro-RO')} RON`} change="Calcul din plățile salvate" helper="Date persistente în aplicație" icon={BadgeEuro} />
        <StatCard title="Filiale active" value={String(branchesCount)} change="Repartizare membri pe locații" helper="Filiale definite în sistem" icon={Building2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Venituri din tranzacții salvate" action={<button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Actualizat automat</button>}>
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
          <SectionCard title="Status membri">
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
          <SectionCard title="Activitate săptămânală">
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
          <SectionCard title="Automatizări active">
            <div className="space-y-3">
              {[
                'Notificări expirare abonamente',
                'Activare automată după plată confirmată',
                'Expirare automată servicii consumate',
                'Publicare anunțuri programate',
                `Total abonamente definite: ${subscriptionsData.length}`,
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item}</p>
                    <p className="text-xs text-slate-500">Date păstrate local și valabile în sesiune și după refresh.</p>
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

function MembersView({ items, onCreate, onEdit }: MembersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Toate');
  const [subscriptionFilter, setSubscriptionFilter] = useState('Toate');
  const [branchFilter, setBranchFilter] = useState('Toate');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const subscriptionOptions = useMemo<string[]>(() => ['Toate', ...Array.from(new Set(items.map((item) => item.subscription).filter(Boolean)))], [items]);
  const branchOptions = useMemo<string[]>(() => ['Toate', ...Array.from(new Set(items.map((item) => item.branch).filter(Boolean)))], [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((member) => {
      const matchesSearch = !term
        || member.name.toLowerCase().includes(term)
        || member.email.toLowerCase().includes(term)
        || member.phone.toLowerCase().includes(term)
        || member.id.toLowerCase().includes(term)
        || (member.address || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'Toate' || member.status === statusFilter;
      const matchesSubscription = subscriptionFilter === 'Toate' || member.subscription === subscriptionFilter;
      const matchesBranch = branchFilter === 'Toate' || member.branch === branchFilter;
      return matchesSearch && matchesStatus && matchesSubscription && matchesBranch;
    });
  }, [items, searchTerm, statusFilter, subscriptionFilter, branchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, subscriptionFilter, branchFilter, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, currentPage, perPage]);

  const startItem = filteredItems.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, filteredItems.length);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('Toate');
    setSubscriptionFilter('Toate');
    setBranchFilter('Toate');
    setPerPage(5);
    setCurrentPage(1);
  };

  return (
    <SectionCard
      title="Management membri"
      action={
        <div className="flex items-center gap-2">
          <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            <Filter className="mr-2 inline h-4 w-4" />Resetează filtre
          </button>
          <button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="mr-2 inline h-4 w-4" />Adaugă membru
          </button>
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Input label="Căutare" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Caută după nume, email, telefon, ID sau adresă" />
        </div>
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {['Toate', 'Activ', 'Expirat', 'Suspendat', 'Rezervat'].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select label="Abonament" value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)}>
          {subscriptionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select label="Filială" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          {branchOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div>
          Afișare <span className="font-semibold text-slate-900">{startItem}-{endItem}</span> din <span className="font-semibold text-slate-900">{filteredItems.length}</span> membri
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Pe pagină</span>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
            {[5, 10, 20].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Membru</th>
              <th className="pb-3 font-semibold">Contact</th>
              <th className="pb-3 font-semibold">Abonament</th>
              <th className="pb-3 font-semibold">Filială</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Ultima comunicare</th>
              <th className="pb-3 font-semibold text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? paginatedItems.map((member) => (
              <tr key={member.id} className="border-b border-slate-100">
                <td className="py-4"><div><p className="font-semibold text-slate-900">{member.name}</p><p className="text-xs text-slate-500">{member.id}</p></div></td>
                <td className="py-4 text-slate-600"><p>{member.email}</p><p className="text-xs text-slate-500">{member.phone}</p></td>
                <td className="py-4 text-slate-700">{member.subscription}</td>
                <td className="py-4 text-slate-600">{member.branch || '-'}</td>
                <td className="py-4"><StatusBadge status={member.status} /></td>
                <td className="py-4 text-slate-600">{member.lastContact}</td>
                <td className="py-4 text-right"><button onClick={() => onEdit(member)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button></td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-500">Nu există membri care să corespundă filtrelor selectate.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">Pagina <span className="font-semibold text-slate-900">{currentPage}</span> din <span className="font-semibold text-slate-900">{totalPages}</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(currentPage - 3, 0), Math.max(currentPage - 3, 0) + 5).map((pageNumber) => (
            <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={cn('rounded-2xl px-4 py-2 text-sm font-semibold', currentPage === pageNumber ? 'bg-violet-600 text-white' : 'border border-slate-200 text-slate-700')}>
              {pageNumber}
            </button>
          ))}
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Următor</button>
        </div>
      </div>
    </SectionCard>
  );
}

function BranchesView({ branches, membersData }: BranchesViewProps) {
  return (
    <SectionCard title="Filiale" action={<span className="rounded-2xl bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">{branches.length} filiale</span>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {branches.map((branch) => {
          const membersCount = membersData.filter((member) => member.branch === branch).length;
          const activeMembers = membersData.filter((member) => member.branch === branch && member.status === 'Activ').length;
          return (
            <div key={branch} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{branch}</h4>
                  <p className="mt-1 text-sm text-slate-500">Filială operațională</p>
                </div>
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Total membri:</span> {membersCount}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Membri activi:</span> {activeMembers}</div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function AdminsView() {
  return (
    <SectionCard title="Administratori" action={<button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Adaugă administrator</button>}>
      <div className="space-y-3">
        {['Administrator', 'Operator 1', 'Manager Filială'].map((role, index) => (
          <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <div>
              <p className="font-semibold text-slate-900">{role}</p>
              <p className="text-sm text-slate-500">Acces configurabil pe module</p>
            </div>
            <StatusBadge status="Activ" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SubscriptionsView({ items, onCreate, onEdit }: SubscriptionsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title="Management abonamente / servicii" action={<button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Creează abonament</button>}>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">Durată: {item.duration} • Reînnoiri: {item.renewals}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-sm text-slate-500">Preț</p><p className="font-semibold text-slate-900">{item.price}</p></div>
                  <StatusBadge status={item.status} />
                  <button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <div>
        <SectionCard title="Reguli automatizări">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Notificare expirare</p><p className="mt-1">Trimite SMS cu 7 și 1 zi înainte de expirare.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Suspendare / reluare</p><p className="mt-1">Control manual de către operator sau administrator.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Activare automată</p><p className="mt-1">După confirmarea plății și actualizarea statusului.</p></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AnnouncementsView({ items, onCreate, onEdit }: AnnouncementsViewProps) {
  return (
    <SectionCard title="Anunțuri" action={<button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Anunț nou</button>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{item.audience}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Publicare: {item.scheduled}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button>
              <button className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye className="mr-2 inline h-4 w-4" />Preview</button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SmsView() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title="SMS și notificări" action={<button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">SMS nou</button>}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><Phone className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">SMS individual</h4></div><p className="mt-3 text-sm text-slate-600">Trimitere către un singur membru din profil sau listă.</p></div>
            <div className="rounded-3xl border border-slate-200 p-5"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-violet-600" /><h4 className="font-semibold text-slate-900">SMS bulk</h4></div><p className="mt-3 text-sm text-slate-600">Se poate crea campania și salva, fără trimitere automată implicită.</p></div>
            <div className="rounded-3xl border border-slate-200 p-5 md:col-span-2">
              <h4 className="font-semibold text-slate-900">Șabloane disponibile</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Expirare abonament', 'Confirmare plată', 'Program modificat', 'Reminder participare'].map((template) => <span key={template} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{template}</span>)}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      <div>
        <SectionCard title="Log mesaje">
          <div className="space-y-3 text-sm">
            {['SMS trimis către Andrei Popescu', 'Draft bulk creat pentru membri expirați', 'Reminder participare salvat ca șablon', 'Notificare expirare pregătită pentru 19 membri'].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-3 text-slate-600">{item}</div>)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PaymentsView({ items, onCreate, onEdit }: PaymentsViewProps) {
  return (
    <SectionCard title="Plăți și facturare" action={<div className="flex gap-2"><button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Download className="mr-2 inline h-4 w-4" />Export</button><button onClick={onCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Adaugă plată</button></div>}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Factură</th>
              <th className="pb-3 font-semibold">Membru</th>
              <th className="pb-3 font-semibold">Sumă</th>
              <th className="pb-3 font-semibold">Metodă</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-4 font-semibold text-slate-900">{item.invoice}</td>
                <td className="py-4 text-slate-600">{item.member}</td>
                <td className="py-4 text-slate-600">{item.amount}</td>
                <td className="py-4 text-slate-600">{item.method}</td>
                <td className="py-4"><StatusBadge status={item.status} /></td>
                <td className="py-4 text-right"><button onClick={() => onEdit(item)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil className="mr-2 inline h-4 w-4" />Editează</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function ReportsView({ membersData, subscriptionsData, paymentsData, announcementsData }: ReportsViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
      {[
        { title: 'Raport membri', desc: `${membersData.length} înregistrări salvate.` },
        { title: 'Raport abonamente', desc: `${subscriptionsData.length} tipuri de abonamente.` },
        { title: 'Raport plăți', desc: `${paymentsData.length} tranzacții existente.` },
        { title: 'Raport comunicări', desc: `${announcementsData.length} anunțuri salvate.` },
      ].map((item) => (
        <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Receipt className="h-6 w-6 text-violet-600" />
          <h4 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          <button className="mt-5 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Deschide raport</button>
        </div>
      ))}
    </div>
  );
}

function PageShell({ title, subtitle, backLabel, onBack, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />{backLabel}</button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Form Page</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-3xl bg-violet-50 p-4 text-sm text-violet-700">Datele completate aici sunt salvate local și rămân valabile.</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function MemberFormPage({ mode, data, onChange, onBack, onSave }: MemberFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare membru' : 'Adăugare membru'} subtitle="Profil complet membru / client, date contact, abonament și observații interne." backLabel="Înapoi la membri" onBack={onBack}>
      <SectionCard title="Date membru" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID membru" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="MBR-006" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Activ', 'Expirat', 'Suspendat', 'Rezervat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <Input label="Nume complet" value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)} placeholder="Nume membru" />
          <Input label="Telefon" value={data.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('phone', e.target.value)} placeholder="+40 7xx xxx xxx" />
          <Input label="E-mail" value={data.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('email', e.target.value)} placeholder="email@exemplu.ro" />
          <Select label="Filială" value={data.branch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('branch', e.target.value)}>
            <option value="">Selectează filiala</option>
            {initialBranches.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select label="Abonament asociat" value={data.subscription} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('subscription', e.target.value)}>
            <option value="">Selectează abonament</option>
            {initialSubscriptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </Select>
          <div className="md:col-span-2"><Input label="Adresă" value={data.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('address', e.target.value)} placeholder="Oraș, stradă, număr" /></div>
          <div className="md:col-span-2"><Textarea label="Observații" value={data.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('notes', e.target.value)} placeholder="Detalii interne, preferințe, istoric scurt..." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează membru</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function SubscriptionFormPage({ mode, data, onChange, onBack, onSave }: SubscriptionFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare abonament' : 'Adăugare abonament'} subtitle="Configurare durată, preț, status și descriere pentru serviciu sau plan." backLabel="Înapoi la abonamente" onBack={onBack}>
      <SectionCard title="Detalii abonament" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID abonament" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="SUB-005" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Activ', 'Expirat', 'Suspendat', 'Consumat', 'Rezervat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Denumire abonament" value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value)} placeholder="Premium 6 luni" /></div>
          <Input label="Durată" value={data.duration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('duration', e.target.value)} placeholder="6 luni / 10 ședințe" />
          <Input label="Preț" value={data.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('price', e.target.value)} placeholder="1200 RON" />
          <Input label="Număr reînnoiri" type="number" value={data.renewals} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('renewals', e.target.value)} placeholder="0" />
          <div className="md:col-span-2"><Textarea label="Descriere" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('description', e.target.value)} placeholder="Beneficii, acces, limitări, reguli de consum." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează abonament</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function AnnouncementFormPage({ mode, data, onChange, onBack, onSave }: AnnouncementFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare anunț' : 'Adăugare anunț'} subtitle="Segmentare, programare publicare și conținut pentru comunicarea către membri." backLabel="Înapoi la anunțuri" onBack={onBack}>
      <SectionCard title="Detalii anunț" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID anunț" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="ANN-004" />
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Draft', 'Programat', 'Publicat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Titlu" value={data.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('title', e.target.value)} placeholder="Titlu anunț" /></div>
          <Input label="Audiență" value={data.audience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('audience', e.target.value)} placeholder="Toți membrii activi" />
          <Input label="Dată programare" value={data.scheduled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('scheduled', e.target.value)} placeholder="2026-04-15 10:00" />
          <div className="md:col-span-2"><Textarea label="Conținut" value={data.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('content', e.target.value)} placeholder="Textul anunțului..." /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><Eye className="mr-2 inline h-4 w-4" />Preview</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează anunț</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function PaymentFormPage({ mode, data, onChange, onBack, onSave }: PaymentFormPageProps) {
  return (
    <PageShell title={mode === 'edit' ? 'Editare plată / factură' : 'Adăugare plată / factură'} subtitle="Gestionare tranzacții, statusuri și asociere cu membrul și factura." backLabel="Înapoi la plăți" onBack={onBack}>
      <SectionCard title="Detalii tranzacție" action={<StatusBadge status={data.status} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="ID intern" value={data.id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('id', e.target.value)} placeholder="PAY-005" />
          <Input label="Factură" value={data.invoice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('invoice', e.target.value)} placeholder="INV-2026-105" />
          <Input label="Membru" value={data.member} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('member', e.target.value)} placeholder="Nume membru" />
          <Input label="Sumă" value={data.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('amount', e.target.value)} placeholder="650 RON" />
          <Select label="Metodă plată" value={data.method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('method', e.target.value)}>{['Card', 'Numerar', 'Transfer'].map((item) => <option key={item}>{item}</option>)}</Select>
          <Select label="Status" value={data.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange('status', e.target.value)}>{['Plătit', 'În așteptare', 'Eșuat'].map((item) => <option key={item}>{item}</option>)}</Select>
          <div className="md:col-span-2"><Input label="Data tranzacției" value={data.transactionDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('transactionDate', e.target.value)} placeholder="2026-04-03" /></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Anulează</button>
          <button onClick={onSave} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Save className="mr-2 inline h-4 w-4" />Salvează tranzacție</button>
        </div>
      </SectionCard>
    </PageShell>
  );
}

function QuickCreateMenu({ onNavigate }: QuickCreateMenuProps) {
  const actions: Array<{ key: FormType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'member', label: 'Membru nou', icon: Users },
    { key: 'subscription', label: 'Abonament nou', icon: BadgeEuro },
    { key: 'announcement', label: 'Anunț nou', icon: Bell },
    { key: 'payment', label: 'Plată nouă', icon: CreditCard },
  ];

  return (
    <SectionCard title="Acțiuni rapide" action={<FileText className="h-5 w-5 text-violet-600" />}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} className="rounded-3xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
              <div className="inline-flex rounded-2xl bg-violet-100 p-3 text-violet-700"><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-base font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">Deschide o pagină nouă dedicată formularului.</p>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

export function Content({ current, page, membersData, subscriptionsData, announcementsData, paymentsData, navigateToForm, memberForm, setMemberForm, subscriptionForm, setSubscriptionForm, announcementForm, setAnnouncementForm, paymentForm, setPaymentForm, goBackToList, saveMember, saveSubscription, saveAnnouncement, savePayment }: ContentProps) {
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


export default Content;
