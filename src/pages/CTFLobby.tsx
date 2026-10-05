import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  Trophy,
  CheckCircle2,
  LogOut,
  Zap,
  Skull,
  AlertTriangle,
  Globe,
  Key,
  Bug,
  Code,
  Loader2,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Users,
  Lightbulb,
  RefreshCw,
  FilterX,
  Target,
} from "lucide-react";
import { NAV_ROUTES } from "../config/site";
import { getAcademyState, logoutAcademy } from "../lib/ctfAcademy";
import { getChallenges, type BackendChallenge } from "../services/challenges";
import { isLoggedIn, type CtfUser } from "../services/auth";
import { CategorySidebarFilter } from "../components/ctf/CategorySidebarFilter";
import { RecentChallengesScoreboard } from "../components/ctf/RecentChallengesScoreboard";

type Difficulty = BackendChallenge["difficulty"];
type StatusFilter = "ALL" | "PENDING" | "SOLVED";
type SortKey =
  | "RECOMMENDED"
  | "POINTS_ASC"
  | "POINTS_DESC"
  | "SOLVES_DESC"
  | "DIFFICULTY";

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD", "INSANE"];

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { color: string; border: string; bg: string; icon: React.ReactNode }
> = {
  EASY: {
    color: "#00ff41",
    border: "rgba(0,255,65,0.4)",
    bg: "rgba(0,255,65,0.08)",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  MEDIUM: {
    color: "#eab308",
    border: "rgba(234,179,8,0.4)",
    bg: "rgba(234,179,8,0.08)",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  HARD: {
    color: "#ef4444",
    border: "rgba(239,68,68,0.4)",
    bg: "rgba(239,68,68,0.08)",
    icon: <Skull className="w-3.5 h-3.5" />,
  },
  INSANE: {
    color: "#a855f7",
    border: "rgba(168,85,247,0.4)",
    bg: "rgba(168,85,247,0.08)",
    icon: <Skull className="w-3.5 h-3.5" />,
  },
};

const CATEGORY_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode }
> = {
  WEB: { color: "#3b82f6", icon: <Globe className="w-4 h-4" /> },
  CRYPTO: { color: "#eab308", icon: <Key className="w-4 h-4" /> },
  FORENSICS: { color: "#10b981", icon: <Search className="w-4 h-4" /> },
  PWN: { color: "#ef4444", icon: <Bug className="w-4 h-4" /> },
  MISC: { color: "#a855f7", icon: <Code className="w-4 h-4" /> },
};

const FALLBACK_CATEGORY = {
  color: "#00ff41",
  icon: <Globe className="w-4 h-4" />,
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "RECOMMENDED", label: "Recomendado (pendientes primero)" },
  { key: "POINTS_ASC", label: "Puntos: menor a mayor" },
  { key: "POINTS_DESC", label: "Puntos: mayor a menor" },
  { key: "DIFFICULTY", label: "Dificultad" },
  { key: "SOLVES_DESC", label: "Más resueltos" },
];

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendientes" },
  { key: "SOLVED", label: "Resueltos" },
];

/** Only absolute http(s) URLs can be opened in a new tab; relative paths would hit this SPA instead of the lab. */
const isLaunchableUrl = (url: string) => /^https?:\/\//i.test(url);

const difficultyRank = (d: string) => {
  const idx = DIFFICULTY_ORDER.indexOf(d.toUpperCase() as Difficulty);
  return idx === -1 ? DIFFICULTY_ORDER.length : idx;
};

const diffStyle = (d: string) =>
  DIFFICULTY_CONFIG[d.toUpperCase() as Difficulty] ?? DIFFICULTY_CONFIG.EASY;

const catStyle = (c: string) =>
  CATEGORY_CONFIG[c.toUpperCase()] ?? FALLBACK_CATEGORY;

const sortChallenges = (
  list: BackendChallenge[],
  sort: SortKey,
): BackendChallenge[] => {
  const copy = [...list];
  switch (sort) {
    case "POINTS_ASC":
      return copy.sort((a, b) => a.points - b.points);
    case "POINTS_DESC":
      return copy.sort((a, b) => b.points - a.points);
    case "SOLVES_DESC":
      return copy.sort((a, b) => (b.solves_count || 0) - (a.solves_count || 0));
    case "DIFFICULTY":
      return copy.sort(
        (a, b) =>
          difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
          a.points - b.points,
      );
    case "RECOMMENDED":
    default:
      // Pending first, then easiest/cheapest first so the player always sees a sensible next target.
      return copy.sort(
        (a, b) =>
          Number(a.is_solved) - Number(b.is_solved) ||
          difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
          a.points - b.points,
      );
  }
};

const CTFLobby = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CtfUser | null>(null);
  const [challenges, setChallenges] = useState<BackendChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Filter / sort state (single source of truth, shared with the sidebar)
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("RECOMMENDED");

  // Selected challenge modal state
  const [selectedChallenge, setSelectedChallenge] =
    useState<BackendChallenge | null>(null);
  const [showHints, setShowHints] = useState(false);

  // Force dark theme
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById("root");

    const origBodyBg = body.style.backgroundColor;
    const origBodyColor = body.style.color;
    const origHtmlBg = html.style.backgroundColor;
    const origRootBg = root?.style.backgroundColor || "";

    body.style.backgroundColor = "#050505";
    body.style.color = "#00ff41";
    html.style.backgroundColor = "#050505";
    body.style.overflow = "auto";
    if (root) root.style.backgroundColor = "#050505";

    return () => {
      body.style.backgroundColor = origBodyBg;
      body.style.color = origBodyColor;
      html.style.backgroundColor = origHtmlBg;
      if (root) root.style.backgroundColor = origRootBg;
    };
  }, []);

  const loadLobby = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    // Independent requests: a failing profile must not hide the challenges, and vice versa.
    const [stateResult, challengesResult] = await Promise.allSettled([
      getAcademyState(),
      getChallenges(),
    ]);

    if (stateResult.status === "fulfilled") {
      setCurrentUser(stateResult.value.currentUser);
    } else {
      console.error("Failed to load academy state:", stateResult.reason);
    }

    if (challengesResult.status === "fulfilled") {
      setChallenges(challengesResult.value);
    } else {
      console.error("Failed to load challenges:", challengesResult.reason);
      setLoadError(
        challengesResult.reason instanceof Error
          ? challengesResult.reason.message
          : "No se pudo cargar el catálogo de retos.",
      );
    }

    setLoading(false);
  }, []);

  // Check auth & fetch data
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(NAV_ROUTES.ctf, { replace: true });
      return;
    }
    void loadLobby();
  }, [navigate, loadLobby]);

  // Close the modal with Escape
  useEffect(() => {
    if (!selectedChallenge) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedChallenge(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedChallenge]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAcademy();
    } finally {
      navigate(NAV_ROUTES.ctf, { replace: true });
    }
  };

  const handleSidebarFilterChange = (filters: {
    category: string;
    difficulty: string;
  }) => {
    setCategory(filters.category);
    setDifficulty(filters.difficulty);
  };

  const openChallenge = (ch: BackendChallenge) => {
    setShowHints(false);
    setSelectedChallenge(ch);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("");
    setDifficulty("");
    setStatus("ALL");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    category !== "" ||
    difficulty !== "" ||
    status !== "ALL";

  const visibleChallenges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = challenges.filter((ch) => {
      const matchesSearch =
        q === "" ||
        ch.title.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        ch.category.toLowerCase().includes(q);
      const matchesCategory =
        !category || ch.category.toLowerCase() === category.toLowerCase();
      const matchesDifficulty =
        !difficulty || ch.difficulty.toUpperCase() === difficulty.toUpperCase();
      const matchesStatus =
        status === "ALL" ||
        (status === "SOLVED" ? ch.is_solved : !ch.is_solved);
      return (
        matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
      );
    });
    return sortChallenges(filtered, sort);
  }, [challenges, searchQuery, category, difficulty, status, sort]);

  // Progress is always computed over the full catalog, never over the filtered view.
  const progress = useMemo(() => {
    const solved = challenges.filter((c) => c.is_solved);
    const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
    const earnedPoints = solved.reduce((acc, c) => acc + c.points, 0);

    const byCategory = new Map<string, { total: number; solved: number }>();
    challenges.forEach((c) => {
      const key = c.category.toUpperCase();
      const entry = byCategory.get(key) ?? { total: 0, solved: 0 };
      entry.total += 1;
      if (c.is_solved) entry.solved += 1;
      byCategory.set(key, entry);
    });

    return {
      solvedCount: solved.length,
      total: challenges.length,
      totalPoints,
      earnedPoints,
      percent: challenges.length
        ? Math.round((solved.length / challenges.length) * 100)
        : 0,
      categories: [...byCategory.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    };
  }, [challenges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00ff41]" />
          <p className="text-sm tracking-widest uppercase">
            Cargando Lobby de Desafíos CTF...
          </p>
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
          backgroundSize: "30px 30px",
        }}
      />
      {/* Scanline Effect */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Main Layout Container: sticky sidebars flank the feed so they never overlap it */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-6 flex flex-col xl:flex-row gap-6 xl:gap-8 justify-center items-start">
        {/* Left Sidebar - Sticky on desktop */}
        <div className="hidden xl:block sticky top-24 z-20 w-64 shrink-0 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <CategorySidebarFilter
            category={category}
            difficulty={difficulty}
            onFilterChange={handleSidebarFilterChange}
          />
        </div>

        {/* Center Content */}
        <div className="w-full max-w-5xl flex-1 min-w-0">
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
                  CHALLENGE LOBBY{" "}
                  <span className="text-[#00ff41] text-xs font-normal border border-[#00ff41]/40 px-2 py-0.5 rounded">
                    CTF ARENA
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  EclipSec Cyber Range Platform
                </p>
              </div>
            </div>

            {/* User Quick Bar & Navigation */}
            {currentUser && (
              <div className="flex items-center gap-4">
                <Link
                  to={NAV_ROUTES.ctfChallenges}
                  className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/5 rounded text-xs text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
                >
                  <LayoutGrid className="w-4 h-4" /> Catálogo
                </Link>

                <Link
                  to={NAV_ROUTES.ctfLeaderboard}
                  className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/5 rounded text-xs text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
                >
                  <Trophy className="w-4 h-4" /> Leaderboard
                </Link>

                <Link
                  to={NAV_ROUTES.ctfProfile}
                  className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-500 transition-all text-sm font-medium shadow-[0_0_15px_rgba(16,185,129,0.1)] group"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase border border-emerald-500/40 group-hover:scale-105 transition-transform">
                    {currentUser.username?.[0] || "U"}
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {currentUser.username}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {currentUser.role || "USER"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <strong className="text-emerald-400">
                        {currentUser.score || 0}
                      </strong>{" "}
                      PTS • {currentUser.rankName || "Noob"}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-500/40 bg-red-950/20 text-red-400 rounded-xl text-xs hover:bg-red-900/30 transition-all disabled:opacity-50"
                  title="Cerrar Sesión"
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* ── Player progress overview ── */}
          <motion.section
            aria-label="Progreso del jugador"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#00ff41]/30 bg-[#0a0a0a]/90 rounded-2xl p-6 mb-8 shadow-[0_0_20px_rgba(0,255,65,0.05)]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-[#00ff41] shrink-0" />
                <div>
                  <h2 className="text-lg font-black text-white tracking-wide">
                    Tu progreso en la arena
                  </h2>
                  <p className="text-xs text-gray-400">
                    {progress.total > 0
                      ? `${progress.total} retos activos · ${progress.totalPoints} PTS en juego`
                      : "Aún no hay retos activos."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center md:text-right">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                    Resueltos
                  </div>
                  <div className="text-xl font-black text-[#00ff41]">
                    {progress.solvedCount}
                    <span className="text-gray-500 text-sm">
                      {" "}
                      / {progress.total}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                    Puntos
                  </div>
                  <div className="text-xl font-black text-white">
                    {progress.earnedPoints}
                    <span className="text-gray-500 text-sm">
                      {" "}
                      / {progress.totalPoints}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                    Ranking
                  </div>
                  <div className="text-xl font-black text-white">
                    {currentUser?.globalRank ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mt-5">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percent}
                aria-label="Retos resueltos"
                className="h-2 w-full rounded-full bg-black border border-[#00ff41]/20 overflow-hidden"
              >
                <div
                  className="h-full bg-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.6)] transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-gray-500 text-right">
                {progress.percent}% completado
              </div>
            </div>

            {/* Per-category progress chips (click to filter) */}
            {progress.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {progress.categories.map(([cat, { total, solved }]) => {
                  const style = catStyle(cat);
                  const active = category.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(active ? "" : cat)}
                      aria-pressed={active}
                      aria-label={`${cat}: ${solved} de ${total} resueltos`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        borderColor: `${style.color}${active ? "ff" : "50"}`,
                        backgroundColor: `${style.color}${active ? "30" : "12"}`,
                        color: style.color,
                      }}
                    >
                      {style.icon}
                      {cat}
                      <span className="font-mono text-gray-300">
                        {solved}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* Sidebars for mobile / tablet (< XL screen size) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:hidden mb-8">
            <CategorySidebarFilter
              category={category}
              difficulty={difficulty}
              onFilterChange={handleSidebarFilterChange}
            />
            <RecentChallengesScoreboard />
          </div>

          {/* ── Controls: search, status, sort ── */}
          <div className="bg-[#0a0a0a]/80 border border-[#00ff41]/20 rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  aria-label="Buscar retos"
                  placeholder="Buscar por título, descripción o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-[#00ff41]/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] transition-colors"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300">
                <span className="uppercase tracking-wider text-gray-400 font-bold">
                  Orden
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-black border border-[#00ff41]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#00ff41]/10">
              <div
                role="group"
                aria-label="Estado"
                className="flex items-center gap-2"
              >
                {STATUS_OPTIONS.map((o) => {
                  const active = status === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setStatus(o.key)}
                      aria-pressed={active}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                        active
                          ? "bg-[#00ff41] text-black font-bold shadow-[0_0_10px_rgba(0,255,65,0.4)]"
                          : "bg-black/60 border border-[#00ff41]/30 text-gray-300 hover:border-[#00ff41] hover:text-[#00ff41]"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span aria-live="polite">
                  Mostrando{" "}
                  <strong className="text-white">
                    {visibleChallenges.length}
                  </strong>{" "}
                  de {challenges.length}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#00ff41]/40 text-[#00ff41] hover:bg-[#00ff41]/10 transition-all"
                  >
                    <FilterX className="w-3.5 h-3.5" /> Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Cards Feed ── */}
          {loadError ? (
            <div
              role="alert"
              className="border border-red-500/40 rounded-2xl p-12 text-center bg-red-950/10"
            >
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p className="text-xl font-bold text-white">
                No se pudo cargar el catálogo
              </p>
              <p className="text-sm text-gray-400 mt-2 break-words">
                {loadError}
              </p>
              <button
                onClick={() => void loadLobby()}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
            </div>
          ) : challenges.length === 0 ? (
            <div className="border border-dashed border-[#00ff41]/20 rounded-2xl p-12 text-center bg-[#0a0a0a]/50">
              <Shield className="w-12 h-12 mx-auto mb-3 text-[#00ff41] animate-pulse" />
              <p className="text-xl font-bold text-white">
                Aún no hay retos disponibles
              </p>
              <p className="text-sm text-gray-400 mt-2">
                ¡Pronto van a llegar nuevos desafíos! Mantente atento.
              </p>
            </div>
          ) : visibleChallenges.length === 0 ? (
            <div className="border border-dashed border-[#00ff41]/20 rounded-2xl p-12 text-center bg-[#0a0a0a]/50">
              <FilterX className="w-12 h-12 mx-auto mb-3 text-[#00ff41]" />
              <p className="text-xl font-bold text-white">
                Ningún reto coincide con tus filtros
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
              >
                <FilterX className="w-4 h-4" /> Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visibleChallenges.map((ch, idx) => {
                const diff = diffStyle(ch.difficulty);
                const cat = catStyle(ch.category);

                return (
                  <motion.article
                    key={ch.id || ch.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 8) * 0.04 }}
                    className={`group border rounded-2xl p-5 bg-[#0a0a0a]/90 backdrop-blur flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
                      ch.is_solved
                        ? "border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.15)]"
                        : "border-[#00ff41]/20 hover:border-[#00ff41]/60 shadow-lg"
                    }`}
                  >
                    {/* Difficulty accent bar */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-full w-1"
                      style={{
                        backgroundColor: diff.color,
                        opacity: ch.is_solved ? 1 : 0.6,
                      }}
                    />

                    <div className="flex items-center justify-between gap-2 mb-3 pl-2">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider"
                        style={{
                          borderColor: `${cat.color}60`,
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                        {ch.category}
                      </div>

                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border"
                        style={{
                          borderColor: diff.border,
                          backgroundColor: diff.bg,
                          color: diff.color,
                        }}
                      >
                        {diff.icon}
                        {ch.difficulty}
                      </span>
                    </div>

                    <div className="mb-4 pl-2">
                      <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 flex items-center gap-2 group-hover:text-[#00ff41] transition-colors">
                        {ch.is_solved && (
                          <CheckCircle2
                            className="w-4 h-4 text-[#00ff41] shrink-0"
                            aria-label="Resuelto"
                          />
                        )}
                        {ch.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>

                    <div className="pt-3 pl-2 border-t border-[#00ff41]/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest">
                            Recompensa
                          </div>
                          <div className="text-base font-black text-white">
                            +{ch.points}{" "}
                            <span className="text-xs text-[#00ff41]">PTS</span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 text-[11px] text-gray-400"
                          title="Jugadores que lo resolvieron"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {ch.solves_count || 0}
                        </div>
                      </div>

                      <button
                        onClick={() => openChallenge(ch)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          ch.is_solved
                            ? "bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20"
                            : "bg-[#00ff41] text-black hover:bg-[#00ff41]/80 font-black shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                        }`}
                      >
                        {ch.is_solved ? "Ver reto" : "Lanzar reto"}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.article>
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedChallenge.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border-2 border-[#00ff41] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(0,255,65,0.2)] text-white relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">
                    {selectedChallenge.category} •{" "}
                    {selectedChallenge.difficulty}
                    {selectedChallenge.is_solved && " • RESUELTO"}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    {selectedChallenge.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  aria-label="Cerrar"
                  className="text-gray-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black/60 border border-[#00ff41]/20 rounded-xl p-4 mb-4 text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                {selectedChallenge.description}
              </div>

              {selectedChallenge.hints && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowHints((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-bold"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showHints ? "Ocultar pista" : "Ver pista"}
                  </button>
                  {showHints && (
                    <p className="mt-2 text-xs text-yellow-200/90 bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-3 leading-relaxed">
                      {selectedChallenge.hints}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-6 text-xs text-gray-400">
                <span>
                  Puntos otorgados:{" "}
                  <strong className="text-white">
                    +{selectedChallenge.points} PTS
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#00ff41]" />
                  Resoluciones globales:{" "}
                  <strong className="text-[#00ff41]">
                    {selectedChallenge.solves_count || 0}
                  </strong>
                </span>
              </div>

              {selectedChallenge.target_url &&
                (isLaunchableUrl(selectedChallenge.target_url) ? (
                  <a
                    href={selectedChallenge.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 flex items-center justify-between gap-3 p-3 bg-[#00ff41]/10 border border-[#00ff41] rounded-xl text-xs hover:bg-[#00ff41]/20 transition-all"
                  >
                    <span className="text-gray-300 truncate">
                      {selectedChallenge.target_url}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#00ff41] font-black shrink-0">
                      Abrir reto <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </a>
                ) : (
                  <p
                    role="status"
                    className="mb-6 p-3 text-xs text-yellow-200/90 bg-yellow-500/5 border border-yellow-500/30 rounded-xl"
                  >
                    El laboratorio de este reto aún no tiene una URL pública
                    configurada.
                  </p>
                ))}

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
                  Abrir laboratorio CTF <ChevronRight className="w-4 h-4" />
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
