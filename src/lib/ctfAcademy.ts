const TOKEN_KEY = 'eclipsec.ctfAcademy.token';

export const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'EclipSecAdmin2026!',
} as const;

export type AcademyRole = 'player' | 'admin';

export interface AcademyUser {
    username: string;
    createdAt: number;
    startedAt: number;
    completedChallengeIds: string[];
    completionTimes: Record<string, number>;
    completedAt?: number;
}

export interface AcademySession {
    username: string;
    role: AcademyRole;
}

export interface AcademyState {
    session: AcademySession | null;
    currentUser: AcademyUser | null;
    leaderboard: LeaderboardEntry[];
    participants: number;
}

export interface LeaderboardEntry {
    username: string;
    completedAt: number;
    durationMs: number;
}

interface ApiResult<T = unknown> {
    ok: boolean;
    message: string;
    data?: T;
}

const getToken = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string | null) => {
    if (typeof window === 'undefined') return;

    if (token) {
        window.localStorage.setItem(TOKEN_KEY, token);
    } else {
        window.localStorage.removeItem(TOKEN_KEY);
    }
};

const apiRequest = async <T,>(action: string, body: Record<string, unknown> = {}): Promise<ApiResult<T>> => {
    const token = getToken();
    const response = await fetch('/api/ctf-academy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, ...body }),
    });

    const payload = await response.json() as ApiResult<T> & { token?: string };
    if (payload.token) setToken(payload.token);
    if (!response.ok) return { ...payload, ok: false };
    return payload;
};

export const getAcademyState = async () => {
    const result = await apiRequest<AcademyState>('state');
    return result.data ?? {
        session: null,
        currentUser: null,
        leaderboard: [],
        participants: 0,
    };
};

export const registerAcademyUser = async (username: string, password: string) => {
    return apiRequest<AcademyState>('register', { username, password });
};

export const loginAcademyUser = async (username: string, password: string) => {
    return apiRequest<AcademyState>('login', { username, password });
};

export const logoutAcademy = async () => {
    await apiRequest('logout');
    setToken(null);
};

export const clearAcademyRegistry = async () => {
    return apiRequest<AcademyState>('clear');
};

export const completeAcademyChallenge = async (challengeId: string, flag: string) => {
    return apiRequest<AcademyState>('complete', { challengeId, flag });
};

export const getNextChallengeIndex = (user: AcademyUser | null) => user?.completedChallengeIds.length ?? 0;

export const getChallengeIndex = (challengeId: string, challengeIds: string[]) => challengeIds.indexOf(challengeId);

export const canAccessChallenge = (user: AcademyUser | null, challengeId: string, challengeIds: string[]) => {
    const challengeIndex = getChallengeIndex(challengeId, challengeIds);
    if (!user || challengeIndex < 0) return false;
    return challengeIndex <= getNextChallengeIndex(user);
};

export const isChallengeCompleted = (user: AcademyUser | null, challengeId: string) => {
    return Boolean(user?.completedChallengeIds.includes(challengeId));
};

export const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};
