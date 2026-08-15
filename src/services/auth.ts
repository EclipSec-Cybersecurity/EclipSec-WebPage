import { apiRequest, setAuthToken, removeAuthData, getAuthToken } from '../lib/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  nationality: string; // e.g. "CL", "AR", "PE", "US"
  role: 'user' | 'admin';
  score: number;
  created_at: string;        // Account creation ISO date
  last_connected_at: string; // Live telemetry updated on every request
  is_active: boolean;
  solves_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

const USER_STORAGE_KEY = 'eclipsec_user';

/**
 * Register a new CTF operator
 */
export async function register(data: {
  username: string;
  email: string;
  password: string;
  nationality: string;
}): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log in an existing CTF operator using username or email
 */
export async function login(credentials: {
  username_or_email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (data.access_token) {
    setAuthToken(data.access_token);
    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    }
  }

  return data;
}

/**
 * Fetch current authenticated user profile and refresh live telemetry (last_connected_at)
 */
export async function getMe(): Promise<UserProfile> {
  const user = await apiRequest<UserProfile>('/api/v1/auth/me');
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

/**
 * Log out and clear all stored credentials and user telemetry
 */
export function logout(): void {
  removeAuthData();
}

/**
 * Retrieve cached user profile from local storage if available
 */
export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Check if a token is present in storage
 */
export function isLoggedIn(): boolean {
  return Boolean(getAuthToken());
}
