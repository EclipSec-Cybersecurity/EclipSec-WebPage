import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { CTF_FLAGS } from './ctf-flags';

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
 * Redis — TCP client via `redis` package
 *
 * Uses a single env var:
 *   KV_REST_API_REDIS_URL  (redis://... from Redis Cloud)
 *
 * The client is created once and reused across warm invocations.
 * ───────────────────────────────────────────────────────────────── */
const getRedisUrl = () => {
    const url = process.env.KV_REST_API_REDIS_URL;
    if (!url) {
        throw new Error('Missing KV_REST_API_REDIS_URL environment variable.');
    }
    return url;
};

let clientPromise: Promise<RedisClientType> | null = null;

const getRedis = async (): Promise<RedisClientType> => {
    if (!clientPromise) {
        const url = getRedisUrl();
        const client = createClient({
            url,
            socket: {
                connectTimeout: 10_000,
                reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
            },
        });

        client.on('error', (err) => {
            console.error('[Redis] client error:', err.message);
        });

        clientPromise = client.connect().then(() => client as RedisClientType);
    }

    return clientPromise;
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
 * Data access — typed wrappers around the redis TCP client
 * ───────────────────────────────────────────────────────────────── */
const getUser = async (username: string): Promise<AcademyUser | null> => {
    const redis = await getRedis();
    const stored = await redis.get(key.user(username));
    return stored ? JSON.parse(stored as string) as AcademyUser : null;
};

const saveUser = async (user: AcademyUser) => {
    const redis = await getRedis();
    await redis.set(key.user(user.username), JSON.stringify(user));
};

const createSession = async (session: AcademySession) => {
    const redis = await getRedis();
    const token = randomBytes(32).toString('hex');
    await redis.set(key.session(token), JSON.stringify(session), { EX: SESSION_TTL_SECONDS });
    return token;
};

const getSession = async (request: VercelRequest) => {
    const token = readToken(request);
    if (!token) return { token: null, session: null as AcademySession | null };

    const redis = await getRedis();
    const stored = await redis.get(key.session(token));
    return {
        token,
        session: stored ? JSON.parse(stored as string) as AcademySession : null,
    };
};

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const redis = await getRedis();
    // zRange without BY defaults to rank-based range
    const rows = await redis.zRange(key.leaderboard, 0, 9);

    const entries: LeaderboardEntry[] = [];

    // zRange returns string[] of member names; fetch scores individually
    for (const username of rows) {
        const score = await redis.zScore(key.leaderboard, username);
        const user = await getUser(username);
        if (user?.completedAt && score !== null && score !== undefined) {
            entries.push({ username, durationMs: Number(score), completedAt: user.completedAt });
        }
    }

    return entries;
};

const getAcademyState = async (session: AcademySession | null) => {
    const redis = await getRedis();
    const currentUser = session?.role === 'player' ? safeUser(await getUser(session.username)) : null;
    const leaderboard = await getLeaderboard();
    const participants = await redis.sCard(key.users);

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
        const redis = await getRedis();
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

            // SET with NX — only creates if key doesn't exist
            const created = await redis.set(key.user(username), JSON.stringify(user), { NX: true });
            if (!created) {
                json(response, 409, { ok: false, message: 'Ese usuario ya existe.' });
                return;
            }

            await redis.sAdd(key.users, username);
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
            if (token) await redis.del(key.session(token));
            json(response, 200, { ok: true, message: 'Sesión cerrada.' });
            return;
        }

        if (action === 'clear') {
            if (!requireSession(session, 'admin')) {
                json(response, 403, { ok: false, message: 'Credenciales admin requeridas.' });
                return;
            }

            const usernames = await redis.sMembers(key.users);
            await Promise.all(usernames.map(username => redis.del(key.user(username))));
            await redis.del(key.users);
            await redis.del(key.leaderboard);
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
                await redis.zAdd(key.leaderboard, { score: now - user.startedAt, value: user.username });
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
        console.error('[CTF Academy] error:', error);
        const message = error instanceof Error && (error.message.includes('Redis') || error.message.includes('Missing') || error.message.includes('connect'))
            ? 'Base de datos no configurada o no disponible.'
            : 'Error interno del servidor.';

        json(response, 500, { ok: false, message });
    }
}
