import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Terminal,
    Trophy,
    Clock,
    Users,
    LogOut,
    ArrowLeft,
    Lock,
    Loader2,
    CheckSquare,
    Target,
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { getAcademyState, logoutAcademy, formatDuration, formatDate } from '../lib/ctfAcademy';
import { isLoggedIn, type CtfAcademyData } from '../services/auth';

const TOTAL_CHALLENGES = 11;

const CTFDashboard = () => {
    const [state, setState] = useState<CtfAcademyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();

    // Force dark theme
    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        const root = document.getElementById('root');

        const origBodyBg = body.style.backgroundColor;
        const origBodyColor = body.style.color;
        const origHtmlBg = html.style.backgroundColor;
        const origRootBg = root?.style.backgroundColor || '';
        const origOverflow = body.style.overflow;

        body.style.backgroundColor = '#050505';
        body.style.color = '#00ff41';
        html.style.backgroundColor = '#050505';
        body.style.overflow = 'auto';
        if (root) root.style.backgroundColor = '#050505';

        return () => {
            body.style.backgroundColor = origBodyBg;
            body.style.color = origBodyColor;
            html.style.backgroundColor = origHtmlBg;
            body.style.overflow = origOverflow;
            if (root) root.style.backgroundColor = origRootBg;
        };
    }, []);

    // Guard: redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn()) {
            navigate(NAV_ROUTES.ctf, { replace: true });
            return;
        }

        const fetchState = async () => {
            try {
                const data = await getAcademyState();
                setState(data);
            } catch {
                // If state fetch fails, keep user on page but show minimal info
            } finally {
                setLoading(false);
            }
        };

        fetchState();
    }, [navigate]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logoutAcademy();
        } finally {
            navigate(NAV_ROUTES.ctf, { replace: true });
        }
    };

    const user = state?.currentUser;
    const leaderboard = state?.leaderboard ?? [];
    const participants = state?.participants ?? 0;
    const solvedCount = user?.completedChallengeIds?.length ?? 0;
    const progressPct = Math.round((solvedCount / TOTAL_CHALLENGES) * 100);

    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono">
            {/* Cyber Grid Background */}
            <div
                className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}
            />
            {/* Scanlines */}
            <div
                className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
                    backgroundSize: '100% 4px',
                }}
            />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
                {/* ── Top Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tighter text-white">
                                UCN <span className="text-[#00ff41]">CTF</span> ACADEMY
                            </h1>
                            <p className="text-[#00ff41]/40 text-[10px] tracking-widest uppercase">
                                Operator Dashboard
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to={NAV_ROUTES.home}
                            className="hidden sm:flex items-center gap-2 text-[#00ff41]/40 hover:text-[#00ff41] transition-colors text-xs border border-[#00ff41]/10 px-3 py-1.5 rounded"
                        >
                            <ArrowLeft className="w-3 h-3" /> EclipSec
                        </Link>
                        <button
                            id="ctf-logout-btn"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors text-xs border border-red-500/20 hover:border-red-500/50 px-3 py-1.5 rounded disabled:opacity-50"
                        >
                            {loggingOut ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <LogOut className="w-3 h-3" />
                            )}
                            Logout
                        </button>
                    </div>
                </motion.div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#00ff41]" />
                        <span className="text-[#00ff41]/50 text-sm tracking-widest">
                            LOADING_SESSION_DATA...
                        </span>
                    </div>
                )}

                {/* ── Content ── */}
                {!loading && (
                    <div className="space-y-5">
                        {/* Welcome banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="border border-[#00ff41]/20 bg-[#00ff41]/5 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                            <div>
                                <div className="text-[10px] text-[#00ff41]/50 uppercase tracking-widest mb-1">
                                    Operator Authenticated
                                </div>
                                <div className="text-2xl font-bold text-white tracking-tight">
                                    Welcome, <span className="text-[#00ff41]">{user?.username ?? state?.session?.username ?? '—'}</span>
                                </div>
                                {user?.startedAt && (
                                    <div className="text-[11px] text-[#00ff41]/40 mt-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Started: {formatDate(user.startedAt)}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 border border-[#00ff41]/20 px-4 py-2 rounded-lg">
                                <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                                <span className="text-xs text-[#00ff41]/70 tracking-widest uppercase">
                                    Session Active
                                </span>
                            </div>
                        </motion.div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    icon: CheckSquare,
                                    label: 'Challenges Solved',
                                    value: `${solvedCount} / ${TOTAL_CHALLENGES}`,
                                    color: 'text-[#00ff41]',
                                },
                                {
                                    icon: Target,
                                    label: 'Progress',
                                    value: `${progressPct}%`,
                                    color: progressPct === 100 ? 'text-yellow-400' : 'text-[#00ff41]',
                                },
                                {
                                    icon: Users,
                                    label: 'Participants',
                                    value: String(participants),
                                    color: 'text-cyan-400',
                                },
                                {
                                    icon: Trophy,
                                    label: 'Leaderboard #',
                                    value: leaderboard.findIndex((e) => e.username === user?.username) >= 0
                                        ? `#${leaderboard.findIndex((e) => e.username === user?.username) + 1}`
                                        : '—',
                                    color: 'text-yellow-400',
                                },
                            ].map(({ icon: Icon, label, value, color }, i) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="border border-[#00ff41]/15 bg-black/50 rounded-xl p-4"
                                >
                                    <Icon className="w-4 h-4 text-[#00ff41]/40 mb-2" />
                                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                                    <div className="text-[10px] text-[#00ff41]/40 uppercase tracking-wider mt-0.5">
                                        {label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="border border-[#00ff41]/15 bg-black/50 rounded-xl p-4"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-3 h-3" /> Competition Progress
                                </span>
                                <span className="text-[10px] text-[#00ff41]/60">{solvedCount}/{TOTAL_CHALLENGES} challenges</span>
                            </div>
                            <div className="w-full h-2 bg-[#00ff41]/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-[#00ff41] shadow-[0_0_10px_#00ff41] rounded-full"
                                />
                            </div>
                        </motion.div>

                        {/* Main 2-col grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Challenges — coming soon */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                                className="border border-dashed border-[#00ff41]/20 bg-black/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]"
                            >
                                <Lock className="w-10 h-10 text-[#00ff41]/20" />
                                <div>
                                    <div className="text-white font-bold tracking-tight mb-1">
                                        Challenges
                                    </div>
                                    <div className="text-[#00ff41]/40 text-xs leading-relaxed">
                                        Challenge integration coming soon.
                                        <br />
                                        Stay tuned, operator.
                                    </div>
                                </div>
                                <div className="text-[10px] text-[#00ff41]/20 uppercase tracking-widest border border-[#00ff41]/10 px-3 py-1 rounded">
                                    [ LOCKED ]
                                </div>
                            </motion.div>

                            {/* Leaderboard */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="border border-[#00ff41]/15 bg-black/50 rounded-xl overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-[#00ff41]/10 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-xs font-bold text-white tracking-widest uppercase">
                                        Leaderboard
                                    </span>
                                    <span className="ml-auto text-[10px] text-[#00ff41]/30 uppercase">
                                        Top 10
                                    </span>
                                </div>

                                {leaderboard.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-[#00ff41]/30 text-xs tracking-widest uppercase">
                                        <Trophy className="w-8 h-8 mb-3 opacity-20" />
                                        No finishers yet
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-[#00ff41]/5">
                                        {leaderboard.slice(0, 10).map((entry, i) => (
                                            <li
                                                key={entry.username}
                                                className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                                    entry.username === user?.username
                                                        ? 'bg-[#00ff41]/5'
                                                        : ''
                                                }`}
                                            >
                                                <span
                                                    className={`w-6 text-center font-bold text-xs ${
                                                        i === 0
                                                            ? 'text-yellow-400'
                                                            : i === 1
                                                            ? 'text-slate-300'
                                                            : i === 2
                                                            ? 'text-amber-600'
                                                            : 'text-[#00ff41]/30'
                                                    }`}
                                                >
                                                    #{i + 1}
                                                </span>
                                                <span className={`flex-1 text-xs ${entry.username === user?.username ? 'text-[#00ff41]' : 'text-white/70'}`}>
                                                    {entry.username}
                                                    {entry.username === user?.username && (
                                                        <span className="text-[#00ff41]/50 ml-1">(you)</span>
                                                    )}
                                                </span>
                                                <span className="text-[#00ff41]/50 text-[11px]">
                                                    {formatDuration(entry.durationMs)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-[#00ff41]/20 text-[10px] uppercase tracking-widest pt-2 pb-6">
                            © {new Date().getFullYear()} EclipSec // UCN Hacking Academy
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CTFDashboard;
