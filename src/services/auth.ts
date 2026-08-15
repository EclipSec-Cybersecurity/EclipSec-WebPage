import { ctfAction, setAuthToken, removeAuthData, getAuthToken, type CtfResponse } from '../lib/api';

// ─── Types that match the actual server.js response ─────────────────────────

export interface CtfUser {
  username: string;
  createdAt: number;        // Unix ms timestamp
  startedAt: number;        // Unix ms timestamp (when competition started)
  completedChallengeIds: string[];
  completionTimes: Record<string, number>;
  completedAt?: number;     // Unix ms timestamp, only set when all challenges done
}

export interface CtfLeaderboardEntry {
  username: string;
  durationMs: number;
  completedAt: number;
}

export interface CtfAcademyData {
  session: { username: string; role: 'player' | 'admin' } | null;
  currentUser: CtfUser | null;
  leaderboard: CtfLeaderboardEntry[];
  participants: number;
}

const USER_STORAGE_KEY = 'eclipsec_ctf_user';

// ─── Storage helpers ─────────────────────────────────────────────────────────

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

// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Login an existing user.
 * On success, persists the bearer token and user data locally.
 */
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

/**
 * Register a new user.
 * On success, the backend creates the account and automatically logs them in.
 */
export async function register(credentials: {
  username: string;
  password: string;
}): Promise<CtfResponse<CtfAcademyData>> {
  const result = await ctfAction<CtfAcademyData>('register', {
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

/**
 * Log out the current session.
 * Clears the token from the backend and removes local storage.
 */
export async function logout(): Promise<void> {
  try {
    await ctfAction('logout');
  } catch {
    // Even if the backend call fails, clear local state
  } finally {
    removeAuthData();
    storeUser(null);
  }
}

/**
 * Fetch the current academy state (session, user, leaderboard, participants).
 */
export async function getState(): Promise<CtfAcademyData> {
  const result = await ctfAction<CtfAcademyData>('state');
  if (result.data?.currentUser) {
    storeUser(result.data.currentUser);
  }
  return result.data ?? { session: null, currentUser: null, leaderboard: [], participants: 0 };
}
