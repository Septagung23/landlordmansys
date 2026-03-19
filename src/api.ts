const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type ApiFetchOptions = RequestInit & {
  token?: string | null;
};

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { token, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers ?? {});
  console.log(apiBaseUrl)
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const isJsonBody =
    rest.body !== undefined &&
    typeof rest.body === 'string' &&
    !mergedHeaders.has('Content-Type');

  if (isJsonBody) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: mergedHeaders
  });
}
