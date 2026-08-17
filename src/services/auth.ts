import { ctfAction, apiRequest, setAuthToken, removeAuthData, getAuthToken, type CtfResponse } from '../lib/api';

export interface CtfUser {
  id: string;
  username: string;
  email?: string;
  nationality: string;
  score: number;
  role: 'admin' | 'user' | string;
  rankName?: string;
  globalRank?: number | string | null;
  global_rank?: number | string | null;
  solvesCount?: number;
  solves_count?: number;
  last_connected_at?: string;
  createdAt?: number | string;
  created_at?: number | string;
  startedAt?: number;
  completedChallengeIds?: string[];
  completionTimes?: Record<string, number>;
  description?: string;
}

export interface RecentSolve {
  challenge_id?: string;
  challenge_title: string;
  category: string;
  points: number;
  solved_at: string | number;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  points: number;
}

export interface UserProfileResponse {
  username: string;
  role: string;
  nationality: string;
  score: number;
  rankName: string;
  globalRank: number | string | null;
  global_rank?: number | string | null;
  solvesCount: number;
  createdAt?: string | number;
  created_at?: string | number;
  description?: string;
  categoryBreakdown?: Record<string, { count: number; points: number }> | CategoryBreakdownItem[];
  recentSolves?: RecentSolve[];
}

export interface CtfLeaderboardEntry {
  username: string;
  durationMs?: number;
  completedAt?: number;
  score: number;
  nationality: string;
  rankName?: string;
  role?: string;
}

export interface CtfAcademyData {
  session: { username: string; role: string } | null;
  currentUser: CtfUser | null;
  leaderboard: CtfLeaderboardEntry[];
  participants: number;
  challenges: any[];
}

const USER_STORAGE_KEY = 'eclipsec_ctf_user';

export function getStoredUser(): CtfUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CtfUser;
  } catch {
    return null;
  }
}

function storeUser(user: CtfUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getAuthToken());
}

export async function login(credentials: {
  username: string;
  password: string;
}): Promise<CtfResponse<CtfAcademyData>> {
  const result = await ctfAction<CtfAcademyData>('login', {
    username: credentials.username,
    password: credentials.password,
  });

  if (result.token) {
    setAuthToken(result.token);
  }
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }

  return result;
}

export async function register(credentials: {
  username: string;
  email?: string;
  nationality?: string;
  password: string;
}): Promise<CtfResponse<CtfAcademyData>> {
  const result = await ctfAction<CtfAcademyData>('register', credentials);

  if (result.token) {
    setAuthToken(result.token);
  }
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }

  return result;
}

export async function logout(): Promise<void> {
  try {
    await ctfAction('logout');
  } catch {}
  finally {
    removeAuthData();
    storeUser(null);
  }
}

export async function getState(): Promise<CtfAcademyData> {
  const result = await ctfAction<CtfAcademyData>('state');
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }
  return result.data ?? { session: null, currentUser: null, leaderboard: [], participants: 0, challenges: [] };
}
export async function updateProfile(description: string): Promise<CtfResponse<CtfAcademyData>> {
  const result = await ctfAction<CtfAcademyData>('update_profile', { description });
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }
  return result;
}

export async function generateAdminToken(): Promise<CtfResponse<{token: string}>> {
  return await ctfAction<{token: string}>('generate_admin_token');
}

export async function redeemAdminToken(token: string): Promise<CtfResponse<CtfAcademyData>> {
  const result = await ctfAction<CtfAcademyData>('redeem_admin_token', { token });
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }
  return result;
}

/**
 * Fetch detailed user profile info, category breakdown, and recent solves.
 * GET /api/v1/users/{username}/profile
 */
export async function getUserProfile(username: string): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(`/api/v1/users/${encodeURIComponent(username)}/profile`);
}

