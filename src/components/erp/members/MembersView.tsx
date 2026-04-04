import { useEffect, useMemo, useState } from 'react';
import { Filter, Pencil, Plus } from 'lucide-react';
import { cn, Input, SectionCard, Select, StatusBadge } from '../../primitives';
import type { MembersViewProps } from '../shared/types';

export function MembersView({ items, onCreate, onEdit }: MembersViewProps) {
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