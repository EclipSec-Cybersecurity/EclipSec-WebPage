import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Trophy,
  CheckCircle2,
  Lock,
  LogOut,
  User,
  Zap,
  Skull,
  AlertTriangle,
  Globe,
  Key,
  Bug,
  Code,
  Crown,
  Loader2,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { getAcademyState, logoutAcademy, getCountryFlag } from '../lib/ctfAcademy';
import { getChallenges, type BackendChallenge } from '../services/challenges';
import { isLoggedIn, type CtfUser } from '../services/auth';
import { CategorySidebarFilter } from '../components/ctf/CategorySidebarFilter';
import { RecentChallengesScoreboard } from '../components/ctf/RecentChallengesScoreboard';

type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';
type CategoryFilter = 'ALL' | 'WEB' | 'CRYPTO' | 'FORENSICS' | 'PWN' | 'MISC';

const DIFFICULTY_CONFIG: Record<
  'EASY' | 'MEDIUM' | 'HARD' | 'INSANE',
  { color: string; border: string; bg: string; icon: React.ReactNode }
> = {
  EASY: {
    color: '#00ff41',
    border: 'rgba(0,255,65,0.4)',
    bg: 'rgba(0,255,65,0.08)',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  MEDIUM: {
    color: '#eab308',
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.08)',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  HARD: {
    color: '#ef4444',
    border: 'rgba(239,68,68,0.4)',
    bg: 'rgba(239,68,68,0.08)',
    icon: <Skull className="w-3.5 h-3.5" />,
  },
  INSANE: {
    color: '#a855f7',
    border: 'rgba(168,85,247,0.4)',
    bg: 'rgba(168,85,247,0.08)',
    icon: <Skull className="w-3.5 h-3.5 text-purple-400" />,
  },
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  WEB: { color: '#3b82f6', icon: <Globe className="w-4 h-4" /> },
  CRYPTO: { color: '#eab308', icon: <Key className="w-4 h-4" /> },
  FORENSICS: { color: '#10b981', icon: <Search className="w-4 h-4" /> },
  PWN: { color: '#ef4444', icon: <Bug className="w-4 h-4" /> },
  MISC: { color: '#a855f7', icon: <Code className="w-4 h-4" /> },
};

const CTFLobby = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CtfUser | null>(null);
  const [challenges, setChallenges] = useState<BackendChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('ALL');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);

  // Selected challenge modal state
  const [selectedChallenge, setSelectedChallenge] = useState<BackendChallenge | null>(null);

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

  // Check auth & fetch data
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(NAV_ROUTES.ctf, { replace: true });
      return;
    }

    const loadLobby = async () => {
      setLoading(true);
      try {
        const state = await getAcademyState();
        setCurrentUser(state.currentUser);

        // Fetch challenge cards from GET /api/v1/challenges
        const chList = await getChallenges();
        // Ocultar retos por ahora, mantener plantilla lista
        setChallenges([]); 
        // setChallenges(chList);
      } catch (err) {
        console.error('Failed to load lobby data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLobby();
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAcademy();
    } finally {
      navigate(NAV_ROUTES.ctf, { replace: true });
    }
  };

  const handleSidebarFilterChange = async (filters: { category: string; difficulty: string }) => {
    const cat = filters.category ? (filters.category.toUpperCase() as CategoryFilter) : 'ALL';
    const diff = filters.difficulty ? (filters.difficulty.toUpperCase() as DifficultyFilter) : 'ALL';
    setSelectedCategory(cat);
    setSelectedDifficulty(diff);

    try {
      const data = await getChallenges({
        category: filters.category || undefined,
        difficulty: filters.difficulty || undefined,
      });
      // Ocultar retos por ahora, mantener plantilla lista
      setChallenges([]); 
      // setChallenges(data);
    } catch (err) {
      console.error('Error fetching filtered challenges:', err);
    }
  };

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const flagEmoji = getCountryFlag(currentUser?.nationality);

  // Filtered challenges logic
  const filteredChallenges = challenges.filter((ch) => {
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || ch.category.toUpperCase() === selectedCategory;

    const matchesDifficulty =
      selectedDifficulty === 'ALL' || ch.difficulty.toUpperCase() === selectedDifficulty;

    const matchesSolved = !showSolvedOnly || ch.is_solved;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesSolved;
  });

  const totalPointsAvailable = challenges.reduce((acc, c) => acc + c.points, 0);
  const solvedCount = challenges.filter((c) => c.is_solved).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00ff41]" />
          <p className="text-sm tracking-widest uppercase">Cargando Lobby de Desafíos CTF...</p>
        </div>
      </div>
    );
  }

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

      {/* Main Layout Container */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-6 flex flex-col xl:flex-row gap-6 xl:gap-8 justify-center items-start">
        {/* Left Sidebar - Sticky on desktop */}
        <div className="hidden xl:block sticky top-24 z-20 w-64 shrink-0 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <CategorySidebarFilter onFilterChange={handleSidebarFilterChange} />
        </div>

        {/* Center Content */}
        <div className="w-full max-w-5xl flex-1">
        {/* Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-8 gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <Shield className="w-7 h-7 text-[#00ff41]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase text-white flex items-center gap-2">
                CHALLENGE LOBBY <span className="text-[#00ff41] text-xs font-normal border border-[#00ff41]/40 px-2 py-0.5 rounded">CTF ARENA</span>
              </h1>
              <p className="text-xs text-gray-400">EclipSec Cyber Range Platform</p>
            </div>
          </div>

          {/* User Quick Bar & Navigation */}
          {currentUser && (
            <div className="flex items-center gap-4">
              <Link
                to={NAV_ROUTES.ctfProfile}
                className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-500 transition-all text-sm font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)] group"
              >
                {/* Avatar con la inicial del usuario */}
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase border border-emerald-500/40 group-hover:scale-105 transition-transform">
                  {currentUser.username?.[0] || 'U'}
                </div>

                {/* Username y Badge de Rol */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{currentUser.username}</span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {currentUser.role || 'USER'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <strong className="text-emerald-400">{currentUser.score || 0}</strong> PTS • {currentUser.rankName || 'Noob'}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-500/40 bg-red-950/20 text-red-400 rounded-xl text-xs hover:bg-red-900/30 transition-all disabled:opacity-50"
                title="Cerrar Sesión"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Banner Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#00ff41]/30 bg-[#0a0a0a]/90 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(0,255,65,0.05)]"
        >
          <div>
            <h2 className="text-xl font-black text-white tracking-wide mb-1">
              Catálogo de Retos Activos ({challenges.length})
            </h2>
            <p className="text-xs text-gray-400">
              Explorá y superá desafíos de seguridad informática para sumar puntos y subir en el ranking global.
            </p>
          </div>

          <div className="flex items-center gap-6 text-center sm:text-right">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Resueltos por ti</div>
              <div className="text-xl font-black text-[#00ff41]">
                {solvedCount} / {challenges.length}
              </div>
            </div>

            <div className="w-px h-8 bg-[#00ff41]/20 hidden sm:block" />

            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Puntos Totales Arena</div>
              <div className="text-xl font-black text-white">
                {totalPointsAvailable} <span className="text-xs text-[#00ff41]">PTS</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebars for mobile / tablet (< XL screen size) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:hidden mb-8">
          <CategorySidebarFilter onFilterChange={handleSidebarFilterChange} />
          <RecentChallengesScoreboard />
        </div>

        {/* ── Main Lobby Content ── */}
        <div className="w-full">
          {/* ── Filters & Search Controls ── */}
          <div className="bg-[#0a0a0a]/80 border border-[#00ff41]/20 rounded-2xl p-4 mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título o tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-[#00ff41]/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] transition-colors"
                />
              </div>

              {/* Solved toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={showSolvedOnly}
                  onChange={(e) => setShowSolvedOnly(e.target.checked)}
                  className="rounded border-[#00ff41] text-[#00ff41] focus:ring-0 bg-black"
                />
                Mostrar solo resueltos (<span className="text-[#00ff41]">{solvedCount}</span>)
              </label>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#00ff41]/10">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#00ff41]" /> Categoría:
              </span>
              {(['ALL', 'WEB', 'CRYPTO', 'FORENSICS', 'PWN', 'MISC'] as CategoryFilter[]).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      handleSidebarFilterChange({
                        category: cat === 'ALL' ? '' : cat,
                        difficulty: selectedDifficulty === 'ALL' ? '' : selectedDifficulty,
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      active
                        ? 'bg-[#00ff41] text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                        : 'bg-black/60 border border-[#00ff41]/30 text-gray-300 hover:border-[#00ff41] hover:text-[#00ff41]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Difficulty Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#00ff41]" /> Dificultad:
              </span>
              {(['ALL', 'EASY', 'MEDIUM', 'HARD', 'INSANE'] as DifficultyFilter[]).map((diff) => {
                const active = selectedDifficulty === diff;
                const diffStyle = diff !== 'ALL' ? DIFFICULTY_CONFIG[diff] : null;
                return (
                  <button
                    key={diff}
                    onClick={() => {
                      setSelectedDifficulty(diff);
                      handleSidebarFilterChange({
                        category: selectedCategory === 'ALL' ? '' : selectedCategory,
                        difficulty: diff === 'ALL' ? '' : diff,
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      active
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'bg-black/60 border border-gray-700 text-gray-300 hover:border-white hover:text-white'
                    }`}
                    style={
                      active && diffStyle
                        ? { backgroundColor: diffStyle.color, color: '#000' }
                        : {}
                    }
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Cards Feed Grid ── */}
          {filteredChallenges.length === 0 ? (
            <div className="border border-dashed border-[#00ff41]/20 rounded-2xl p-12 text-center bg-[#0a0a0a]/50">
              <Shield className="w-12 h-12 mx-auto mb-3 text-[#00ff41] animate-pulse" />
              <p className="text-xl font-bold text-white">Aún no hay retos disponibles</p>
              <p className="text-sm text-gray-400 mt-2">
                ¡Pronto van a llegar nuevos desafíos! Mantente atento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredChallenges.map((ch, idx) => {
                const diffConfig = DIFFICULTY_CONFIG[ch.difficulty.toUpperCase() as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.EASY;
                const catConfig = CATEGORY_CONFIG[ch.category.toUpperCase()] || { color: '#00ff41', icon: <Globe className="w-4 h-4" /> };

                return (
                  <motion.div
                    key={ch.id || ch.slug || idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border rounded-2xl p-6 bg-[#0a0a0a]/90 backdrop-blur flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                      ch.is_solved
                        ? 'border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.15)]'
                        : 'border-[#00ff41]/20 hover:border-[#00ff41]/60 shadow-lg'
                    }`}
                  >
                    {/* Top Status Strip */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {/* Category Tag */}
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider"
                        style={{
                          borderColor: `${catConfig.color}60`,
                          backgroundColor: `${catConfig.color}15`,
                          color: catConfig.color,
                        }}
                      >
                        {catConfig.icon}
                        {ch.category}
                      </div>

                      {/* Is Solved Badge OR Difficulty */}
                      {ch.is_solved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-[#00ff41]/20 border border-[#00ff41] text-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.3)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> RESUELTO
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border"
                          style={{
                            borderColor: diffConfig.border,
                            backgroundColor: diffConfig.bg,
                            color: diffConfig.color,
                          }}
                        >
                          {diffConfig.icon}
                          {ch.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#00ff41] transition-colors">
                        {ch.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-4 border-t border-[#00ff41]/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Recompensa</div>
                        <div className="text-base font-black text-white">
                          +{ch.points} <span className="text-xs text-[#00ff41]">PTS</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedChallenge(ch)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          ch.is_solved
                            ? 'bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20'
                            : 'bg-[#00ff41] text-black hover:bg-[#00ff41]/80 font-black shadow-[0_0_15px_rgba(0,255,65,0.3)]'
                        }`}
                      >
                        {ch.is_solved ? 'Ver Reto' : 'Lanzar Reto'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Sticky on desktop */}
        <div className="hidden xl:block sticky top-24 z-20 w-80 shrink-0 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <RecentChallengesScoreboard />
        </div>
      </div>

      {/* ── Challenge Quick Modal Detail ── */}
      <AnimatePresence>
        {selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border-2 border-[#00ff41] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(0,255,65,0.2)] text-white relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">
                    {selectedChallenge.category} • {selectedChallenge.difficulty}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{selectedChallenge.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-gray-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black/60 border border-[#00ff41]/20 rounded-xl p-4 mb-4 text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                {selectedChallenge.description}
              </div>

              <div className="flex items-center justify-between mb-6 text-xs text-gray-400">
                <span>Puntos otorgados: <strong className="text-white">+{selectedChallenge.points} PTS</strong></span>
                <span>Resoluciones globales: <strong className="text-[#00ff41]">{selectedChallenge.solves_count || 0}</strong></span>
              </div>

              {selectedChallenge.target_url && (
                <div className="mb-6 p-3 bg-blue-950/30 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-blue-300 truncate mr-2">Target URL: {selectedChallenge.target_url}</span>
                  <a
                    href={selectedChallenge.target_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:underline font-bold"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-4 py-2 border border-gray-700 rounded-xl text-xs text-gray-300 hover:bg-gray-800"
                >
                  Cerrar
                </button>
                <Link
                  to={`/ctf/challenge/${selectedChallenge.id || selectedChallenge.slug}`}
                  className="px-4 py-2 bg-[#00ff41] text-black font-bold rounded-xl text-xs hover:bg-[#00ff41]/80 shadow-[0_0_15px_rgba(0,255,65,0.3)] inline-flex items-center gap-1"
                >
                  Abrir Laboratorio CTF <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CTFLobby;
