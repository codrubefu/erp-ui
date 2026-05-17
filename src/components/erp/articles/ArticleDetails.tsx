import { Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SectionCard } from '../../primitives';
import { articlesService, type Article } from '../../../services/articlesService';
import { names } from './ui';
import { Can } from '../../Can';
import { ProtectedRoute } from '../../ProtectedRoute';
import { useTranslation } from 'react-i18next';

export default function ArticleDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const payload = await articlesService.get(id);
        if (!disposed) setArticle(payload);
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : t('articles.loadOneError'));
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void load();
    return () => {
      disposed = true;
    };
  }, [id]);

  if (loading) return <SectionCard title={t('articles.details')}><p className="text-sm text-slate-500">{t('articles.loadingOne')}</p></SectionCard>;
  if (error || !article) return <SectionCard title={t('articles.details')}><p className="text-sm font-semibold text-red-700">{error || t('articles.notFound')}</p></SectionCard>;

  return (
    <ProtectedRoute requiredRights={['articles.view', 'articles.manage']}>
      <SectionCard title={article.title} action={<div className="flex gap-2"><Link to="/erp/articles" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">{t('common.back')}</Link><Can anyOf={['articles.update', 'articles.manage']}><Link to={`/erp/articles/${article.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"><Edit3 className="h-4 w-4" />{t('common.edit')}</Link></Can></div>}>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <p className="md:col-span-2"><b>{t('articles.description')}:</b> {article.description || '-'}</p>
          <p><b>{t('articles.groups')}:</b> {names(article.groups)}</p>
          <p><b>{t('articles.locations')}:</b> {names(article.locations)}</p>
        </div>
      </SectionCard>
    </ProtectedRoute>
  );
}
