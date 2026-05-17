import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SectionCard } from '../../components/primitives';
import ArticleForm from '../../components/articles/ArticleForm';
import { articlesService, type Article, type ArticlePayload } from '../../services/articlesService';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function ArticleEdit() {
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
        if (!disposed) setError(err instanceof Error ? err.message : 'Nu am putut incarca article.');
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
      navigate('/erp/articles', { state: { message: 'Article a fost actualizat.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut actualiza article.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SectionCard title="Editeaza Article"><p className="text-sm text-slate-500">Se incarca article...</p></SectionCard>;
  if (!article && error) return <SectionCard title="Editeaza Article"><p className="text-sm font-semibold text-red-700">{error}</p></SectionCard>;

  return <ProtectedRoute requiredRights={['articles.update', 'articles.manage']}><ArticleForm mode="edit" initialData={article} onSubmit={save} submitting={submitting} serverError={error} /></ProtectedRoute>;
}
