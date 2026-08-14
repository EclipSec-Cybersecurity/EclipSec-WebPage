import express from 'express';
import cors from 'cors';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import Redis from 'ioredis';

/* ─────────────────────────────────────────────────────────────────
 * CTF Flags & Challenge IDs
 * ───────────────────────────────────────────────────────────────── */
const CTF_FLAGS = {
    'web-001': 'EclipSec{h1dd3n_1n_pl41n_s1ght}',
    'web-002': 'EclipSec{r0b0ts_4r3_y0ur_fr13nd5}',
    'web-003': 'EclipSec{c00k13_m0nst3r_m4n1pul4t10n}',
    'web-004': 'EclipSec{p1ng_0f_d34th_cmdi}',
    'web-005': 'EclipSec{l0c4l_f1l3_1nclus10n_m4st3r}',
    'web-006': 'EclipSec{sql1_byp4ss_l0g1n}',
    'web-007': 'EclipSec{1d0r_c4n_b3_d4ng3r0us}',
    'web-008': 'EclipSec{sst1_t3mpl4t3_1nj3ct10n}',
    'web-009': 'EclipSec{b4ckup_f1l3s_4r3_l34ks}',
    'web-010': 'EclipSec{h34d3rs_c4n_b3_sp00f3d}',
    'web-011': 'EclipSec{c0mm4nd_3x3cut10n_v1a_g3t}',
};

const challengeIds = [
    'web-001', 'web-002', 'web-003', 'web-004',
    'web-005', 'web-006', 'web-007', 'web-008',
    'web-009', 'web-010', 'web-011',
];

const flagByChallenge = new Map(Object.entries(CTF_FLAGS));

/* ─────────────────────────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
const PREFIX = 'ctf-academy:v1';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_USERNAME = process.env.CTF_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.CTF_ADMIN_PASSWORD || 'EclipSecAdmin2026!';

/* ─────────────────────────────────────────────────────────────────
 * Redis Connection
 * ───────────────────────────────────────────────────────────────── */
let redis = null;

const getRedis = () => {
    if (redis) return redis;

    const url = process.env.REDIS_URL || process.env.KV_REST_API_REDIS_URL;
    if (!url) {
        throw new Error('Missing REDIS_URL or KV_REST_API_REDIS_URL environment variable.');
    }

    redis = new Redis(url, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
        },
    });

    redis.on('error', (err) => {
        console.error('[Redis Error]:', err.message);
    });

    redis.on('connect', () => {
        console.log('[Redis] Connected successfully.');
    });

    return redis;
};

/* ─────────────────────────────────────────────────────────────────
 * Redis Keys
 * ───────────────────────────────────────────────────────────────── */
const key = {
    users: `${PREFIX}:users`,
    user: (username) => `${PREFIX}:user:${username}`,
    session: (token) => `${PREFIX}:session:${token}`,
    leaderboard: `${PREFIX}:leaderboard`,
};

/* ─────────────────────────────────────────────────────────────────
 * Security & Auth Helpers
 * ───────────────────────────────────────────────────────────────── */
const normalizeUsername = (username) => String(username ?? '').trim().toLowerCase();
const normalizePassword = (password) => String(password ?? '').trim();

const hashPassword = (password, salt) => {
    return createHash('sha256').update(`${salt}:${password}`).digest('hex');
};

const verifyPassword = (password, user) => {
    const expected = Buffer.from(user.passwordHash, 'hex');
    const actual = Buffer.from(hashPassword(password, user.salt), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const safeUser = (user) => {
    if (!user) return null;
    return {
        username: user.username,
        createdAt: user.createdAt,
        startedAt: user.startedAt,
        completedChallengeIds: user.completedChallengeIds || [],
        completionTimes: user.completionTimes || {},
        completedAt: user.completedAt,
    };
};

const readToken = (req) => {
    const header = req.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : null;
};

const createSession = async (sessionData) => {
    const r = getRedis();
    const token = randomBytes(32).toString('hex');
    await r.set(key.session(token), JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS);
    return token;
};

const getSession = async (req) => {
    const token = readToken(req);
    if (!token) return { token: null, session: null };

    const r = getRedis();
    const stored = await r.get(key.session(token));
    return {
        token,
        session: stored ? JSON.parse(stored) : null,
    };
};

const getUser = async (username) => {
    const r = getRedis();
    const stored = await r.get(key.user(username));
    return stored ? JSON.parse(stored) : null;
};

const saveUser = async (user) => {
    const r = getRedis();
    await r.set(key.user(user.username), JSON.stringify(user));
};

const getLeaderboard = async () => {
    const r = getRedis();
    const rows = await r.zrange(key.leaderboard, 0, 9, 'WITHSCORES');
    const entries = [];

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

const getAcademyState = async (session) => {
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

const requireSession = (session, role) => {
    if (!session) return null;
    if (role && session.role !== role) return null;
    return session;
};

/* ─────────────────────────────────────────────────────────────────
 * Express App Setup
 * ───────────────────────────────────────────────────────────────── */
const app = express();

// Enable CORS for Vercel, production domains, and local dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['https://eclipsec.cl', 'https://www.eclipsec.cl', 'http://localhost:5173', 'http://localhost:3000'];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl)
            if (!origin) return callback(null, true);
            // Allow if exact match or if wildcard vercel preview URL
            if (
                allowedOrigins.includes(origin) ||
                origin.endsWith('.vercel.app') ||
                process.env.NODE_ENV !== 'production'
            ) {
                return callback(null, true);
            }
            return callback(null, true); // Permissive default for API clients
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());

/* ─────────────────────────────────────────────────────────────────
 * Health Check Routes
 * ───────────────────────────────────────────────────────────────── */
app.get(['/health', '/api/health'], async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        const r = getRedis();
        await r.ping();
        dbStatus = 'connected';
    } catch {
        dbStatus = 'error_or_unconfigured';
    }

    res.json({
        status: 'ok',
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/* ─────────────────────────────────────────────────────────────────
 * CTF Academy Main Handler
 * ───────────────────────────────────────────────────────────────── */
app.post('/api/ctf-academy', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
        const body = req.body || {};
        const action = String(body.action ?? 'state').toLowerCase();
        const { token, session } = await getSession(req);
        const r = getRedis();

        // 1. STATE
        if (action === 'state') {
            const data = await getAcademyState(session);
            return res.status(200).json({ ok: true, message: 'Estado obtenido.', data });
        }

        // 2. REGISTER
        if (action === 'register') {
            const username = normalizeUsername(body.username);
            const password = normalizePassword(body.password);

            if (!username || username.length < 3 || username.length > 24) {
                return res.status(400).json({
                    ok: false,
                    message: 'El usuario debe tener entre 3 y 24 caracteres.',
                });
            }

            if (!password || password.length < 6) {
                return res.status(400).json({
                    ok: false,
                    message: 'La contraseña debe tener al menos 6 caracteres.',
                });
            }

            if (username === ADMIN_USERNAME.toLowerCase()) {
                return res.status(409).json({ ok: false, message: 'Usuario reservado.' });
            }

            const existing = await getUser(username);
            if (existing) {
                return res.status(409).json({ ok: false, message: 'El usuario ya existe.' });
            }

            const now = Date.now();
            const salt = randomBytes(16).toString('hex');
            const passwordHash = hashPassword(password, salt);

            const newUser = {
                username,
                passwordHash,
                salt,
                createdAt: now,
                startedAt: now,
                completedChallengeIds: [],
                completionTimes: {},
            };

            await saveUser(newUser);
            await r.sadd(key.users, username);

            const nextSession = { username, role: 'player' };
            const nextToken = await createSession(nextSession);

            return res.status(201).json({
                ok: true,
                message: 'Registro exitoso.',
                token: nextToken,
                data: await getAcademyState(nextSession),
            });
        }

        // 3. LOGIN
        if (action === 'login') {
            const username = normalizeUsername(body.username);
            const password = normalizePassword(body.password);

            if (!username || !password) {
                return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos.' });
            }

            // Admin Login
            if (username === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
                const adminSession = { username: ADMIN_USERNAME, role: 'admin' };
                const adminToken = await createSession(adminSession);
                return res.status(200).json({
                    ok: true,
                    message: 'Sesión de administrador iniciada.',
                    token: adminToken,
                    data: await getAcademyState(adminSession),
                });
            }

            // Player Login
            const user = await getUser(username);
            if (!user || !verifyPassword(password, user)) {
                return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
            }

            const nextSession = { username: user.username, role: 'player' };
            const nextToken = await createSession(nextSession);

            return res.status(200).json({
                ok: true,
                message: 'Sesión iniciada.',
                token: nextToken,
                data: await getAcademyState(nextSession),
            });
        }

        // 4. LOGOUT
        if (action === 'logout') {
            if (token) await r.del(key.session(token));
            return res.status(200).json({ ok: true, message: 'Sesión cerrada.' });
        }

        // 5. CLEAR (Admin only)
        if (action === 'clear') {
            if (!requireSession(session, 'admin')) {
                return res.status(403).json({ ok: false, message: 'Credenciales admin requeridas.' });
            }

            const usernames = await r.smembers(key.users);
            if (usernames.length > 0) {
                await Promise.all(usernames.map((u) => r.del(key.user(u))));
            }
            await r.del(key.users);
            await r.del(key.leaderboard);

            return res.status(200).json({
                ok: true,
                message: 'Registro de participantes limpiado.',
                data: await getAcademyState(session),
            });
        }

        // 6. COMPLETE CHALLENGE
        if (action === 'complete') {
            const playerSession = requireSession(session, 'player');
            if (!playerSession) {
                return res.status(403).json({ ok: false, message: 'Debes iniciar sesión.' });
            }

            const challengeId = String(body.challengeId ?? '');
            const submittedFlag = String(body.flag ?? '').trim();
            const challengeIndex = challengeIds.indexOf(challengeId);
            const expectedFlag = flagByChallenge.get(challengeId);

            if (challengeIndex < 0 || !expectedFlag) {
                return res.status(404).json({ ok: false, message: 'Reto no encontrado.' });
            }

            const user = await getUser(playerSession.username);
            if (!user) {
                return res.status(403).json({ ok: false, message: 'Sesión inválida.' });
            }

            user.completedChallengeIds = user.completedChallengeIds || [];
            user.completionTimes = user.completionTimes || {};

            if (user.completedChallengeIds.includes(challengeId)) {
                return res.status(200).json({
                    ok: true,
                    message: 'Reto ya registrado.',
                    data: await getAcademyState(playerSession),
                });
            }

            if (challengeIndex !== user.completedChallengeIds.length) {
                return res.status(409).json({ ok: false, message: 'Debes resolver los niveles en orden.' });
            }

            if (submittedFlag !== expectedFlag) {
                return res.status(401).json({ ok: false, message: 'Flag incorrecta.' });
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

            return res.status(200).json({
                ok: true,
                message: completedAll
                    ? 'Academy completada. Podio actualizado.'
                    : 'Reto completado. Siguiente nivel desbloqueado.',
                data: await getAcademyState(playerSession),
            });
        }

        return res.status(400).json({ ok: false, message: 'Acción inválida.' });
    } catch (error) {
        console.error('[CTF Academy] Error:', error);
        const isDbError =
            error instanceof Error &&
            (error.message.includes('Redis') ||
                error.message.includes('Missing') ||
                error.message.includes('connect') ||
                error.message.includes('ECONNREFUSED'));

        return res.status(500).json({
            ok: false,
            message: isDbError
                ? 'Base de datos no configurada o no disponible.'
                : 'Error interno del servidor.',
        });
    }
});

/* ─────────────────────────────────────────────────────────────────
 * Start Server
 * ───────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`[EclipSec Backend] Server listening on port ${PORT}`);
});
