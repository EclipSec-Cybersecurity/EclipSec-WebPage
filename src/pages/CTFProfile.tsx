import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Shield,
  Trophy,
  Award,
  Clock,
  LogOut,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Globe,
  Crown,
  UserCheck,
  Zap,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { getAcademyState, logoutAcademy, getCountryFlag, formatDate } from '../lib/ctfAcademy';
import {
  isLoggedIn,
  getUserProfile,
  type CtfUser,
  type UserProfileResponse,
  type RecentSolve,
} from '../services/auth';

const RANK_COLORS: Record<string, { color: string; border: string; bg: string }> = {
  Omniscient: { color: '#ff00ff', border: 'rgba(255,0,255,0.4)', bg: 'rgba(255,0,255,0.1)' },
  Guru: { color: '#a855f7', border: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.1)' },
  'Elite Hacker': { color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.1)' },
  'Pro Hacker': { color: '#3b82f6', border: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.1)' },
  Hacker: { color: '#00ff41', border: 'rgba(0,255,65,0.4)', bg: 'rgba(0,255,65,0.1)' },
  'Script Kiddie': { color: '#eab308', border: 'rgba(234,179,8,0.4)', bg: 'rgba(234,179,8,0.1)' },
  Noob: { color: '#9ca3af', border: 'rgba(156,163,175,0.4)', bg: 'rgba(156,163,175,0.1)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  WEB: '#3b82f6',
  CRYPTO: '#eab308',
  FORENSICS: '#10b981',
  PWN: '#ef4444',
  MISC: '#a855f7',
};

const CTFProfile = () => {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CtfUser | null>(null);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Force dark theme
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
    body.style.overflow = 'auto';
    if (root) root.style.backgroundColor = '#050505';

    return () => {
      body.style.backgroundColor = origBodyBg;
      body.style.color = origBodyColor;
      html.style.backgroundColor = origHtmlBg;
      if (root) root.style.backgroundColor = origRootBg;
    };
  }, []);

  // Fetch session & profile data
  useEffect(() => {
    if (!isLoggedIn() && !paramUsername) {
      navigate(NAV_ROUTES.ctf, { replace: true });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch academy state to get current logged in user
        const academyState = await getAcademyState();
        const me = academyState.currentUser;
        setCurrentUser(me);

        const targetUser = paramUsername || me?.username;
        if (!targetUser) {
          setError('Usuario no especificado.');
          setLoading(false);
          return;
        }

        // Try to fetch full public profile from GET /api/v1/users/{username}/profile
        try {
          const profile = await getUserProfile(targetUser);
          setProfileData(profile);
        } catch {
          // Fallback to local session data if endpoint is offline or viewing self
          if (me && me.username.toLowerCase() === targetUser.toLowerCase()) {
            setProfileData({
              username: me.username,
              role: me.role || 'user',
              nationality: me.nationality || 'CL',
              score: me.score || 0,
              rankName: me.rankName || 'Noob',
              globalRank: me.globalRank ?? null,
              solvesCount: me.solvesCount ?? me.solves_count ?? me.completedChallengeIds?.length ?? 0,
              createdAt: me.createdAt || me.created_at,
              description: me.description,
            });
          } else {
            setError(`No se pudo cargar el perfil de @${targetUser}.`);
          }
        }
      } catch {
        setError('Error al comunicarse con el servidor CTF.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [paramUsername, navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAcademy();
    } finally {
      navigate(NAV_ROUTES.ctf, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00ff41]" />
          <p className="text-sm tracking-widest uppercase">Cargando Perfil HTB...</p>
        </div>
      </div>
    );
  }

  // Active display user (either fetched profile or logged in user fallback)
  const displayUser = profileData || (currentUser ? {
    username: currentUser.username,
    role: currentUser.role || 'user',
    nationality: currentUser.nationality || 'CL',
    score: currentUser.score || 0,
    rankName: currentUser.rankName || 'Noob',
    globalRank: currentUser.globalRank ?? null,
    solvesCount: currentUser.solvesCount ?? currentUser.solves_count ?? 0,
    createdAt: currentUser.createdAt || currentUser.created_at,
    description: currentUser.description,
  } : null);

  if (error || !displayUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono flex flex-col items-center justify-center p-4">
        <div className="border border-red-500/40 bg-red-950/20 rounded-xl p-6 max-w-md w-full text-center">
          <p className="text-red-400 font-bold mb-4">{error || 'Perfil no encontrado'}</p>
          <Link
            to={NAV_ROUTES.ctfLobby}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] rounded-lg hover:bg-[#00ff41]/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Lobby
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = displayUser.role?.toLowerCase() === 'admin';
  const flagEmoji = getCountryFlag(displayUser.nationality);
  const rankStyle = RANK_COLORS[displayUser.rankName] || RANK_COLORS.Noob;

  // Format category breakdown
  const categoryMap = displayUser.categoryBreakdown;
  const categoriesList: { category: string; count: number; points: number }[] = Array.isArray(categoryMap)
    ? categoryMap
    : categoryMap
    ? Object.entries(categoryMap).map(([cat, val]) => ({
        category: cat.toUpperCase(),
        count: val.count,
        points: val.points,
      }))
    : [];

  const recentSolves: RecentSolve[] = displayUser.recentSolves || [];

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono relative overflow-x-hidden">
      {/* Cyber Grid Background */}
      <div
        className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />
      {/* Scanline Effect */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Top Navbar Bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-8 gap-4"
        >
          <div className="flex items-center gap-3">
            <Link
              to={NAV_ROUTES.ctfLobby}
              className="p-2 border border-[#00ff41]/40 rounded-lg hover:bg-[#00ff41]/10 text-[#00ff41] transition-colors"
              title="Ir al Lobby de Retos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <Shield className="w-6 h-6 text-[#00ff41]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase text-white flex items-center gap-2">
                HACKER PROFILE <span className="text-[#00ff41] text-xs font-normal border border-[#00ff41]/40 px-2 py-0.5 rounded">HTB STYLE</span>
              </h1>
              <p className="text-xs text-gray-400">EclipSec CTF Academy Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={NAV_ROUTES.ctfLobby}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/5 rounded text-xs text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
            >
              <LayoutGrid className="w-4 h-4" /> Lobby de Retos
            </Link>

            {currentUser && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-3 py-1.5 border border-red-500/40 bg-red-950/20 text-red-400 rounded text-xs hover:bg-red-900/30 transition-all disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Cerrar Sesión
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Main Profile Header Box ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-[#00ff41]/30 bg-[#0a0a0a]/90 backdrop-blur rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(0,255,65,0.1)] relative overflow-hidden"
        >
          {/* Top Decorative accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* User Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-lg"
                  style={{
                    borderColor: isAdmin ? '#ef4444' : '#00ff41',
                    backgroundColor: 'rgba(10,10,10,0.8)',
                    boxShadow: isAdmin ? '0 0 25px rgba(239,68,68,0.3)' : '0 0 25px rgba(0,255,65,0.25)',
                    color: isAdmin ? '#ef4444' : '#00ff41',
                  }}
                >
                  {displayUser.username.substring(0, 2).toUpperCase()}
                </div>
                {/* Flag Badge */}
                <div className="absolute -bottom-2 -right-2 text-2xl bg-black border border-white/20 px-2 py-0.5 rounded-md shadow-md">
                  {flagEmoji}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                  <h2 className="text-2xl font-black text-white tracking-wider">{displayUser.username}</h2>

                  {/* Role Badge */}
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-600/30 to-amber-600/30 border border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                      <Crown className="w-3 h-3 text-amber-400" /> ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00ff41]/10 border border-[#00ff41]/50 text-[#00ff41]">
                      <UserCheck className="w-3 h-3" /> USER
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <span>Nacionalidad: <strong className="text-gray-200">{displayUser.nationality}</strong></span>
                  <span>•</span>
                  <span>Registrado: <strong className="text-gray-200">{displayUser.createdAt ? formatDate(Number(displayUser.createdAt)) : 'Reciente'}</strong></span>
                </p>

                {/* Dynamic Rank Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold tracking-wider"
                  style={{
                    color: rankStyle.color,
                    borderColor: rankStyle.border,
                    backgroundColor: rankStyle.bg,
                  }}
                >
                  <Award className="w-4 h-4" /> RANGO: {displayUser.rankName.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Quick Actions / Share Profile */}
            <div className="flex flex-col items-end justify-center text-right">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Status Global</div>
              <div className="text-3xl font-black text-white">
                {displayUser.globalRank ? `#${displayUser.globalRank}` : 'TOP PLAYER'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── HTB Highlight Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Score */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-[#00ff41]/30 bg-[#0a0a0a]/80 p-5 rounded-xl flex items-center gap-4 hover:border-[#00ff41]/60 transition-all shadow-[0_0_15px_rgba(0,255,65,0.05)]"
          >
            <div className="p-3 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg text-[#00ff41]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Puntaje Total</div>
              <div className="text-2xl font-black text-white">{displayUser.score} <span className="text-xs font-normal text-[#00ff41]">PTS</span></div>
            </div>
          </motion.div>

          {/* Card 2: Rank Name */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border bg-[#0a0a0a]/80 p-5 rounded-xl flex items-center gap-4 hover:opacity-90 transition-all"
            style={{ borderColor: rankStyle.border }}
          >
            <div className="p-3 rounded-lg border text-[#00ff41]" style={{ backgroundColor: rankStyle.bg, borderColor: rankStyle.border, color: rankStyle.color }}>
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Rango Hacker</div>
              <div className="text-lg font-black text-white" style={{ color: rankStyle.color }}>{displayUser.rankName}</div>
            </div>
          </motion.div>

          {/* Card 3: Global Rank */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-[#00ff41]/30 bg-[#0a0a0a]/80 p-5 rounded-xl flex items-center gap-4 hover:border-[#00ff41]/60 transition-all shadow-[0_0_15px_rgba(0,255,65,0.05)]"
          >
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-cyan-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Puesto en Ranking</div>
              <div className="text-2xl font-black text-white">
                {displayUser.globalRank ? `#${displayUser.globalRank}` : 'Clasificado'}
              </div>
            </div>
          </motion.div>

          {/* Card 4: Solves Count */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-[#00ff41]/30 bg-[#0a0a0a]/80 p-5 rounded-xl flex items-center gap-4 hover:border-[#00ff41]/60 transition-all shadow-[0_0_15px_rgba(0,255,65,0.05)]"
          >
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Retos Resueltos</div>
              <div className="text-2xl font-black text-white">{displayUser.solvesCount} <span className="text-xs font-normal text-gray-400">SOLVES</span></div>
            </div>
          </motion.div>
        </div>

        {/* ── Category Breakdown & Recent Solves Split ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Breakdown (1 column) */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="border border-[#00ff41]/30 bg-[#0a0a0a]/80 rounded-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#00ff41]" /> Desglose por Categoría
              </h3>

              {categoriesList.length === 0 ? (
                <div className="space-y-4">
                  {['WEB', 'CRYPTO', 'FORENSICS', 'PWN', 'MISC'].map((cat) => {
                    const catColor = CATEGORY_COLORS[cat] || '#00ff41';
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span style={{ color: catColor }}>{cat}</span>
                          <span className="text-gray-400">0 pts</span>
                        </div>
                        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                          <div className="h-full rounded-full w-0" style={{ backgroundColor: catColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {categoriesList.map((item) => {
                    const catColor = CATEGORY_COLORS[item.category.toUpperCase()] || '#00ff41';
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span style={{ color: catColor }}>{item.category.toUpperCase()}</span>
                          <span className="text-gray-300">{item.count} solves ({item.points} pts)</span>
                        </div>
                        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: catColor,
                              width: `${Math.min(100, item.count * 20)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#00ff41]/20 text-xs text-gray-400">
              💡 Demostrá tus habilidades resolviendo retos de distintas categorías en el Lobby.
            </div>
          </motion.div>

          {/* Recent Solves Feed (2 columns) */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 border border-[#00ff41]/30 bg-[#0a0a0a]/80 rounded-2xl p-6"
          >
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00ff41]" /> Útimas Resoluciones (Solves)
            </h3>

            {recentSolves.length === 0 ? (
              <div className="border border-dashed border-[#00ff41]/20 rounded-xl p-8 text-center text-gray-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-semibold">Sin resoluciones recientes registrados.</p>
                <p className="text-xs text-gray-600 mt-1">¡Accedé al Lobby para resolver tu primer desafío!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {recentSolves.map((solve, idx) => {
                  const catColor = CATEGORY_COLORS[solve.category?.toUpperCase()] || '#00ff41';
                  return (
                    <div
                      key={solve.challenge_id || idx}
                      className="border border-[#00ff41]/20 bg-black/50 p-3.5 rounded-xl flex items-center justify-between hover:border-[#00ff41]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border bg-black/60" style={{ borderColor: catColor, color: catColor }}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{solve.challenge_title}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] bg-black border" style={{ borderColor: catColor, color: catColor }}>
                              {solve.category}
                            </span>
                            <span>•</span>
                            <span>{solve.solved_at ? formatDate(Number(solve.solved_at)) : 'Reciente'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-[#00ff41] bg-[#00ff41]/10 px-2.5 py-1 rounded-md border border-[#00ff41]/30">
                          +{solve.points} PTS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CTFProfile;
