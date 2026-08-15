import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, Globe, Code, Key, Search,
    Server, Bug, ChevronRight, Zap, Skull, AlertTriangle,
    Wifi, WifiOff, LockKeyhole, User, Trophy, LogOut,
    CheckCircle2
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import {
    sortedChallenges as localChallenges,
    type Difficulty, type Category
} from '../config/challenges';
import {
    COUNTRY_LIST,
    getCountryFlag,
    getAcademyState,
    loginAcademyUser,
    registerAcademyUser,
    logoutAcademy,
    type AcademyState,
} from '../lib/ctfAcademy';
import { type UserProfile } from '../services/auth';
import { type LeaderboardEntry, type CountryStat, getCountryStats } from '../services/leaderboard';
import { type BackendChallenge } from '../services/challenges';

const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; border: string; icon: React.ReactNode; label: string }> = {
    EASY: { color: '#00ff41', border: 'rgba(0,255,65,0.3)', icon: <Zap className="w-3 h-3" />, label: 'EASY' },
    MEDIUM: { color: '#ffbb00', border: 'rgba(255,187,0,0.3)', icon: <AlertTriangle className="w-3 h-3" />, label: 'MEDIUM' },
    HARD: { color: '#ff4444', border: 'rgba(255,68,68,0.3)', icon: <Skull className="w-3 h-3" />, label: 'HARD' },
    INSANE: { color: '#cc00ff', border: 'rgba(204,0,255,0.3)', icon: <Skull className="w-3 h-3" />, label: 'INSANE' },
};

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
    WEB: <Globe className="w-4 h-4" />,
    CRYPTO: <Key className="w-4 h-4" />,
    FORENSICS: <Search className="w-4 h-4" />,
    PWN: <Bug className="w-4 h-4" />,
    MISC: <Code className="w-4 h-4" />,
};

const CTFChallenges = () => {
    const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [participants, setParticipants] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
    const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'countries'>('global');
    const [backendChallenges, setBackendChallenges] = useState<BackendChallenge[]>([]);

    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    // Login fields
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    // Register fields
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regNationality, setRegNationality] = useState('CL');

    const [authMessage, setAuthMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [loadingAcademy, setLoadingAcademy] = useState(true);
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const navigateTo = useNavigate();

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        const root = document.getElementById('root');

        const origBodyBg = body.style.backgroundColor;
        const origBodyColor = body.style.color;
        const origHtmlBg = html.style.backgroundColor;
        const origRootBg = root?.style.backgroundColor || '';

        body.style.backgroundColor = '#050505';
        body.style.color = '#00ff41';
        html.style.backgroundColor = '#050505';
        if (root) root.style.backgroundColor = '#050505';

        return () => {
            body.style.backgroundColor = origBodyBg;
            body.style.color = origBodyColor;
            html.style.backgroundColor = origHtmlBg;
            if (root) root.style.backgroundColor = origRootBg;
        };
    }, []);

    const applyAcademyState = (state: AcademyState) => {
        setCurrentUser(state.currentUser);
        setParticipants(state.participants);
        setLeaderboard(state.leaderboard);
        if (state.challenges && state.challenges.length > 0) {
            setBackendChallenges(state.challenges);
        }
    };

    const refreshAcademy = async () => {
        setLoadingAcademy(true);
        try {
            const state = await getAcademyState();
            applyAcademyState(state);
            try {
                const countries = await getCountryStats();
                setCountryStats(countries);
            } catch {
                setCountryStats([]);
            }
        } catch {
            setAuthMessage({ text: 'No se pudo sincronizar con la base de datos de Railway.', isError: true });
        } finally {
            setLoadingAcademy(false);
        }
    };

    useEffect(() => {
        void refreshAcademy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingAuth(true);
        setAuthMessage(null);

        const result = await loginAcademyUser({
            username_or_email: loginIdentifier.trim(),
            password: loginPassword,
        });

        setSubmittingAuth(false);
        setAuthMessage({ text: result.message, isError: !result.ok });

        if (result.ok && result.data) {
            setCurrentUser(result.data);
            setLoginPassword('');
            void refreshAcademy();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingAuth(true);
        setAuthMessage(null);

        const result = await registerAcademyUser({
            username: regUsername.trim(),
            email: regEmail.trim(),
            password: regPassword,
            nationality: regNationality,
        });

        setSubmittingAuth(false);
        setAuthMessage({ text: result.message, isError: !result.ok });

        if (result.ok) {
            // Auto login or switch to login tab with pre-filled identifier
            setLoginIdentifier(regUsername);
            setAuthMode('login');
            setRegPassword('');
        }
    };

    const handleLogout = async () => {
        await logoutAcademy();
        setCurrentUser(null);
        setAuthMessage(null);
        void refreshAcademy();
    };

    const isChallengeSolved = (challengeId: string) => {
        const found = backendChallenges.find(
            bc => bc.slug === challengeId || bc.id === challengeId
        );
        return Boolean(found?.is_solved);
    };

    const filtered = filter === 'ALL'
        ? localChallenges
        : localChallenges.filter(c => c.category === filter);

    const categories: (Category | 'ALL')[] = ['ALL', 'WEB', 'CRYPTO', 'FORENSICS', 'PWN', 'MISC'];
    const solvedCount = currentUser?.solves_count ?? backendChallenges.filter(c => c.is_solved).length;

    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black relative">
            {/* Grid Background */}
            <div className="fixed inset-0 z-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }} />

            {/* Scanlines */}
            <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
                    backgroundSize: '100% 4px'
                }} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/30 pb-4 mb-6 gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_#00ff41]">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tighter">
                                CHALLENGE <span className="text-white">DATABASE</span>
                            </h1>
                            <p className="text-[#00ff41]/60 text-[10px]">
                                {filtered.length} RETOS DISPONIBLES // {filtered.reduce((acc, c) => acc + c.points, 0)} PUNTOS TOTALES
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={NAV_ROUTES.ctf}
                            className="flex items-center gap-2 text-[#00ff41]/60 hover:text-[#00ff41] transition-colors border border-[#00ff41]/20 px-3 py-1 rounded text-xs"
                        >
                            <ArrowLeft className="w-3 h-3" /> VOLVER_AL_CTF
                        </Link>
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#00ff41]/40">
                            <Server className="w-3 h-3" /> NODE: UCN_COQUIMBO // RAILWAY_LIVE
                        </div>
                    </div>
                </motion.div>

                {/* Authentication & Leaderboard Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 mb-6"
                >
                    {/* Left: User session info or Login / Register Form */}
                    <div className="bg-black/60 border border-[#00ff41]/20 rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,65,0.05)]">
                        {loadingAcademy ? (
                            <div className="flex items-center justify-between gap-4 py-3">
                                <p className="text-white text-sm font-bold flex items-center gap-2">
                                    <Server className="w-4 h-4 text-[#00ff41] animate-spin" /> CONECTANDO CON RAILWAY...
                                </p>
                                <span className="text-[#00ff41]/50 text-[10px]">BACKEND_TELEMETRY</span>
                            </div>
                        ) : currentUser ? (
                            /* Authenticated Operator Card */
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#00ff41]/15 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg border border-[#00ff41]/40 bg-[#00ff41]/10 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                                            {getCountryFlag(currentUser.nationality)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-base font-bold flex items-center gap-1.5">
                                                    <User className="w-4 h-4 text-[#00ff41]" /> {currentUser.username}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30">
                                                    {currentUser.role.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-white/50">
                                                    [{currentUser.nationality}]
                                                </span>
                                            </div>
                                            <p className="text-[#00ff41]/60 text-[11px] mt-0.5">
                                                {currentUser.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> SALIR
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                                    <div className="bg-black/40 border border-[#00ff41]/15 rounded-lg p-3">
                                        <span className="text-[10px] text-[#00ff41]/50 uppercase block">Puntuación</span>
                                        <span className="text-lg font-bold text-yellow-400">{currentUser.score} PTS</span>
                                    </div>
                                    <div className="bg-black/40 border border-[#00ff41]/15 rounded-lg p-3">
                                        <span className="text-[10px] text-[#00ff41]/50 uppercase block">Retos Resueltos</span>
                                        <span className="text-lg font-bold text-[#00ff41]">{solvedCount} / {localChallenges.length}</span>
                                    </div>
                                    <div className="bg-black/40 border border-[#00ff41]/15 rounded-lg p-3 col-span-2 sm:col-span-1">
                                        <span className="text-[10px] text-[#00ff41]/50 uppercase block">Telemetría En Vivo</span>
                                        <span className="text-[11px] text-white/70 truncate block">
                                            {new Date(currentUser.last_connected_at || Date.now()).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Login / Register Forms */
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00ff41]/15 pb-3">
                                    <div>
                                        <p className="text-white text-sm font-bold flex items-center gap-2">
                                            <LockKeyhole className="w-4 h-4 text-[#00ff41]" /> ACCESO OPERADORES CTF
                                        </p>
                                        <p className="text-[#00ff41]/50 text-[10px] mt-0.5">
                                            {authMode === 'login' ? 'Inicia sesión para enviar flags y registrar tu puntaje' : 'Crea tu usuario con bandera para el ranking internacional'}
                                        </p>
                                    </div>
                                    <div className="flex bg-black/80 border border-[#00ff41]/30 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode('login');
                                                setAuthMessage(null);
                                            }}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${authMode === 'login'
                                                ? 'bg-[#00ff41] text-black shadow-[0_0_10px_#00ff41]'
                                                : 'text-[#00ff41]/60 hover:text-[#00ff41]'
                                                }`}
                                        >
                                            INGRESAR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode('register');
                                                setAuthMessage(null);
                                            }}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${authMode === 'register'
                                                ? 'bg-[#00ff41] text-black shadow-[0_0_10px_#00ff41]'
                                                : 'text-[#00ff41]/60 hover:text-[#00ff41]'
                                                }`}
                                        >
                                            REGISTRO
                                        </button>
                                    </div>
                                </div>

                                {authMode === 'login' ? (
                                    <form onSubmit={handleLogin} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">USUARIO O EMAIL</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={loginIdentifier}
                                                        onChange={e => setLoginIdentifier(e.target.value)}
                                                        placeholder="admin o usuario@ejemplo.com"
                                                        required
                                                        className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white placeholder:text-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">CONTRASEÑA</label>
                                                <input
                                                    type="password"
                                                    value={loginPassword}
                                                    onChange={e => setLoginPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white placeholder:text-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="submit"
                                                disabled={submittingAuth}
                                                className="px-5 py-2 rounded bg-[#00ff41] text-black text-xs font-bold hover:bg-[#00ff41]/90 shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all disabled:opacity-50"
                                            >
                                                {submittingAuth ? 'VERIFICANDO...' : 'ENTRAR AL SISTEMA'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">USUARIO</label>
                                                <input
                                                    type="text"
                                                    value={regUsername}
                                                    onChange={e => setRegUsername(e.target.value)}
                                                    placeholder="hacker_ucn"
                                                    required
                                                    className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white placeholder:text-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">CORREO ELECTRÓNICO</label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={regEmail}
                                                        onChange={e => setRegEmail(e.target.value)}
                                                        placeholder="hacker@ucn.cl"
                                                        required
                                                        className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white placeholder:text-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">CONTRASEÑA</label>
                                                <input
                                                    type="password"
                                                    value={regPassword}
                                                    onChange={e => setRegPassword(e.target.value)}
                                                    placeholder="Mínimo 6 caracteres"
                                                    required
                                                    className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white placeholder:text-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#00ff41]/70 block mb-1">NACIONALIDAD / BANDERA</label>
                                                <select
                                                    value={regNationality}
                                                    onChange={e => setRegNationality(e.target.value)}
                                                    className="w-full bg-black border border-[#00ff41]/30 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                                                >
                                                    {COUNTRY_LIST.map(country => (
                                                        <option key={country.code} value={country.code} className="bg-black text-white">
                                                            {country.flag} {country.name} ({country.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="submit"
                                                disabled={submittingAuth}
                                                className="px-5 py-2 rounded bg-[#00ff41] text-black text-xs font-bold hover:bg-[#00ff41]/90 shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all disabled:opacity-50"
                                            >
                                                {submittingAuth ? 'CREANDO CUENTA...' : 'CREAR CUENTA CTF'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {authMessage && (
                                    <div className={`text-xs rounded p-2.5 border ${authMessage.isError
                                        ? 'text-red-300 border-red-500/30 bg-red-500/10'
                                        : 'text-green-300 border-[#00ff41]/40 bg-[#00ff41]/10'
                                        }`}>
                                        {authMessage.text}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Real-time Leaderboard & Country Ranking */}
                    <div className="bg-black/60 border border-[#00ff41]/20 rounded-xl p-4 shadow-[0_0_20px_rgba(0,255,65,0.05)] flex flex-col">
                        <div className="flex items-center justify-between border-b border-[#00ff41]/15 pb-2 mb-3">
                            <h2 className="text-white text-xs font-bold flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-400" /> LEADERBOARD
                            </h2>
                            <div className="flex gap-1 text-[10px]">
                                <button
                                    onClick={() => setLeaderboardTab('global')}
                                    className={`px-2 py-0.5 rounded border transition-colors ${leaderboardTab === 'global'
                                        ? 'bg-[#00ff41]/20 border-[#00ff41] text-[#00ff41]'
                                        : 'border-transparent text-[#00ff41]/40 hover:text-[#00ff41]'
                                        }`}
                                >
                                    GLOBAL
                                </button>
                                <button
                                    onClick={() => setLeaderboardTab('countries')}
                                    className={`px-2 py-0.5 rounded border transition-colors ${leaderboardTab === 'countries'
                                        ? 'bg-[#00ff41]/20 border-[#00ff41] text-[#00ff41]'
                                        : 'border-transparent text-[#00ff41]/40 hover:text-[#00ff41]'
                                        }`}
                                >
                                    PAÍSES
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 pr-1">
                            {leaderboardTab === 'global' ? (
                                leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => (
                                        <div
                                            key={entry.user_id || entry.username}
                                            className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${currentUser?.username === entry.username
                                                ? 'border-[#00ff41]/50 bg-[#00ff41]/10 text-white'
                                                : 'border-[#00ff41]/10 bg-black/40 text-[#00ff41]/80'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className={`font-mono font-bold text-[10px] w-4 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-[#00ff41]/50'}`}>
                                                    #{entry.rank || index + 1}
                                                </span>
                                                <span>{getCountryFlag(entry.nationality)}</span>
                                                <span className="font-bold truncate">{entry.username}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] text-[#00ff41]/50">{entry.solves_count} solves</span>
                                                <span className="font-bold text-yellow-400 text-xs">{entry.score} pts</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[#00ff41]/40 text-xs py-4 text-center">
                                        Aún no hay puntuaciones registradas en el ranking.
                                    </p>
                                )
                            ) : (
                                countryStats.length > 0 ? (
                                    countryStats.map((cStat, index) => (
                                        <div
                                            key={cStat.nationality}
                                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded border border-[#00ff41]/10 bg-black/40"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-[10px] text-[#00ff41]/50">#{index + 1}</span>
                                                <span className="text-base">{getCountryFlag(cStat.nationality)}</span>
                                                <span className="font-bold text-white">{cStat.nationality}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] text-[#00ff41]/50">{cStat.total_players} players</span>
                                                <span className="font-bold text-yellow-400 text-xs">{cStat.total_score} pts</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[#00ff41]/40 text-xs py-4 text-center">
                                        No hay estadísticas de países disponibles.
                                    </p>
                                )
                            )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#00ff41]/10 flex justify-between text-[10px] text-[#00ff41]/40">
                            <span>TOTAL JUGADORES: {participants}</span>
                            <span className="text-[#00ff41]/70">RAILWAY MOTOR // LIVE</span>
                        </div>
                    </div>
                </motion.div>

                {/* Category Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 mb-6"
                >
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1 rounded text-xs border transition-all ${filter === cat
                                ? 'bg-[#00ff41]/20 border-[#00ff41]/60 text-[#00ff41]'
                                : 'bg-transparent border-[#00ff41]/15 text-[#00ff41]/50 hover:border-[#00ff41]/40 hover:text-[#00ff41]/80'
                                }`}
                        >
                            <span className="flex items-center gap-1.5">
                                {cat !== 'ALL' && CATEGORY_ICONS[cat]}
                                {cat}
                            </span>
                        </button>
                    ))}
                </motion.div>

                {/* Difficulty Legend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-4 mb-6 text-[10px]"
                >
                    {(['EASY', 'MEDIUM', 'HARD', 'INSANE'] as Difficulty[]).map(d => (
                        <span key={d} className="flex items-center gap-1.5" style={{ color: DIFFICULTY_CONFIG[d].color }}>
                            {DIFFICULTY_CONFIG[d].icon} {d}
                        </span>
                    ))}
                </motion.div>

                {/* Challenge List */}
                <div className="space-y-2">
                    {filtered.map((challenge, index) => {
                        const diff = DIFFICULTY_CONFIG[challenge.difficulty];
                        const isExpanded = expandedId === challenge.id;
                        const solved = isChallengeSolved(challenge.id);

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + index * 0.02 }}
                                onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                                className="border rounded-lg cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.08)]"
                                style={{
                                    borderColor: solved ? 'rgba(0,255,65,0.5)' : isExpanded ? diff.border : 'rgba(0,255,65,0.15)',
                                    backgroundColor: isExpanded ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
                                }}
                            >
                                {/* Challenge Header Row */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                    {/* Difficulty Badge */}
                                    <div
                                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shrink-0"
                                        style={{
                                            color: diff.color,
                                            borderColor: diff.border,
                                            backgroundColor: `${diff.color}10`,
                                        }}
                                    >
                                        {diff.icon}
                                        {diff.label}
                                    </div>

                                    {/* Category */}
                                    <div className="flex items-center gap-1 text-[#00ff41]/50 text-[10px] shrink-0">
                                        {CATEGORY_ICONS[challenge.category]}
                                        {challenge.category}
                                    </div>

                                    {/* Title */}
                                    <span className="text-white text-sm font-bold flex-1 truncate">
                                        {challenge.title}
                                    </span>

                                    {/* Points */}
                                    <span className="text-xs font-bold shrink-0" style={{ color: diff.color }}>
                                        {challenge.points} PTS
                                    </span>

                                    {/* Solves */}
                                    <span className="text-[10px] text-[#00ff41]/40 shrink-0 hidden sm:block">
                                        {challenge.solves} solves
                                    </span>

                                    <span className={`text-[10px] shrink-0 hidden md:flex items-center gap-1 ${solved ? 'text-[#00ff41]' : 'text-yellow-300'}`}>
                                        {solved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                                        {solved ? 'COMPLETADO' : 'DISPONIBLE'}
                                    </span>

                                    {/* Expand Arrow */}
                                    <ChevronRight
                                        className={`w-4 h-4 text-[#00ff41]/30 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                    />
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 pb-4 border-t"
                                        style={{ borderColor: 'rgba(0,255,65,0.1)' }}
                                    >
                                        <div className="pt-3 space-y-3">
                                            <p className="text-[#00ff41]/80 text-xs leading-relaxed">
                                                {challenge.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#00ff41]/40">
                                                <span>AUTOR: {challenge.author}</span>
                                                <span>SLUG: {challenge.id.toUpperCase()}</span>
                                                <span>{challenge.solves} OPERADORES RESOLVIERON ESTE RETO</span>
                                            </div>
                                            <button
                                                disabled={!challenge.active}
                                                className="mt-1 px-4 py-2 rounded text-xs font-bold border transition-all hover:shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                                                style={{
                                                    borderColor: diff.color,
                                                    color: challenge.active ? '#050505' : '#ff9999',
                                                    backgroundColor: challenge.active ? diff.color : 'rgba(255,68,68,0.08)',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateTo(`/ctf/challenge/${challenge.id}`);
                                                }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {solved ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5" /> RETO RESUELTO (VOLVER A ABRIR)</>
                                                    ) : challenge.active ? (
                                                        <><Wifi className="w-3.5 h-3.5" /> ACCEDER AL LABORATORIO</>
                                                    ) : (
                                                        <><WifiOff className="w-3.5 h-3.5" /> FUERA DE LÍNEA</>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-10 pt-4 border-t border-[#00ff41]/10 flex flex-wrap justify-between items-center text-[9px] text-[#00ff41]/40 uppercase tracking-[0.15em]">
                    <span>© {new Date().getFullYear()} ECLIPSEC // UCN HACKING ACADEMY CTF</span>
                    <span className="text-[#00ff41]">COQUIMBO_CHILE</span>
                </div>
            </div>
        </div>
    );
};

export default CTFChallenges;
