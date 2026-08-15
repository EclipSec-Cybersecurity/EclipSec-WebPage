import { SITE_CONFIG } from '../config/site';

const TOKEN_KEY = 'eclipsec_token';
const USER_KEY = 'eclipsec_user';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const removeAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function getApiBaseUrl(): string {
  // Check configured API URL or standard environment variables
  const envUrl =
    SITE_CONFIG.apiUrl ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL
      : '') ||
    '';

  return envUrl.replace(/\/+$/, '');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = baseUrl ? `${baseUrl}${formattedEndpoint}` : formattedEndpoint;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      detail: response.statusText || 'Error en la petición',
    }));
    const message = errorBody.detail || errorBody.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
