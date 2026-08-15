import {
  login,
  register,
  logout,
  getState,
  getStoredUser,
  isLoggedIn,
  type CtfUser,
  type CtfLeaderboardEntry,
  type CtfAcademyData,
} from '../services/auth';
import type { CtfResponse } from '../lib/api';

export type { CtfUser, CtfLeaderboardEntry, CtfAcademyData };

// ─── Country helpers (UI only) ────────────────────────────────────────────────

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRY_LIST: CountryInfo[] = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'OTHER', name: 'Internacional', flag: '🌐' },
];

export const getCountryFlag = (code?: string): string => {
  if (!code) return '🇨🇱';
  const upper = code.toUpperCase();
  const match = COUNTRY_LIST.find((c) => c.code === upper);
  if (match) return match.flag;

  if (upper.length === 2) {
    try {
      const codePoints = upper.split('').map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }
  return '🌐';
};

// ─── Operation result wrapper ─────────────────────────────────────────────────

export interface ApiOperationResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

// ─── Academy actions ──────────────────────────────────────────────────────────

export const getAcademyState = async (): Promise<CtfAcademyData> => {
  if (!isLoggedIn()) {
    return { session: null, currentUser: null, leaderboard: [], participants: 0 };
  }

  try {
    return await getState();
  } catch {
    // Backend unreachable — return cached user if available
    const cached = getStoredUser();
    return {
      session: cached ? { username: cached.username, role: 'player' } : null,
      currentUser: cached,
      leaderboard: [],
      participants: 0,
    };
  }
};

export const loginAcademyUser = async (credentials: {
  username: string;
  password: string;
}): Promise<ApiOperationResult<CtfAcademyData>> => {
  try {
    const result: CtfResponse<CtfAcademyData> = await login(credentials);
    return {
      ok: true,
      message: result.message || `Bienvenido, ${credentials.username}. Sesión iniciada.`,
      data: result.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
    return { ok: false, message };
  }
};

export const registerAcademyUser = async (credentials: {
  username: string;
  password: string;
}): Promise<ApiOperationResult<CtfAcademyData>> => {
  try {
    const result: CtfResponse<CtfAcademyData> = await register(credentials);
    return {
      ok: true,
      message: result.message || 'Registro exitoso. Bienvenido al CTF.',
      data: result.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error en el registro';
    return { ok: false, message };
  }
};

export const logoutAcademy = async (): Promise<void> => {
  await logout();
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatDate = (timestampMs: number): string => {
  return new Date(timestampMs).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
