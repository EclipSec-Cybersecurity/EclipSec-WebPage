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
      message: response.statusText || 'Error en la petición',
    }));
    const message = errorBody.message || errorBody.detail || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/** Backend CTF response envelope */
export interface CtfResponse<T = unknown> {
  ok: boolean;
  message: string;
  token?: string;
  data?: T;
}

/**
 * Single-endpoint wrapper for POST /api/ctf-academy.
 * All CTF backend actions go through here.
 */
export async function ctfAction<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<CtfResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const url = baseUrl ? `${baseUrl}/api/ctf-academy` : '/api/ctf-academy';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...payload }),
  });

  // The CTF backend returns JSON even on error (ok: false)
  const json: CtfResponse<T> = await response.json();

  if (!response.ok && !json.ok) {
    throw new Error(json.message || `Error HTTP ${response.status}`);
  }

  return json;
}
