import os

AUTH_TS = """
import { ctfAction, setAuthToken, removeAuthData, getAuthToken, type CtfResponse } from '../lib/api';

export interface CtfUser {
  id: string;
  username: string;
  email: string;
  nationality: string;
  score: number;
  role: string;
  solves_count: number;
  last_connected_at: string;
  createdAt?: number;
  startedAt?: number;
  completedChallengeIds?: string[];
  completionTimes?: Record<string, number>;
}

export interface CtfLeaderboardEntry {
  username: string;
  durationMs: number;
  completedAt: number;
  score: number;
  nationality: string;
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
"""

with open('src/services/auth.ts', 'w') as f:
    f.write(AUTH_TS.strip())

