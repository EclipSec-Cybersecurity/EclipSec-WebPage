import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import Redis from 'ioredis';
/* ─────────────────────────────────────────────────────────────────
 * CTF Flags (inlined — Vercel bundles each api/ file independently)
 * ───────────────────────────────────────────────────────────────── */
const CTF_FLAGS: Record<string, string> = {
    'web-001': 'EclipSec{h1dd3n_1n_pl41n_s1ght}',
    'web-002': 'EclipSec{r0b0ts_4r3_y0ur_fr13nd5}',
    'web-003': 'EclipSec{c00k13_m0nst3r_m4n1pul4t10n}',
    'web-009': 'EclipSec{b4ckup_f1l3s_4r3_l34ks}',
    'web-005': 'EclipSec{l0c4l_f1l3_1nclus10n_m4st3r}',
    'web-006': 'EclipSec{sql1_byp4ss_l0g1n}',
    'web-007': 'EclipSec{1d0r_c4n_b3_d4ng3r0us}',
    'web-010': 'EclipSec{h34d3rs_c4n_b3_sp00f3d}',
    'web-008': 'EclipSec{sst1_t3mpl4t3_1nj3ct10n}',
    'web-011': 'EclipSec{c0mm4nd_3x3cut10n_v1a_g3t}',
};

/* ─────────────────────────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────────────────────────── */
const PREFIX = 'ctf-academy:v1';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_USERNAME = process.env.CTF_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.CTF_ADMIN_PASSWORD || 'EclipSecAdmin2026!';

/**
 * Challenge IDs in solve-order.
 * Kept in sync with src/config/challenges.ts — sorted by difficulty.
 * Duplicated here so the serverless function has zero frontend deps.
 */
const challengeIds: string[] = [
    'web-001', 'web-002', 'web-003', 'web-009',            // EASY
    'web-004', 'web-005', 'web-006', 'web-007', 'web-010', // MEDIUM
    'web-008', 'web-011',                                   // HARD
];

/* ─────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────── */
type AcademyRole = 'player' | 'admin';

interface AcademyUser {
    username: string;
    passwordHash: string;
    salt: string;
    createdAt: number;
    startedAt: number;
    completedChallengeIds: string[];
    completionTimes: Record<string, number>;
    completedAt?: number;
}

interface PublicAcademyUser {
    username: string;
    createdAt: number;
    startedAt: number;
    completedChallengeIds: string[];
    completionTimes: Record<string, number>;
    completedAt?: number;
}

interface AcademySession {
    username: string;
    role: AcademyRole;
}

interface LeaderboardEntry {
    username: string;
    completedAt: number;
    durationMs: number;
}

interface VercelRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: Record<string, unknown> | string;
}

interface VercelResponse {
    status: (code: number) => VercelResponse;
    json: (payload: unknown) => void;
    setHeader: (name: string, value: string) => void;
}

/* ─────────────────────────────────────────────────────────────────
 * Redis — ioredis TCP client (battle-tested in serverless)
 *
 * Env var: KV_REST_API_REDIS_URL  (redis://... from Redis Cloud)
 *
 * ioredis handles reconnection, TLS, and URL parsing natively.
 * Connection is lazy — created on first request, reused on warm.
 * ───────────────────────────────────────────────────────────────── */
let redis: Redis | null = null;

const getRedis = (): Redis => {
    if (redis) return redis;

    const url = process.env.KV_REST_API_REDIS_URL;
    if (!url) {
        throw new Error('Missing KV_REST_API_REDIS_URL environment variable.');
    }

    redis = new Redis(url, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 2,
        lazyConnect: true,          // don't connect until first command
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 200, 1000);
        },
    });

    redis.on('error', (err) => {
        console.error('[Redis] error:', err.message);
    });

    return redis;
};

/* ─────────────────────────────────────────────────────────────────
 * Key helpers
 * ───────────────────────────────────────────────────────────────── */
const flagByChallenge = new Map(Object.entries(CTF_FLAGS));

const key = {
    users: `${PREFIX}:users`,
    user: (username: string) => `${PREFIX}:user:${username}`,
    session: (token: string) => `${PREFIX}:session:${token}`,
    leaderboard: `${PREFIX}:leaderboard`,
};

/* ─────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────── */
const json = (response: VercelResponse, status: number, payload: unknown) => {
    response.setHeader('Cache-Control', 'no-store');
    response.status(status).json(payload);
};

const normalizeUsername = (username: unknown) => String(username ?? '').trim().toLowerCase();
const normalizePassword = (password: unknown) => String(password ?? '').trim();

const parseBody = (request: VercelRequest) => {
    if (typeof request.body === 'string') {
        try {
            return JSON.parse(request.body) as Record<string, unknown>;
        } catch {
            return {};
        }
    }

    return request.body ?? {};
};

const readToken = (request: VercelRequest) => {
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : null;
};

const hashPassword = (password: string, salt: string) => {
    return createHash('sha256').update(`${salt}:${password}`).digest('hex');
};

const verifyPassword = (password: string, user: AcademyUser) => {
    const expected = Buffer.from(user.passwordHash, 'hex');
    const actual = Buffer.from(hashPassword(password, user.salt), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const safeUser = (user: AcademyUser | null): PublicAcademyUser | null => {
    if (!user) return null;

    return {
        username: user.username,
        createdAt: user.createdAt,
        startedAt: user.startedAt,
        completedChallengeIds: user.completedChallengeIds,
        completionTimes: user.completionTimes,
        completedAt: user.completedAt,
    };
};

/* ─────────────────────────────────────────────────────────────────
 * Data access — ioredis wrappers
 * ───────────────────────────────────────────────────────────────── */
const getUser = async (username: string): Promise<AcademyUser | null> => {
    const r = getRedis();
    const stored = await r.get(key.user(username));
    return stored ? JSON.parse(stored) as AcademyUser : null;
};

const saveUser = async (user: AcademyUser) => {
    const r = getRedis();
    await r.set(key.user(user.username), JSON.stringify(user));
};

const createSession = async (session: AcademySession) => {
    const r = getRedis();
    const token = randomBytes(32).toString('hex');
    await r.set(key.session(token), JSON.stringify(session), 'EX', SESSION_TTL_SECONDS);
    return token;
};

const getSession = async (request: VercelRequest) => {
    const token = readToken(request);
    if (!token) return { token: null, session: null as AcademySession | null };

    const r = getRedis();
    const stored = await r.get(key.session(token));
    return {
        token,
        session: stored ? JSON.parse(stored) as AcademySession : null,
    };
};

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const r = getRedis();
    // ZRANGE key 0 9 WITHSCORES → [member, score, member, score, ...]
    const rows = await r.zrange(key.leaderboard, 0, 9, 'WITHSCORES');

    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < rows.length; i += 2) {
        const username = rows[i];
        const durationMs = Number(rows[i + 1]);
        const user = await getUser(username);
        if (user?.completedAt) {
            entries.push({ username, durationMs, completedAt: user.completedAt });
        }
    }

    return entries;
};

const getAcademyState = async (session: AcademySession | null) => {
    const r = getRedis();
    const currentUser = session?.role === 'player' ? safeUser(await getUser(session.username)) : null;
    const leaderboard = await getLeaderboard();
    const participants = await r.scard(key.users);

    return {
        session,
        currentUser,
        leaderboard,
        participants,
    };
};

const requireSession = (session: AcademySession | null, role?: AcademyRole) => {
    if (!session || (role && session.role !== role)) {
        return null;
    }

    return session;
};

/* ─────────────────────────────────────────────────────────────────
 * Handler
 * ───────────────────────────────────────────────────────────────── */
export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        json(response, 405, { ok: false, message: 'Method not allowed.' });
        return;
    }

    try {
        const r = getRedis();
        const body = parseBody(request);
        const action = String(body.action ?? '');
        const { token, session } = await getSession(request);

        if (action === 'state') {
            json(response, 200, { ok: true, message: 'Estado cargado.', data: await getAcademyState(session) });
            return;
        }

        if (action === 'register') {
            const username = normalizeUsername(body.username);
            const password = normalizePassword(body.password);

            if (username.length < 3) {
                json(response, 400, { ok: false, message: 'El usuario debe tener al menos 3 caracteres.' });
                return;
            }

            if (password.length < 4) {
                json(response, 400, { ok: false, message: 'La contraseña debe tener al menos 4 caracteres.' });
                return;
            }

            if (username === ADMIN_USERNAME) {
                json(response, 400, { ok: false, message: 'Ese usuario está reservado.' });
                return;
            }

            const now = Date.now();
            const salt = randomBytes(16).toString('hex');
            const user: AcademyUser = {
                username,
                salt,
                passwordHash: hashPassword(password, salt),
                createdAt: now,
                startedAt: now,
                completedChallengeIds: [],
                completionTimes: {},
            };

            // SET NX — only creates if key doesn't exist
            const created = await r.set(key.user(username), JSON.stringify(user), 'NX');
            if (!created) {
                json(response, 409, { ok: false, message: 'Ese usuario ya existe.' });
                return;
            }

            await r.sadd(key.users, username);
            const nextSession = { username, role: 'player' as const };
            const nextToken = await createSession(nextSession);

            json(response, 200, {
                ok: true,
                message: 'Usuario creado. Nivel 1 desbloqueado.',
                token: nextToken,
                data: await getAcademyState(nextSession),
            });
            return;
        }

        if (action === 'login') {
            const username = normalizeUsername(body.username);
            const password = normalizePassword(body.password);

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                const adminSession = { username: ADMIN_USERNAME, role: 'admin' as const };
                const nextToken = await createSession(adminSession);
                json(response, 200, {
                    ok: true,
                    message: 'Admin conectado.',
                    token: nextToken,
                    data: await getAcademyState(adminSession),
                });
                return;
            }

            const user = await getUser(username);
            if (!user || !verifyPassword(password, user)) {
                json(response, 401, { ok: false, message: 'Usuario o contraseña incorrectos.' });
                return;
            }

            const nextSession = { username: user.username, role: 'player' as const };
            const nextToken = await createSession(nextSession);
            json(response, 200, {
                ok: true,
                message: 'Sesión iniciada.',
                token: nextToken,
                data: await getAcademyState(nextSession),
            });
            return;
        }

        if (action === 'logout') {
            if (token) await r.del(key.session(token));
            json(response, 200, { ok: true, message: 'Sesión cerrada.' });
            return;
        }

        if (action === 'clear') {
            if (!requireSession(session, 'admin')) {
                json(response, 403, { ok: false, message: 'Credenciales admin requeridas.' });
                return;
            }

            const usernames = await r.smembers(key.users);
            await Promise.all(usernames.map(u => r.del(key.user(u))));
            await r.del(key.users);
            await r.del(key.leaderboard);
            json(response, 200, {
                ok: true,
                message: 'Registro de participantes limpiado.',
                data: await getAcademyState(session),
            });
            return;
        }

        if (action === 'complete') {
            const playerSession = requireSession(session, 'player');
            if (!playerSession) {
                json(response, 403, { ok: false, message: 'Debes iniciar sesión.' });
                return;
            }

            const challengeId = String(body.challengeId ?? '');
            const submittedFlag = String(body.flag ?? '').trim();
            const challengeIndex = challengeIds.indexOf(challengeId);
            const expectedFlag = flagByChallenge.get(challengeId);

            if (challengeIndex < 0 || !expectedFlag) {
                json(response, 404, { ok: false, message: 'Reto no encontrado.' });
                return;
            }

            const user = await getUser(playerSession.username);
            if (!user) {
                json(response, 403, { ok: false, message: 'Sesión inválida.' });
                return;
            }

            if (user.completedChallengeIds.includes(challengeId)) {
                json(response, 200, {
                    ok: true,
                    message: 'Reto ya registrado.',
                    data: await getAcademyState(playerSession),
                });
                return;
            }

            if (challengeIndex !== user.completedChallengeIds.length) {
                json(response, 409, { ok: false, message: 'Debes resolver los niveles en orden.' });
                return;
            }

            if (submittedFlag !== expectedFlag) {
                json(response, 401, { ok: false, message: 'Flag incorrecta.' });
                return;
            }

            const now = Date.now();
            user.completedChallengeIds = [...user.completedChallengeIds, challengeId];
            user.completionTimes = { ...user.completionTimes, [challengeId]: now };

            const completedAll = user.completedChallengeIds.length === challengeIds.length;
            if (completedAll) {
                user.completedAt = now;
                await r.zadd(key.leaderboard, now - user.startedAt, user.username);
            }

            await saveUser(user);
            json(response, 200, {
                ok: true,
                message: completedAll ? 'Academy completada. Podio actualizado.' : 'Reto completado. Siguiente nivel desbloqueado.',
                data: await getAcademyState(playerSession),
            });
            return;
        }

        json(response, 400, { ok: false, message: 'Acción inválida.' });
    } catch (error) {
        console.error('[CTF Academy] handler error:', error);
        const isDbError = error instanceof Error &&
            (error.message.includes('Redis') || error.message.includes('Missing') ||
             error.message.includes('connect') || error.message.includes('ECONNREFUSED'));

        json(response, 500, {
            ok: false,
            message: isDbError
                ? 'Base de datos no configurada o no disponible.'
                : 'Error interno del servidor.',
        });
    }
}
