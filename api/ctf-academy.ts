import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { sortedChallenges } from '../src/config/challenges';
import { CTF_FLAGS } from './ctf-flags';

const PREFIX = 'ctf-academy:v1';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_USERNAME = process.env.CTF_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.CTF_ADMIN_PASSWORD || 'EclipSecAdmin2026!';

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

const challengeIds = sortedChallenges.map(challenge => challenge.id);
const flagByChallenge = new Map(Object.entries(CTF_FLAGS));

const key = {
    users: `${PREFIX}:users`,
    user: (username: string) => `${PREFIX}:user:${username}`,
    session: (token: string) => `${PREFIX}:session:${token}`,
    leaderboard: `${PREFIX}:leaderboard`,
};

const json = (response: VercelResponse, status: number, payload: unknown) => {
    response.setHeader('Cache-Control', 'no-store');
    response.status(status).json(payload);
};

const normalizeUsername = (username: unknown) => String(username ?? '').trim().toLowerCase();
const normalizePassword = (password: unknown) => String(password ?? '').trim();

const getRedisConfig = () => {
    const url =
        process.env.CTF_REDIS_URL ||
        process.env.REDIS_URL ||
        process.env.CTF_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        process.env.UPSTASH_REDIS_REST_URL;
    const token =
        process.env.CTF_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url) {
        throw new Error('Missing Redis URL environment variable.');
    }

    const cleanUrl = url.replace(/\/$/, '');
    const isTcpRedis = cleanUrl.startsWith('redis://') || cleanUrl.startsWith('rediss://');

    if (!isTcpRedis && !token) {
        throw new Error('Missing Redis REST token. REST URLs require a token; redis:// URLs include auth in the URL.');
    }

    return { url: cleanUrl, token, isTcpRedis };
};

let redisClientPromise: Promise<RedisClientType> | null = null;

const getRedisClient = async () => {
    const { url } = getRedisConfig();

    if (!redisClientPromise) {
        const client = createClient({
            url,
            socket: {
                reconnectStrategy: retries => Math.min(retries * 50, 500),
            },
        });

        client.on('error', error => {
            console.error('Redis client error:', error);
        });

        redisClientPromise = client.connect().then(() => client as RedisClientType);
    }

    return redisClientPromise;
};

const redis = async <T = unknown>(command: string, ...args: Array<string | number>) => {
    const { url, token, isTcpRedis } = getRedisConfig();

    if (isTcpRedis) {
        const client = await getRedisClient();
        return await client.sendCommand([command, ...args.map(String)]) as T;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) {
        throw new Error(`Redis command failed: ${command}`);
    }

    const payload = await response.json() as { result: T };
    return payload.result;
};

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

const getUser = async (username: string) => {
    const stored = await redis<string | null>('get', key.user(username));
    return stored ? JSON.parse(stored) as AcademyUser : null;
};

const saveUser = async (user: AcademyUser) => {
    await redis('set', key.user(user.username), JSON.stringify(user));
};

const createSession = async (session: AcademySession) => {
    const token = randomBytes(32).toString('hex');
    await redis('set', key.session(token), JSON.stringify(session), 'EX', SESSION_TTL_SECONDS);
    return token;
};

const getSession = async (request: VercelRequest) => {
    const token = readToken(request);
    if (!token) return { token: null, session: null as AcademySession | null };

    const stored = await redis<string | null>('get', key.session(token));
    return {
        token,
        session: stored ? JSON.parse(stored) as AcademySession : null,
    };
};

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const rows = await redis<string[]>('zrange', key.leaderboard, 0, 9, 'WITHSCORES');
    const entries: LeaderboardEntry[] = [];

    for (let index = 0; index < rows.length; index += 2) {
        const username = rows[index];
        const durationMs = Number(rows[index + 1]);
        const user = await getUser(username);
        if (user?.completedAt) {
            entries.push({ username, durationMs, completedAt: user.completedAt });
        }
    }

    return entries;
};

const getAcademyState = async (session: AcademySession | null) => {
    const currentUser = session?.role === 'player' ? safeUser(await getUser(session.username)) : null;
    const leaderboard = await getLeaderboard();
    const participants = await redis<number>('scard', key.users);

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

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method !== 'POST') {
        json(response, 405, { ok: false, message: 'Method not allowed.' });
        return;
    }

    try {
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

            const created = await redis<string | null>('set', key.user(username), JSON.stringify(user), 'NX');
            if (created !== 'OK') {
                json(response, 409, { ok: false, message: 'Ese usuario ya existe.' });
                return;
            }

            await redis('sadd', key.users, username);
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
            if (token) await redis('del', key.session(token));
            json(response, 200, { ok: true, message: 'Sesión cerrada.' });
            return;
        }

        if (action === 'clear') {
            if (!requireSession(session, 'admin')) {
                json(response, 403, { ok: false, message: 'Credenciales admin requeridas.' });
                return;
            }

            const usernames = await redis<string[]>('smembers', key.users);
            await Promise.all(usernames.map(username => redis('del', key.user(username))));
            await redis('del', key.users);
            await redis('del', key.leaderboard);
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
                await redis('zadd', key.leaderboard, now - user.startedAt, user.username);
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
        const message = error instanceof Error && error.message.includes('Redis')
            ? 'Base de datos no configurada o no disponible.'
            : 'Error interno del servidor.';

        json(response, 500, { ok: false, message });
    }
}
