import React from 'react';
import { Lock, User } from 'lucide-react';

type Credentials = {
  username: string;
  password: string;
};

type LoginViewProps = {
  credentials: Credentials;
  onChange: (field: keyof Credentials, value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string;
};

export function LoginView({ credentials, onChange, onSubmit, loading = false, error }: LoginViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-fuchsia-50 p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Master ERP</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight">Autentificare in platforma de management pentru membri si operatiuni.</h1>
            <p className="mt-4 max-w-xl text-base text-white/80">Acces rapid la membri, filiale, administratori, abonamente, anunturi, plati si rapoarte. Datele introduse in interfata sunt salvate local si raman valabile dupa refresh.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['Organizare', 'Filiale si administratori'],
              ['Abonamente', 'Creare si editare'],
              ['Plati', 'Istoric si facturare'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-lg font-semibold">{title}</p>
                <p className="mt-1 text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Login</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Conectare cont</h2>
              <p className="mt-2 text-sm text-slate-500">Conectare prin endpoint-ul bearer token din API.</p>
            </div>
            <form
              className="space-y-5"
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User className="h-4 w-4 text-violet-600" /> Utilizator / E-mail
                </div>
                <input
                  type="email"
                  value={credentials.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('username', e.target.value)}
                  placeholder="test@example.com"
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="h-4 w-4 text-violet-600" /> Parola
                </div>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('password', e.target.value)}
                  placeholder="password"
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Se conecteaza...' : 'Intra in aplicatie'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
