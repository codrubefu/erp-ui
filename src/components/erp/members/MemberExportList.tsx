import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button } from '../../primitives';
import { erpApiService, type ApiMemberExport } from '../../../services/ErpApiService';
import { downloadBlob } from '../../../utils/ui/downloadBlob';

const POLL_INTERVAL_MS = 3000;

function isRunning(item: ApiMemberExport) {
  return item.status === 'pending' || item.status === 'processing';
}

/** The user's recent exports. Change `refreshKey` after requesting a new one. */
export function MemberExportList({ refreshKey }: { refreshKey: number }) {
  const { t, i18n } = useTranslation();
  const [exports, setExports] = useState<ApiMemberExport[]>([]);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timeout: number | undefined;

    const load = async () => {
      let poll = true;
      try {
        const items = await erpApiService.listMemberExports();
        if (cancelled) return;
        setExports(items);
        poll = items.some(isRunning);
      } catch {
        // A failed poll says nothing about the export, so only retry after a new request.
        poll = false;
      }
      if (!cancelled && poll) timeout = window.setTimeout(() => void load(), POLL_INTERVAL_MS);
    };

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [refreshKey]);

  const download = async (item: ApiMemberExport) => {
    setDownloadingId(item.id);
    setError('');
    try {
      downloadBlob(await erpApiService.downloadMemberExport(item.id), `${t('members.export.filename')}-${item.created_at.slice(0, 10)}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('members.export.failed'));
    } finally {
      setDownloadingId('');
    }
  };

  const statusLabel = (item: ApiMemberExport) => {
    if (item.status === 'processing' && item.total) {
      return t('members.export.progress', { processed: item.processed, total: item.total });
    }
    return t(`members.export.status.${item.status}`, { total: item.total ?? 0 });
  };

  if (!exports.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3" aria-live="polite">
      <p className="mb-2 text-sm font-semibold text-slate-900">{t('members.export.recent')}</p>
      {error ? <Alert tone="error" className="mb-2">{error}</Alert> : null}
      <ul className="divide-y divide-slate-100">
        {exports.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-slate-600">
            <span>{new Date(item.created_at).toLocaleString(i18n.language)} - {statusLabel(item)}</span>
            {item.status === 'ready' ? (
              <Button size="sm" onClick={() => void download(item)} disabled={downloadingId !== ''}>
                <Download className="h-4 w-4" />{downloadingId === item.id ? t('members.export.downloading') : t('members.export.download')}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
