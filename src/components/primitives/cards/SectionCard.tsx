import React from 'react';

type SectionCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_30px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <h3 className="min-w-0 text-base font-bold tracking-[-0.01em] text-slate-950">{title}</h3>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-4 lg:p-6">{children}</div>
    </section>
  );
}
