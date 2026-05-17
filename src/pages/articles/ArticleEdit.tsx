import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SectionCard } from '../../components/primitives';
import ArticleForm from '../../components/erp/articles/ArticleForm';
import { articlesService, type Article, type ArticlePayload } from '../../services/articlesService';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useTranslation } from 'react-i18next';

export default function ArticleEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const save = async (form: ArticlePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await articlesService.update(id, form);
      navigate('/erp/articles', { state: { message: t('articles.updated') } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('articles.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SectionCard title={t('articles.edit')}><p className="text-sm text-slate-500">{t('articles.loadingOne')}</p></SectionCard>;
  if (!article && error) return <SectionCard title={t('articles.edit')}><p className="text-sm font-semibold text-red-700">{error}</p></SectionCard>;

  return <ProtectedRoute requiredRights={['articles.update', 'articles.manage']}><ArticleForm mode="edit" initialData={article} onSubmit={save} submitting={submitting} serverError={error} /></ProtectedRoute>;
}
