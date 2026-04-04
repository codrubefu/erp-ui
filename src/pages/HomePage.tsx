import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">ERP UI</p>
        <h1 className="mt-3 text-3xl font-bold">Pagina principala</h1>
        <p className="mt-3 text-slate-600">Am adaugat routing cu React Router ?i pagini separate.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/erp" className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Deschide aplica?ia ERP</Link>
          <Link to="/about" className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Despre proiect</Link>
        </div>
      </div>
    </main>
  );
}
