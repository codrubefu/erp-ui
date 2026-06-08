import { ChevronLeft, ChevronRight, Edit3, Filter, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, SectionCard, StatusBadge, SuccessMessage, Textarea } from '../../primitives';
import { erpApiService, type ApiCustomField, type ApiCustomFieldValue, type ApiCustomFieldValues, type ApiGroup, type ApiLocation, type ApiPaginated, type ApiPayment, type ApiSubscription, type ApiUser, type ApiUserSubscription, type ApiUserSubscriptionAssignment } from '../../../services/ErpApiService';
import { PageShell } from '../shared/PageShell';
import { PaymentPopup, type PaymentPopupValues } from '../payments/PaymentPopup';

type UserFormTab = 'details' | 'information' | 'groups' | 'locations' | 'subscriptions';

type UserForm = {
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  active: boolean;
  group_ids: string;
  location_ids: string;
  subscriptions: ApiUserSubscriptionAssignment[];
  custom_fields: Record<string, unknown>;
};

type SubscriptionPaymentForm = {
  id: number | null;
  first_name: string;
  last_name: string;
  subscription_id: string;
  subscription_reference: string;
  subscription_name: string;
  subscription_description: string;
  amount: string;
  currency: string;
  payment_type_id: string;
  paid_at: string;
};

export type UserManagementViewProps = {
  resource: string;
  title?: string;
  addLabel?: string;
  countLabel?: string;
  singularLabel?: string;
  entityLabel?: string;
  newEntityLabel?: string;
  showGroupsInList?: boolean;
  useRelationTabs?: boolean;
};

const emptyForm: UserForm = {
  user_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  active: true,
  group_ids: '',
  location_ids: '',
  subscriptions: [],
  custom_fields: {},
};

const emptyPaymentForm: SubscriptionPaymentForm = {
  id: null,
  first_name: '',
  last_name: '',
  subscription_id: '',
  subscription_reference: '',
  subscription_name: '',
  subscription_description: '',
  amount: '',
  currency: '',
  payment_type_id: '',
  paid_at: '',
};

function toIdList(value: string) {
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean);
}

function relationIds(items?: Array<{ id?: number }>) {
  return items?.map((item) => item.id).filter(Boolean).join(', ') ?? '';
}

function relationLabels(items?: Array<{ id?: number; label?: string; name?: string }>) {
  if (!items?.length) return '-';
  return items.map((item) => item.label || item.name || `#${item.id}`).join(', ');
}

function mergeById<T extends { id?: number }>(...groups: Array<T[] | undefined>) {
  const items = new Map<number, T>();
  groups.flatMap((group) => group ?? []).forEach((item) => {
    if (item.id) items.set(item.id, { ...items.get(item.id), ...item });
  });
  return Array.from(items.values());
}

function selectedIds(value: string) {
  return toIdList(value).map(String);
}

function idsFromSelect(options: HTMLCollectionOf<HTMLOptionElement>) {
  return Array.from(options)
    .filter((option) => option.selected)
    .map((option) => option.value)
    .join(', ');
}

function toggleId(value: string, id: number, checked: boolean) {
  const ids = new Set(toIdList(value));
  if (checked) {
    ids.add(id);
  } else {
    ids.delete(id);
  }
  return Array.from(ids).join(', ');
}

function userName(user: ApiUser) {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function dateTimeLocalToApi(value: string) {
  if (!value) return '';
  return value.length === 16 ? `${value.replace('T', ' ')}:00` : value.replace('T', ' ');
}

function apiDateTimeToLocal(value?: string | null) {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

function amountFromSubscription(subscription?: ApiSubscription | ApiUserSubscription | null) {
  if (subscription?.price === undefined || subscription.price === null) return '';
  return String(subscription.price);
}

function paymentFormFromSelection(form: UserForm, subscription?: ApiSubscription | ApiUserSubscription | null): SubscriptionPaymentForm {
  if (!subscription) {
    return {
      ...emptyPaymentForm,
      first_name: form.first_name,
      last_name: form.last_name,
      paid_at: currentDateTimeLocal(),
    };
  }

  return {
    id: null,
    first_name: form.first_name,
    last_name: form.last_name,
    subscription_id: String(subscription.id),
    subscription_reference: String(subscription.id),
    subscription_name: subscription.name ?? '',
    subscription_description: subscription.description ?? '',
    amount: amountFromSubscription(subscription),
    currency: subscription.currency ?? '',
    payment_type_id: '',
    paid_at: currentDateTimeLocal(),
  };
}

function paymentFormFromPayment(payment: ApiPayment, form: UserForm, subscription?: ApiSubscription | ApiUserSubscription | null): SubscriptionPaymentForm {
  return {
    id: payment.id,
    first_name: payment.first_name ?? form.first_name,
    last_name: payment.last_name ?? form.last_name,
    subscription_id: String(payment.subscription_id ?? subscription?.id ?? ''),
    subscription_reference: String(payment.subscription_id ?? subscription?.id ?? ''),
    subscription_name: subscription?.name ?? payment.subscription?.name ?? '',
    subscription_description: subscription?.description ?? payment.subscription?.description ?? '',
    amount: String(payment.amount ?? ''),
    currency: subscription?.currency ?? payment.subscription?.currency ?? '',
    payment_type_id: String(payment.payment_type_id ?? ''),
    paid_at: apiDateTimeToLocal(payment.paid_at),
  };
}

function paymentPopupValuesFromSubscriptionForm(form: SubscriptionPaymentForm): PaymentPopupValues {
  return {
    first_name: form.first_name,
    last_name: form.last_name,
    amount: form.amount,
    currency: form.currency,
    payment_type_id: form.payment_type_id,
    paid_at: form.paid_at,
    reference_id: form.subscription_id,
    reference_label: 'Subscription ID',
    reference_name: form.subscription_name,
    reference_description: form.subscription_description,
  };
}

function paymentMethodLabel(payment: ApiPayment) {
  if (payment.payment_type_id === 1) return 'Cash';
  if (payment.payment_type_id === 2) return 'Card';
  if (payment.payment_type_id === 3) return 'Bank transfer';
  return payment.payment_type ?? '-';
}

function subscriptionAssignmentsFromUser(user: ApiUser): ApiUserSubscriptionAssignment[] {
  const source = user.active_subscriptions?.length
    ? user.active_subscriptions
    : mergeById(user.subscriptions).filter((subscription) => subscriptionIsActive(user, subscription.id, subscription));

  return source.map((subscription) => {
    const historyItem = user.subscription_history?.find((item) => item.subscription_id === subscription.id);
    return {
      id: subscription.id,
      start_date: historyItem?.start_date ?? subscription.start_date ?? subscription.pivot?.start_date ?? todayDate(),
      subscription_user_id: subscription.pivot?.id ?? historyItem?.id ?? null,
    };
  }) ?? [];
}

function subscriptionUserIdForAssignment(
  assignment: ApiUserSubscriptionAssignment | undefined,
  user: ApiUser | null,
  subscription?: ApiSubscription | ApiUserSubscription | null,
) {
  if (assignment?.subscription_user_id) return assignment.subscription_user_id;
  if (subscription?.pivot?.id) return subscription.pivot.id;
  const subscriptionId = assignment?.id ?? subscription?.id;
  if (!subscriptionId || !user) return null;
  const userSubscription = mergeById(user.subscriptions, user.active_subscriptions).find((item) => item.id === subscriptionId);
  const historyItem = user.subscription_history?.find((item) => item.subscription_id === subscriptionId && item.id);
  return userSubscription?.pivot?.id ?? historyItem?.id ?? null;
}

function hasActiveSubscription(user: ApiUser) {
  return user.has_active_subscription ?? Boolean(user.active_subscriptions?.length);
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}

function addDays(date: string | undefined, days: number | null | undefined) {
  if (!date || !days) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function subscriptionStartDate(subscription?: ApiSubscription | ApiUserSubscription | null) {
  return subscription?.start_date ?? subscription?.pivot?.start_date ?? null;
}

function subscriptionExpiresAt(subscription?: ApiSubscription | ApiUserSubscription | null) {
  return subscription?.expires_at ?? subscription?.pivot?.expires_at ?? null;
}

function subscriptionIsActive(user: ApiUser | null, subscriptionId: number, fallback?: ApiSubscription | ApiUserSubscription | null) {
  if (user?.active_subscriptions?.some((subscription) => subscription.id === subscriptionId)) return true;
  if (fallback?.pivot?.is_active !== undefined) return fallback.pivot.is_active;
  if (fallback?.expires_at) return fallback.expires_at >= todayDate();
  if (fallback?.pivot?.expires_at) return fallback.pivot.expires_at >= todayDate();
  return fallback?.is_active ?? true;
}

function subscriptionHistoryRows(user: ApiUser | null) {
  if (!user) return [];
  if (user.subscription_history?.length) return user.subscription_history.filter((item) => !item.is_active);

  return mergeById(user.subscriptions, user.active_subscriptions).map((subscription) => ({
    id: subscription.pivot?.id ?? null,
    subscription_id: subscription.id,
    name: subscription.name,
    start_date: subscriptionStartDate(subscription),
    expires_at: subscriptionExpiresAt(subscription),
    is_active: subscriptionIsActive(user, subscription.id, subscription),
  })).filter((item) => !item.is_active);
}

function userSubscriptionLabels(user: ApiUser) {
  return relationLabels(mergeById(user.subscriptions, user.active_subscriptions));
}

function buildPayload(form: UserForm) {
  const payload: Record<string, unknown> = {
    user_code: form.user_code.trim() || null,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone || null,
    active: form.active,
    group_ids: toIdList(form.group_ids),
    location_ids: toIdList(form.location_ids),
    subscriptions: form.subscriptions.map((subscription) => ({
      id: subscription.id,
      start_date: subscription.start_date || todayDate(),
    })),
  };

  return payload;
}

function buildCreatePayload(form: UserForm, includeCustomFields: boolean) {
  return {
    ...buildPayload(form),
    ...(includeCustomFields ? { custom_fields: form.custom_fields } : {}),
  };
}

function customFieldValuesFromUser(user: ApiUser) {
  const source = user.custom_fields ?? user.custom_field_values;
  return customFieldValuesFromPayload(source);
}

function customFieldValuesFromPayload(source?: ApiCustomFieldValues | null) {
  if (!source) return {};
  if (!Array.isArray(source)) return source;

  return source.reduce<Record<string, unknown>>((values, item: ApiCustomFieldValue) => {
    const key = item.slug ?? item.custom_field?.slug ?? item.custom_field_id ?? item.field_id ?? item.custom_field?.id;
    if (key !== undefined) values[String(key)] = item.value ?? '';
    return values;
  }, {});
}

function paginationFrom<T>(payload: ApiPaginated<T>, fallbackPage: number, fallbackPerPage: number) {
  return {
    current_page: payload.meta?.current_page ?? payload.current_page ?? fallbackPage,
    last_page: payload.meta?.last_page ?? payload.last_page ?? 1,
    per_page: payload.meta?.per_page ?? payload.per_page ?? fallbackPerPage,
    total: payload.meta?.total ?? payload.total ?? payload.data.length,
  };
}

function formFromUser(user: ApiUser): UserForm {
  return {
    user_code: user.user_code ?? '',
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    active: Boolean(user.active),
    group_ids: relationIds(user.groups),
    location_ids: relationIds(user.locations),
    subscriptions: subscriptionAssignmentsFromUser(user),
    custom_fields: customFieldValuesFromUser(user),
  };
}

async function loadUserCustomFieldValues(user: ApiUser) {
  try {
    return customFieldValuesFromPayload(await erpApiService.getEntityCustomFieldValues('users', user.id));
  } catch {
    return customFieldValuesFromUser(user);
  }
}

function sortedCustomFields(fields: ApiCustomField[]) {
  return [...fields].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
}

function customFieldValueKey(field: ApiCustomField) {
  return field.slug || String(field.id);
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.map(String) : value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : [];
}

export function UserManagementView({
  resource,
  title,
  addLabel,
  countLabel,
  singularLabel,
  entityLabel,
  newEntityLabel,
  showGroupsInList = false,
  useRelationTabs = false,
}: UserManagementViewProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [customFields, setCustomFields] = useState<ApiCustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [activeFormTab, setActiveFormTab] = useState<UserFormTab>('details');
  const [subscriptionToAdd, setSubscriptionToAdd] = useState('');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(todayDate());
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const [paymentSubscriptionId, setPaymentSubscriptionId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<SubscriptionPaymentForm>(emptyPaymentForm);
  const [subscriptionPayments, setSubscriptionPayments] = useState<ApiPayment[]>([]);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const resolvedTitle = title ?? t('members.title');
  const resolvedAddLabel = addLabel ?? t('members.add');
  const resolvedCountLabel = countLabel ?? t('members.countLabel');
  const resolvedSingularLabel = singularLabel ?? t('members.singularLabel');
  const resolvedEntityLabel = entityLabel ?? t('members.entityLabel');
  const resolvedNewEntityLabel = newEntityLabel ?? t('members.newEntityLabel');

  const selectedGroupIds = useMemo(() => selectedIds(form.group_ids), [form.group_ids]);
  const selectedLocationIds = useMemo(() => selectedIds(form.location_ids), [form.location_ids]);
  const selectedSubscriptionIds = useMemo(() => form.subscriptions.map((subscription) => String(subscription.id)), [form.subscriptions]);
  const selectedPaymentSubscription = useMemo(() => {
    const subscriptionId = Number(paymentSubscriptionId);
    if (!subscriptionId) return null;
    return subscriptions.find((subscription) => subscription.id === subscriptionId)
      ?? mergeById(editing?.subscriptions, editing?.active_subscriptions).find((subscription) => subscription.id === subscriptionId)
      ?? null;
  }, [editing, paymentSubscriptionId, subscriptions]);
  const userCustomFields = useMemo(() => sortedCustomFields(customFields), [customFields]);
  const formTabs = useMemo<Array<[UserFormTab, string]>>(() => {
    const tabs: Array<[UserFormTab, string]> = [
      ['details', 'Date utilizator'],
      ['information', t('users.information')],
    ];

    if (useRelationTabs) {
      tabs.push(['groups', t('users.groups')], ['locations', t('articles.locations')]);
    }

    tabs.push(['subscriptions', t('users.subscriptions')]);
    return tabs;
  }, [t, useRelationTabs]);

  const loadLookups = useCallback(async () => {
    try {
      const [groupData, locationData, subscriptionData] = await Promise.all([
        erpApiService.list<ApiGroup>('groups', { per_page: 100 }),
        erpApiService.list<ApiLocation>('locations', { per_page: 100 }),
        erpApiService.list<ApiSubscription>('subscriptions', { per_page: 100, is_active: '1' }),
      ]);
      setGroups(groupData);
      setLocations(locationData);
      setSubscriptions(subscriptionData);
    } catch {
      setGroups([]);
      setLocations([]);
      setSubscriptions([]);
    }

    try {
      setCustomFields(await erpApiService.list<ApiCustomField>('custom-fields', { entity_type: 'users' }));
    } catch {
      setCustomFields([]);
    }
  }, []);

  const fetchUsers = useCallback(async (search: string, limit: number, nextPage: number) => {
    setLoading(true);
    setError('');
    try {
      const payload = await erpApiService.listPaginated<ApiUser>(resource, {
        search: search.trim(),
        page: nextPage,
        per_page: limit,
      });
      setUsers(payload.data);
      setPagination(paginationFrom(payload, nextPage, limit));
      setPage(paginationFrom(payload, nextPage, limit).current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.loadError', { label: resolvedCountLabel }));
    } finally {
      setLoading(false);
    }
  }, [resolvedCountLabel, resource, t]);

  const loadUsers = useCallback((nextPage = page) => fetchUsers(searchTerm, perPage, nextPage), [fetchUsers, searchTerm, perPage, page]);

  const loadSubscriptionPayments = useCallback(async (user: ApiUser | null, assignments: ApiUserSubscriptionAssignment[]) => {
    if (!user || !assignments.length) {
      setSubscriptionPayments([]);
      return;
    }

    try {
      const paymentGroups = await Promise.all(assignments.map((assignment) => erpApiService.list<ApiPayment>('payments', {
        model_type: 'subscription_user',
        model_id: assignment.subscription_user_id ?? undefined,
        subscription_id: assignment.id,
        per_page: 100,
      })));
      const merged = mergeById(...paymentGroups).filter((payment) => (
        payment.user_id === undefined
        || payment.user_id === null
        || payment.user_id === user.id
      ));
      setSubscriptionPayments(merged);
    } catch {
      setSubscriptionPayments([]);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
    void fetchUsers('', 15, 1);
  }, [fetchUsers, loadLookups]);

  useEffect(() => {
    if (!paymentSubscriptionId || paymentForm.id) return;
    setPaymentError('');
    setPaymentSuccess('');
    setPaymentForm(paymentFormFromSelection(form, selectedPaymentSubscription));
  }, [form.first_name, form.last_name, paymentForm.id, paymentSubscriptionId, selectedPaymentSubscription]);

  const resetFilters = () => {
    setSearchTerm('');
    setPerPage(15);
    setPage(1);
    void fetchUsers('', 15, 1);
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSuccess('');
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    setPaymentSubscriptionId(null);
    setPaymentForm(emptyPaymentForm);
    setSubscriptionPayments([]);
    setPaymentError('');
    setPaymentSuccess('');
    setFormOpen(true);
  };

  const startEdit = async (user: ApiUser) => {
    let selectedUser = user;
    try {
      selectedUser = await erpApiService.get<ApiUser>('users', user.id);
    } catch {
      selectedUser = user;
    }
    const customFieldValues = await loadUserCustomFieldValues(selectedUser);
    setEditing(selectedUser);
    setForm({ ...formFromUser(selectedUser), custom_fields: customFieldValues });
    setSuccess('');
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    setPaymentSubscriptionId(null);
    setPaymentForm(emptyPaymentForm);
    setSubscriptionPayments([]);
    setPaymentError('');
    setPaymentSuccess('');
    setFormOpen(true);
    void loadSubscriptionPayments(selectedUser, subscriptionAssignmentsFromUser(selectedUser));
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setSuccess('');
    setActiveFormTab('details');
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    setPaymentSubscriptionId(null);
    setPaymentForm(emptyPaymentForm);
    setSubscriptionPayments([]);
    setPaymentError('');
    setPaymentSuccess('');
  };

  const persistSubscriptionAssignments = async (nextSubscriptions: ApiUserSubscriptionAssignment[]) => {
    if (!editing) return;
    setSubscriptionSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextForm = { ...form, subscriptions: nextSubscriptions };
      await erpApiService.update<ApiUser>(resource, editing.id, buildPayload(nextForm));
      const savedUser = await erpApiService.get<ApiUser>('users', editing.id);
      const customFieldValues = await loadUserCustomFieldValues(savedUser);
      const savedForm = { ...formFromUser(savedUser), custom_fields: customFieldValues };
      setEditing(savedUser);
      setForm(savedForm);
      await loadSubscriptionPayments(savedUser, savedForm.subscriptions);
      setSuccess(t('common.saved'));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.saveError', { label: resolvedSingularLabel }));
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const updateSubscriptionStartDate = (subscriptionId: number, startDate: string) => {
    const nextSubscriptions = form.subscriptions.map((subscription) => (
      subscription.id === subscriptionId ? { ...subscription, start_date: startDate } : subscription
    ));
    setForm((prev) => ({ ...prev, subscriptions: nextSubscriptions }));
    void persistSubscriptionAssignments(nextSubscriptions);
  };

  const addSubscriptionAssignment = () => {
    const subscriptionId = Number(subscriptionToAdd);
    if (!subscriptionId) return;
    if (form.subscriptions.some((subscription) => subscription.id === subscriptionId)) return;
    const nextSubscriptions = [...form.subscriptions, { id: subscriptionId, start_date: subscriptionStartDate || todayDate() }];
    setForm((prev) => ({ ...prev, subscriptions: nextSubscriptions }));
    setSubscriptionToAdd('');
    setSubscriptionStartDate(todayDate());
    void persistSubscriptionAssignments(nextSubscriptions);
  };

  const selectSubscriptionForPayment = (subscriptionId: number) => {
    if (!form.subscriptions.some((subscription) => subscription.id === subscriptionId)) return;
    const subscription = subscriptions.find((item) => item.id === subscriptionId)
      ?? mergeById(editing?.subscriptions, editing?.active_subscriptions).find((item) => item.id === subscriptionId)
      ?? null;
    setPaymentSubscriptionId(subscriptionId);
    setPaymentForm(paymentFormFromSelection(form, subscription));
    setPaymentError('');
    setPaymentSuccess('');
  };

  const editPayment = (payment: ApiPayment, subscription?: ApiSubscription | ApiUserSubscription | null) => {
    const subscriptionId = Number(payment.subscription_id ?? subscription?.id);
    if (!subscriptionId) return;
    setPaymentSubscriptionId(subscriptionId);
    setPaymentForm(paymentFormFromPayment(payment, form, subscription));
    setPaymentError('');
    setPaymentSuccess('');
  };

  const updatePaymentForm = (field: keyof SubscriptionPaymentForm, value: string) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePaymentPopupForm = <K extends keyof PaymentPopupValues>(field: K, value: PaymentPopupValues[K]) => {
    const mappedFields: Partial<Record<keyof PaymentPopupValues, keyof SubscriptionPaymentForm>> = {
      first_name: 'first_name',
      last_name: 'last_name',
      amount: 'amount',
      currency: 'currency',
      payment_type_id: 'payment_type_id',
      paid_at: 'paid_at',
      reference_id: 'subscription_id',
      reference_name: 'subscription_name',
      reference_description: 'subscription_description',
    };
    const targetField = mappedFields[field];
    if (!targetField) return;
    updatePaymentForm(targetField, String(value ?? ''));
    if (field === 'reference_id') updatePaymentForm('subscription_reference', String(value ?? ''));
  };

  const savePayment = async () => {
    const subscriptionId = Number(paymentForm.subscription_id || paymentSubscriptionId);
    const paymentTypeId = Number(paymentForm.payment_type_id);
    const amount = Number(paymentForm.amount);
    const assignment = form.subscriptions.find((item) => item.id === subscriptionId);
    const modelId = subscriptionUserIdForAssignment(assignment, editing, selectedPaymentSubscription);

    setPaymentError('');
    setPaymentSuccess('');

    if (!subscriptionId) {
      setPaymentError('Select a subscription before creating a payment.');
      return;
    }
    if (!modelId) {
      setPaymentError('Salveaza mai intai subscriptia userului, apoi adauga plata.');
      return;
    }
    if (![1, 2, 3].includes(paymentTypeId)) {
      setPaymentError('Select a valid payment type.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (!paymentForm.first_name.trim() || !paymentForm.last_name.trim() || !paymentForm.paid_at) {
      setPaymentError('First name, last name, and payment date/time are required.');
      return;
    }

    setPaymentSaving(true);
    try {
      const payload = {
        ...(editing ? { user_id: editing.id } : {}),
        model_type: 'subscription_user',
        model_id: modelId,
        subscription_id: subscriptionId,
        first_name: paymentForm.first_name.trim(),
        last_name: paymentForm.last_name.trim(),
        amount,
        payment_type_id: paymentTypeId,
        paid_at: dateTimeLocalToApi(paymentForm.paid_at),
      };
      let savedPayment: ApiPayment;
      if (paymentForm.id) {
        savedPayment = await erpApiService.update<ApiPayment>('payments', paymentForm.id, payload);
      } else {
        savedPayment = await erpApiService.create<ApiPayment>('payments', payload);
      }
      if (editing) {
        await loadSubscriptionPayments(editing, form.subscriptions);
      } else {
        setSubscriptionPayments((prev) => {
          const withoutSaved = prev.filter((payment) => payment.id !== savedPayment.id);
          return [...withoutSaved, savedPayment];
        });
      }
      setPaymentSubscriptionId(null);
      setPaymentForm(emptyPaymentForm);
      setPaymentSuccess('');
      setSuccess(paymentForm.id ? 'Payment updated.' : 'Payment saved.');
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not save payment.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const removeSubscriptionAssignment = (subscriptionId: number) => {
    const nextSubscriptions = form.subscriptions.filter((subscription) => subscription.id !== subscriptionId);
    setForm((prev) => ({ ...prev, subscriptions: nextSubscriptions }));
    if (paymentSubscriptionId === subscriptionId) {
      setPaymentSubscriptionId(null);
      setPaymentForm(emptyPaymentForm);
      setPaymentError('');
      setPaymentSuccess('');
    }
    void persistSubscriptionAssignments(nextSubscriptions);
  };

  const updateCustomField = (field: ApiCustomField, value: unknown) => {
    const key = customFieldValueKey(field);
    setForm((prev) => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, [key]: value },
    }));
  };

  const renderCustomField = (field: ApiCustomField) => {
    const key = customFieldValueKey(field);
    const value = form.custom_fields[key] ?? '';
    const label = `${field.name}${field.is_required ? ' *' : ''}`;
    const choices = field.options?.choices ?? [];

    if (field.type === 'textarea') {
      return <Textarea key={key} label={label} value={String(value)} onChange={(event) => updateCustomField(field, event.target.value)} rows={4} />;
    }

    if (field.type === 'select') {
      return (
        <label key={key} className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
          <select value={String(value)} onChange={(event) => updateCustomField(field, event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
            <option value="">{t('common.select')}</option>
            {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
        </label>
      );
    }

    if (field.type === 'multi_select') {
      return (
        <label key={key} className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
          <select multiple value={arrayValue(value)} onChange={(event) => updateCustomField(field, Array.from(event.currentTarget.selectedOptions).map((option) => option.value))} className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
            {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
        </label>
      );
    }

    if (field.type === 'checkbox' || field.type === 'boolean') {
      return (
        <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateCustomField(field, event.target.checked)} className="h-4 w-4 accent-violet-600" />
          {label}
        </label>
      );
    }

    if (field.type === 'file') {
      return <Input key={key} label={label} type="text" value={String(value)} onChange={(event) => updateCustomField(field, event.target.value)} placeholder={t('users.customFilePlaceholder')} />;
    }

    const inputType = field.type === 'datetime' ? 'datetime-local' : field.type === 'phone' ? 'tel' : field.type;
    return <Input key={key} label={label} type={inputType} value={String(value)} onChange={(event) => updateCustomField(field, event.target.value)} />;
  };

  const renderGroupCheckboxes = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {groups.length ? groups.map((group) => (
        <label key={group.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={selectedGroupIds.includes(String(group.id))}
            onChange={(event) => setForm((prev) => ({ ...prev, group_ids: toggleId(prev.group_ids, group.id, event.target.checked) }))}
            className="h-4 w-4 accent-violet-600"
          />
          {group.label || group.name}
        </label>
      )) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2">
          {t('access.empty')}
        </div>
      )}
    </div>
  );

  const renderLocationCheckboxes = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {locations.length ? locations.map((location) => (
        <label key={location.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={selectedLocationIds.includes(String(location.id))}
            onChange={(event) => setForm((prev) => ({ ...prev, location_ids: toggleId(prev.location_ids, location.id, event.target.checked) }))}
            className="h-4 w-4 accent-violet-600"
          />
          {location.name}
        </label>
      )) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2">
          {t('branches.empty')}
        </div>
      )}
    </div>
  );

  const saveUser = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let savedUser: ApiUser;
      const shouldSaveCustomFields = activeFormTab === 'information';
      if (editing) {
        savedUser = await erpApiService.update<ApiUser>(resource, editing.id, buildPayload(form));
        if (shouldSaveCustomFields) {
          await erpApiService.saveEntityCustomFieldValues('users', editing.id, form.custom_fields);
        }
        savedUser = await erpApiService.get<ApiUser>('users', editing.id);
      } else {
        savedUser = await erpApiService.create<ApiUser>(resource, buildCreatePayload(form, shouldSaveCustomFields));
      }
      const customFieldValues = await loadUserCustomFieldValues(savedUser);
      const savedForm = { ...formFromUser(savedUser), custom_fields: customFieldValues };
      setEditing(savedUser);
      setForm(savedForm);
      await loadSubscriptionPayments(savedUser, savedForm.subscriptions);
      setSuccess(t('common.saved'));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.saveError', { label: resolvedSingularLabel }));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: ApiUser) => {
    if (!window.confirm(t('users.deleteConfirm', { label: resolvedSingularLabel, name: userName(user) }))) return;
    setError('');
    try {
      await erpApiService.remove(resource, user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.deleteError', { label: resolvedSingularLabel }));
    }
  };

  if (formOpen) {
    return (
      <PageShell
        title={editing ? t('users.editTitle', { label: resolvedEntityLabel }) : resolvedAddLabel}
        subtitle={t('users.formSubtitle', { target: editing ? resolvedEntityLabel : resolvedNewEntityLabel })}
        backLabel={t('common.backToList', { list: resolvedCountLabel })}
        onBack={closeForm}
      >
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
        {success ? <SuccessMessage fixed>{success}</SuccessMessage> : null}
        <SectionCard
          title={editing ? t('users.editCardTitle', { label: resolvedEntityLabel, id: editing.id }) : t('users.addCardTitle', { label: resolvedEntityLabel })}
          action={
            <button onClick={closeForm} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <X className="h-4 w-4" />{t('common.close')}
            </button>
          }
        >
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
            {formTabs.map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveFormTab(tab as UserFormTab)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeFormTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeFormTab === 'details' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t('users.userCode')} value={form.user_code} onChange={(event) => setForm((prev) => ({ ...prev, user_code: event.target.value }))} placeholder="USR00000000000000000000000000001" maxLength={32} />
              <Input label={t('users.firstName')} value={form.first_name} onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))} placeholder="John" />
              <Input label={t('users.lastName')} value={form.last_name} onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))} placeholder="Doe" />
              <Input label={t('members.email')} type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="john@example.com" />
              <Input label={t('members.phone')} value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+15550001111" />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} className="h-4 w-4 accent-violet-600" />
                {t('users.activeUser')}
              </label>
              {!useRelationTabs ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.groups')}</span>
                    <select
                      multiple
                      value={selectedGroupIds}
                      onChange={(event) => {
                        const groupIds = idsFromSelect(event.currentTarget.selectedOptions);
                        setForm((prev) => ({ ...prev, group_ids: groupIds }));
                      }}
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {groups.map((group) => <option key={group.id} value={group.id}>{group.label || group.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">{t('articles.locations')}</span>
                    <select
                      multiple
                      value={selectedLocationIds}
                      onChange={(event) => {
                        const locationIds = idsFromSelect(event.currentTarget.selectedOptions);
                        setForm((prev) => ({ ...prev, location_ids: locationIds }));
                      }}
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          ) : activeFormTab === 'information' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {userCustomFields.length ? userCustomFields.map(renderCustomField) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2">
                  {t('users.noCustomFields')}
                </div>
              )}
            </div>
          ) : activeFormTab === 'groups' ? (
            renderGroupCheckboxes()
          ) : activeFormTab === 'locations' ? (
            renderLocationCheckboxes()
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.addSubscription')}</span>
                  <select value={subscriptionToAdd} onChange={(event) => setSubscriptionToAdd(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                    <option value="">{t('users.selectSubscription')}</option>
                    {subscriptions.filter((subscription) => !selectedSubscriptionIds.includes(String(subscription.id))).map((subscription) => (
                      <option key={subscription.id} value={subscription.id}>{subscription.name}</option>
                    ))}
                  </select>
                </label>
                <Input label={t('users.startDate')} type="date" value={subscriptionStartDate} onChange={(event) => setSubscriptionStartDate(event.target.value)} />
                <div className="flex items-end">
                  <Button onClick={addSubscriptionAssignment} disabled={!subscriptionToAdd || subscriptionSaving} variant="primary" className="w-full py-3 md:w-auto">
                    <Plus className="h-4 w-4" />{subscriptionSaving ? t('common.saving') : t('common.add')}
                  </Button>
                </div>
              </div>

              {selectedPaymentSubscription ? (
                <PaymentPopup
                  title={paymentForm.id ? `Edit payment #${paymentForm.id}` : 'Adauga plata'}
                  subtitle={selectedPaymentSubscription.name
                    ? `Plata pentru ${selectedPaymentSubscription.name}`
                    : `Plata pentru subscription #${paymentForm.subscription_id || selectedPaymentSubscription.id}`}
                  values={paymentPopupValuesFromSubscriptionForm(paymentForm)}
                  error={paymentError}
                  success={paymentSuccess}
                  saving={paymentSaving}
                  onChange={updatePaymentPopupForm}
                  onClose={() => {
                    setPaymentSubscriptionId(null);
                    setPaymentForm(emptyPaymentForm);
                    setPaymentError('');
                  }}
                  onSave={() => void savePayment()}
                />
              ) : null}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('users.currentSubscriptions')}</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{t('subscriptions.subscription')}</th>
                        <th className="px-4 py-3 font-semibold">{t('users.added')}</th>
                        <th className="px-4 py-3 font-semibold">{t('users.expires')}</th>
                        <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                        <th className="px-4 py-3 font-semibold text-right">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.subscriptions.length > 0 ? form.subscriptions.map((assignment) => {
                        const userSubscription = mergeById(editing?.subscriptions, editing?.active_subscriptions).find((item) => item.id === assignment.id);
                        const subscription = subscriptions.find((item) => item.id === assignment.id) ?? userSubscription;
                        const persistedExpiresAt = subscriptionExpiresAt(userSubscription);
                        const expiresAt = persistedExpiresAt ?? addDays(assignment.start_date, subscription?.duration_days);
                        const subscriptionUserId = subscriptionUserIdForAssignment(assignment, editing, subscription);
                        const paymentsForSubscription = subscriptionPayments.filter((payment) => (
                          subscriptionUserId
                            ? payment.model_id === subscriptionUserId || (payment.model_id === undefined && payment.subscription_id === assignment.id)
                            : payment.subscription_id === assignment.id
                        ));
                        return (
                          <tr key={assignment.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{subscription?.name ?? `#${assignment.id}`}</p>
                              <p className="text-xs text-slate-500">{subscription?.duration_days ? t('subscriptions.days', { count: subscription.duration_days }) : t('subscriptions.noAutoExpiry')}</p>
                              <div className="mt-3 space-y-2">
                                {paymentsForSubscription.length ? paymentsForSubscription.map((payment) => (
                                  <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <p className="text-xs font-semibold text-slate-900">Payment #{payment.id} - {payment.amount}</p>
                                        <p className="text-xs text-slate-500">{paymentMethodLabel(payment)} - {payment.paid_at ?? '-'}</p>
                                      </div>
                                      <Button onClick={() => editPayment(payment, subscription)} size="sm" className="px-2.5 py-1.5 text-xs">
                                        <Edit3 className="h-3.5 w-3.5" />{t('common.edit')}
                                      </Button>
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-xs text-slate-500">Nu exista plati atasate.</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input label={t('users.startDate')} type="date" value={assignment.start_date ?? ''} onChange={(event) => updateSubscriptionStartDate(assignment.id, event.target.value)} disabled={subscriptionSaving} />
                            </td>
                            <td className="px-4 py-3 text-slate-600">{expiresAt ?? t('subscriptions.noAutoExpiry')}</td>
                            <td className="px-4 py-3"><StatusBadge status={subscriptionIsActive(editing, assignment.id, userSubscription ?? subscription) ? t('users.statusActive') : t('users.statusExpired')} /></td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button onClick={() => selectSubscriptionForPayment(assignment.id)}>
                                  <Plus className="h-4 w-4" />Adauga plata noua
                                </Button>
                                <Button onClick={() => removeSubscriptionAssignment(assignment.id)} disabled={subscriptionSaving} variant="danger">
                                  <Trash2 className="h-4 w-4" />{t('common.delete')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">{t('users.noAttachedSubscriptions')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('users.subscriptionHistory')}</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{t('subscriptions.subscription')}</th>
                        <th className="px-4 py-3 font-semibold">{t('users.added')}</th>
                        <th className="px-4 py-3 font-semibold">{t('users.expires')}</th>
                        <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionHistoryRows(editing).length ? subscriptionHistoryRows(editing).map((item) => (
                        <tr key={`${item.subscription_id}-${item.id ?? item.start_date}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(item.start_date)}</td>
                          <td className="px-4 py-3 text-slate-600">{item.expires_at ? formatDate(item.expires_at) : t('subscriptions.noAutoExpiry')}</td>
                          <td className="px-4 py-3"><StatusBadge status={item.is_active ? t('users.statusActive') : t('users.statusExpired')} /></td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">{t('users.noSubscriptionHistory')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button onClick={closeForm}>{t('common.cancel')}</Button>
            {activeFormTab !== 'subscriptions' ? <Button onClick={() => void saveUser()} disabled={saving} variant="primary">
              <Save className="h-4 w-4" />{saving ? t('users.saving') : t('common.save')}
            </Button> : null}
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={resolvedTitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <Filter className="mr-2 inline h-4 w-4" />{t('users.resetFilters')}
            </button>
            <button onClick={() => void loadUsers()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />{t('common.refresh')}
            </button>
            <button onClick={startCreate} className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              <Plus className="mr-2 inline h-4 w-4" />{resolvedAddLabel}
            </button>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
          <Input
            label={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setPage(1);
                void fetchUsers(searchTerm, perPage, 1);
              }
            }}
            placeholder={t('users.searchPlaceholder')}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{t('users.perPage')}</span>
            <select
              value={perPage}
              onChange={(event) => {
                const nextPerPage = Number(event.target.value);
                setPerPage(nextPerPage);
                setPage(1);
                void fetchUsers(searchTerm, nextPerPage, 1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            >
              {[10, 15, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={() => {
              setPage(1);
              void fetchUsers(searchTerm, perPage, 1);
            }} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{t('common.search')}</button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('users.showingCount', { count: pagination.total || users.length, label: resolvedCountLabel })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">{t('users.user')}</th>
                <th className="pb-3 font-semibold">{t('users.contact')}</th>
                {showGroupsInList ? <th className="pb-3 font-semibold">{t('users.groups')}</th> : null}
                <th className="pb-3 font-semibold">{t('users.subscriptions')}</th>
                <th className="pb-3 font-semibold">{t('articles.locations')}</th>
                <th className="pb-3 font-semibold">{t('common.status')}</th>
                <th className="pb-3 font-semibold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 align-top">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{userName(user)}</p>
                    <p className="text-xs text-slate-500">{user.user_code || `#${user.id}`}</p>
                  </td>
                  <td className="py-4 text-slate-600">
                    <p>{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone || '-'}</p>
                  </td>
                  {showGroupsInList ? <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.groups)}</td> : null}
                  <td className="max-w-[260px] py-4 text-slate-600">
                    <p>{userSubscriptionLabels(user)}</p>
                    <div className="mt-2"><StatusBadge status={hasActiveSubscription(user) ? t('users.statusActive') : t('users.noActiveSubscription')} /></div>
                  </td>
                  <td className="max-w-[260px] py-4 text-slate-600">{relationLabels(user.locations)}</td>
                  <td className="py-4"><StatusBadge status={user.active ? t('users.statusActive') : t('users.statusInactive')} /></td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => void startEdit(user)} className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Edit3 className="mr-2 h-4 w-4" />{t('common.edit')}
                      </button>
                      <button onClick={() => void deleteUser(user)} className="inline-flex items-center rounded-2xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />{t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={showGroupsInList ? 7 : 6} className="py-10 text-center text-sm text-slate-500">{loading ? t('users.loadingList', { label: resolvedCountLabel }) : t('users.emptyList', { label: resolvedCountLabel })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>{t('users.pageOf', { page: pagination.current_page, lastPage: pagination.last_page })}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadUsers(page - 1)}
              disabled={loading || page <= 1}
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />{t('users.previousPage')}
            </button>
            <button
              onClick={() => void loadUsers(page + 1)}
              disabled={loading || page >= pagination.last_page}
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('users.nextPage')}<ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionCard>

    </div>
  );
}

export type MembersViewProps = Omit<UserManagementViewProps, 'resource'>;

export function MembersView(props: MembersViewProps = {}) {
  return <UserManagementView resource="clients" {...props} />;
}
