const API_BASE_URL = import.meta.env.VITE_ERP_API_URL ?? '/api';
const TOKEN_KEY = 'master-erp-api-token';

export type EventStatus = 'active' | 'inactive' | 'cancelled';
export type RecurrenceType = 'once' | 'weekly' | 'monthly';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type OccurrenceStatus = 'scheduled' | 'cancelled' | 'completed';
export type ParticipantStatus = 'registered' | 'attended' | 'cancelled' | 'no_show';

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type Paginated<T> = {
  data: T[];
  meta?: PaginationMeta;
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type EventSubscription = {
  id: number;
  name: string;
};

export type EventUser = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  has_active_subscription?: boolean;
  active_subscriptions?: EventSubscription[];
};

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  recurrence_type: RecurrenceType;
  recurrence_days: Weekday[] | null;
  monthly_day: number | null;
  start_date: string;
  end_date: string | null;
  requires_active_subscription: boolean;
  required_subscription_id: number | null;
  required_subscription?: EventSubscription | null;
  max_participants: number | null;
  status: EventStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EventPayload = Omit<EventItem, 'id' | 'created_at' | 'updated_at' | 'required_subscription'>;

export type EventOccurrence = {
  id: number;
  event_id: number;
  occurrence_date: string;
  start_datetime: string;
  end_datetime: string;
  status: OccurrenceStatus;
  participants_count: number;
  available_places: number | null;
  event?: EventItem;
};

export type EventParticipant = {
  id?: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  user?: EventUser;
  status: ParticipantStatus;
  registered_at: string;
  notes: string | null;
};

export type EventFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  recurrence_type?: string;
  requires_active_subscription?: string;
  sort?: 'created_at' | 'start_date' | 'title';
  direction?: 'asc' | 'desc';
};

export type OccurrenceFilters = {
  date_from?: string;
  date_to?: string;
  status?: string;
};

export type AddParticipantPayload = {
  user_id: number;
  status?: ParticipantStatus;
  registered_at?: string | null;
  notes?: string | null;
};

export type UpdateParticipantStatusPayload = {
  status: ParticipantStatus;
  notes?: string | null;
};

export type ApiValidationError = Error & {
  status?: number;
  errors?: Record<string, string[]>;
};

function unwrap<T>(payload: T | { data?: T }) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as { data?: T };
    if (Array.isArray(envelope.data) && ('meta' in payload || 'current_page' in payload || 'links' in payload)) return payload as T;
    return envelope.data as T;
  }
  return payload as T;
}

function normalizeError(error: unknown): ApiValidationError {
  return (error instanceof Error ? error : new Error('Cererea catre API a esuat.')) as ApiValidationError;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}${query.size ? `?${query.toString()}` : ''}`;
}

async function request<T>(path: string, options: RequestInit = {}, params?: Record<string, string | number | boolean | undefined>) {
  try {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(buildUrl(path, params), { ...options, headers });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const normalized = new Error(payload?.message ?? 'Cererea catre API a esuat.') as ApiValidationError;
      normalized.status = response.status;
      normalized.errors = payload?.errors;
      throw normalized;
    }
    return unwrap<T>(payload as T | { data?: T });
  } catch (error) {
    throw normalizeError(error);
  }
}

export const eventService = {
  getEvents: (params: EventFilters = {}) => request<Paginated<EventItem>>('/events', {}, params),
  getEvent: (id: number) => request<EventItem>(`/events/${id}`),
  createEvent: (payload: EventPayload) => request<EventItem>('/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id: number, payload: EventPayload) => request<EventItem>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEvent: (id: number) => request<void>(`/events/${id}`, { method: 'DELETE' }),
  getEventOccurrences: (eventId: number, params: OccurrenceFilters = {}) => request<Paginated<EventOccurrence>>(`/events/${eventId}/occurrences`, {}, params),
  getOccurrence: (id: number) => request<EventOccurrence>(`/event-occurrences/${id}`),
  cancelOccurrence: (_id: number) => Promise.reject(new Error('Swagger nu expune un endpoint pentru anularea aparitiei.')),
  getOccurrenceParticipants: (occurrenceId: number) => request<Paginated<EventParticipant> | EventParticipant[]>(`/event-occurrences/${occurrenceId}/participants`, {}, { per_page: 100 }),
  addOccurrenceParticipant: (occurrenceId: number, payload: AddParticipantPayload) => request<EventParticipant>(`/event-occurrences/${occurrenceId}/participants`, { method: 'POST', body: JSON.stringify(payload) }),
  removeOccurrenceParticipant: (occurrenceId: number, userId: number) => request<void>(`/event-occurrences/${occurrenceId}/participants/${userId}`, { method: 'DELETE' }),
  updateOccurrenceParticipantStatus: (occurrenceId: number, userId: number, payload: UpdateParticipantStatusPayload) => request<EventParticipant>(`/event-occurrences/${occurrenceId}/participants/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  searchUsers: (search: string, page = 1, perPage = 10) => request<Paginated<EventUser> | EventUser[]>('/users', {}, { search, page, per_page: perPage }),
  getSubscriptions: () => request<EventSubscription[] | Paginated<EventSubscription>>('/subscriptions', {}, { per_page: 100, is_active: 1 }),
};

export const payloadExamples = {
  create: {
    title: 'Yoga saptamanal',
    description: 'Clasa pentru membri activi',
    location: 'Sala 1',
    start_time: '18:00',
    end_time: '19:00',
    recurrence_type: 'weekly',
    recurrence_days: ['monday', 'wednesday'],
    monthly_day: null,
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    requires_active_subscription: true,
    required_subscription_id: 3,
    max_participants: 20,
    status: 'active',
  },
  update: {
    title: 'Yoga saptamanal avansati',
    status: 'active',
  },
  addParticipant: {
    user_id: 42,
    status: 'registered',
    notes: 'Preferinta randul 2',
  },
};
