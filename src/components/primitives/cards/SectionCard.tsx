import React from 'react';

type SectionCardProps = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}