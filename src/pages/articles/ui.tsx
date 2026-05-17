import { X } from 'lucide-react';
import type { ArticleRelation } from '../../services/articlesService';

export function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  return (
    <div className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <button onClick={onClose} className="mr-3" aria-label="Inchide mesajul"><X className="inline h-4 w-4" /></button>
      {message}
    </div>
  );
}

export function names(items?: ArticleRelation[] | number[]) {
  return (items ?? []).map((item) => (typeof item === 'object' ? item.label || item.name || item.title || `#${item.id}` : `#${item}`)).join(', ') || '-';
}

export function normalizeList<T>(payload: T[] | { data?: T[] }) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}
