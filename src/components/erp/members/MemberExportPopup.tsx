import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button } from '../../primitives';
import { erpApiService, MEMBER_EXPORT_FIELDS, type MemberExportField } from '../../../services/ErpApiService';

const STORAGE_KEY = 'master-erp-member-export-fields';
const SENSITIVE_FIELDS: readonly MemberExportField[] = ['cnp', 'ci'];

const defaultFields = MEMBER_EXPORT_FIELDS.filter((field) => !SENSITIVE_FIELDS.includes(field));

function storedFields(): MemberExportField[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(stored)) return defaultFields;
    const fields = defaultFields.filter((field) => stored.includes(field));
    return fields.length ? fields : defaultFields;
  } catch {
    return defaultFields;
  }
}

function storeFields(fields: MemberExportField[]) {
  try {
    // Sensitive fields must be chosen again for every export.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields.filter((field) => !SENSITIVE_FIELDS.includes(field))));
  } catch {
    // The selection is only a convenience.
  }
}

type MemberExportPopupProps = {
  query: Record<string, string>;
  total: number;
  onClose: () => void;
  onRequested: () => void;
};

export function MemberExportPopup({ query, total, onClose, onRequested }: MemberExportPopupProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<MemberExportField[]>(storedFields);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (field: MemberExportField, checked: boolean) => {
    setSelected((prev) => MEMBER_EXPORT_FIELDS.filter((item) => (item === field ? checked : prev.includes(item))));
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await erpApiService.requestMemberExport(query, selected, i18n.language.slice(0, 2));
      storeFields(selected);
      onRequested();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('members.export.failed'));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/40 p-4">
      <div className="mx-auto grid min-h-full max-w-2xl place-items-center">
        <div role="dialog" aria-modal="true" aria-labelledby="member-export-title" className="w-full rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 id="member-export-title" className="text-lg font-semibold text-slate-900">{t('members.export.title')}</h3>
              <p className="text-sm text-slate-500">{t('members.export.summary', { total })}</p>
            </div>
            <Button onClick={onClose} size="icon" aria-label={t('common.close')}><X className="h-4 w-4" /></Button>
          </div>

          {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSelected([...MEMBER_EXPORT_FIELDS])}>{t('common.selectAll')}</Button>
            <Button size="sm" onClick={() => setSelected([])}>{t('members.export.deselectAll')}</Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {MEMBER_EXPORT_FIELDS.map((field) => (
              <label key={field} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" checked={selected.includes(field)} onChange={(event) => toggle(field, event.target.checked)} />
                <span>{t(`members.export.fields.${field}`)}{SENSITIVE_FIELDS.includes(field) ? ' *' : ''}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">* {t('members.export.sensitive')}</p>

          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={() => void submit()} disabled={loading || !selected.length}>
              <Download className="h-4 w-4" />{loading ? t('members.export.starting') : t('members.export.start')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
