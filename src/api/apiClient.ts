import { ApiClientError, apiFetch, endpoint, extractErrorMessage, parseJsonResponse, unwrapApiPayload, type ApiEnvelope } from './apiCore';
export { ApiClientError } from './apiCore';

export async function apiClient<T>(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await apiFetch(endpoint(path), options);
  } catch {
    throw new ApiClientError('Nu se poate conecta la API. Verifica daca serverul Laravel ruleaza.', 0);
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const envelope = payload as ApiEnvelope<unknown> | null;
    throw new ApiClientError(extractErrorMessage(payload, `Cererea a esuat (${response.status}).`), response.status, envelope?.errors);
  }

  return unwrapApiPayload<T>(payload as T | ApiEnvelope<T>);
}
