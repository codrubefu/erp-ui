import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleForm from '../../components/articles/ArticleForm';
import { articlesService, type ArticlePayload } from '../../services/articlesService';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function ArticleCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const save = async (form: ArticlePayload) => {
    setSubmitting(true);
    setError('');
    try {
      await articlesService.create(form);
      navigate('/erp/articles', { state: { message: 'Article a fost creat.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut crea article.');
    } finally {
      setSubmitting(false);
    }
  };

  return <ProtectedRoute requiredRights={['articles.create', 'articles.manage']}><ArticleForm mode="create" onSubmit={save} submitting={submitting} serverError={error} /></ProtectedRoute>;
}
