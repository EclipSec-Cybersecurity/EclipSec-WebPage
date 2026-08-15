import {
  type UserProfile,
  getMe,
  login,
  register,
  logout,
  getStoredUser,
  isLoggedIn
} from '../services/auth';
import { getLeaderboard, type LeaderboardEntry } from '../services/leaderboard';
import { getChallenges, type BackendChallenge, submitFlag } from '../services/challenges';

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'EclipSecAdmin2026!',
} as const;

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
  const match = COUNTRY_LIST.find(c => c.code === upper);
  if (match) return match.flag;

  if (upper.length === 2) {
    try {
      const codePoints = upper
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }
  return '🌐';
};

export interface AcademyState {
  currentUser: UserProfile | null;
  leaderboard: LeaderboardEntry[];
  participants: number;
  challenges: BackendChallenge[];
}

export interface ApiOperationResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

/**
 * Fetch synchronized state from Railway CTF backend
 */
export const getAcademyState = async (): Promise<AcademyState> => {
  let currentUser: UserProfile | null = null;

  if (isLoggedIn()) {
    try {
      currentUser = await getMe();
    } catch {
      // Token might be expired or backend unreachable; try cached user
      currentUser = getStoredUser();
    }
  }

  let leaderboard: LeaderboardEntry[] = [];
  let participants = 0;
  try {
    const lbData = await getLeaderboard(50);
    leaderboard = lbData.leaderboard || [];
    participants = lbData.total_players || leaderboard.length;
  } catch {
    // If backend is not reached yet
    leaderboard = [];
    participants = 0;
  }

  let backendChallenges: BackendChallenge[] = [];
  try {
    backendChallenges = await getChallenges();
  } catch {
    backendChallenges = [];
  }

  return {
    currentUser,
    leaderboard,
    participants,
    challenges: backendChallenges,
  };
};

export const registerAcademyUser = async (data: {
  username: string;
  email: string;
  password: string;
  nationality: string;
}): Promise<ApiOperationResult<UserProfile>> => {
  try {
    const profile = await register(data);
    return {
      ok: true,
      message: 'Registro completado con éxito. Ya puedes iniciar sesión con tu cuenta.',
      data: profile,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error en el registro';
    return { ok: false, message };
  }
};

export const loginAcademyUser = async (credentials: {
  username_or_email: string;
  password: string;
}): Promise<ApiOperationResult<UserProfile>> => {
  try {
    const auth = await login(credentials);
    return {
      ok: true,
      message: `Bienvenido, ${auth.user.username}. Sesión iniciada.`,
      data: auth.user,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
    return { ok: false, message };
  }
};

export const logoutAcademy = async (): Promise<void> => {
  logout();
};

export const completeAcademyChallenge = async (
  slug: string,
  flag: string
): Promise<ApiOperationResult<{ pointsAwarded: number; newTotalScore: number }>> => {
  try {
    const result = await submitFlag(slug, flag);
    if (result.is_correct) {
      return {
        ok: true,
        message: result.message || `¡Flag correcta! +${result.points_awarded} PTS`,
        data: {
          pointsAwarded: result.points_awarded,
          newTotalScore: result.new_total_score,
        },
      };
    }
    return {
      ok: false,
      message: result.message || 'Flag incorrecta. Inténtalo de nuevo.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al enviar flag';
    return { ok: false, message };
  }
};

export const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
