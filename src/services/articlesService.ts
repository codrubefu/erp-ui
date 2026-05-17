import { erpApiService } from './ErpApiService';

export type ArticleRelation = {
  id: number;
  name?: string;
  label?: string;
  title?: string;
};

export type Article = {
  id: number;
  title: string;
  description: string;
  groups?: ArticleRelation[] | number[];
  locations?: ArticleRelation[] | number[];
};

export type ArticlePayload = {
  title: string;
  description: string;
  groups: number[];
  locations: number[];
};

type CollectionEnvelope<T> = {
  data?: T[];
};

function normalizeCollection<T>(payload: T[] | CollectionEnvelope<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function ids(items: ArticleRelation[] | number[] | undefined): number[] {
  return (items ?? []).map((item) => Number(typeof item === 'object' ? item.id : item)).filter(Boolean);
}

function articlePayload(data: ArticlePayload): ArticlePayload {
  return {
    title: data.title,
    description: data.description,
    groups: ids(data.groups),
    locations: ids(data.locations),
  };
}

export const articlesService = {
  list(filters: Record<string, string | number | undefined> = {}) {
    return erpApiService.list<Article>('articles', filters);
  },
  get(id: string | number | undefined) {
    return erpApiService.get<Article>('articles', Number(id));
  },
  create(data: ArticlePayload) {
    return erpApiService.create<Article>('articles', { ...articlePayload(data) });
  },
  update(id: string | number | undefined, data: ArticlePayload) {
    return erpApiService.update<Article>('articles', Number(id), { ...articlePayload(data) });
  },
  remove(id: string | number | undefined) {
    return erpApiService.remove('articles', Number(id));
  },
  async groups() {
    return normalizeCollection(await erpApiService.list<ArticleRelation>('groups'));
  },
  async locations() {
    return normalizeCollection(await erpApiService.list<ArticleRelation>('locations'));
  },
};
