import React, { useEffect, useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, Globe, Terminal, Key, Search, Code, Bug,
    Lock, Zap, Skull, AlertTriangle, Copy, Check,
    ExternalLink, Download, Send, WifiOff, RefreshCw,
    Lightbulb, ChevronRight, Eye,
    SplitSquareHorizontal, Monitor
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import {
    challenges,
    type Challenge, type Difficulty, type Category,
    CTF_SERVER,
} from '../config/challenges';

/* Lazy-load WebTerminal para no bloquear el bundle principal */
const WebTerminal = lazy(() => import('../components/WebTerminal'));

/* ── Configs ─────────────────────────────────────────────────────── */

const DIFF: Record<Difficulty, { color: string; border: string; icon: React.ReactNode; label: string }> = {
    EASY: { color: '#00ff41', border: 'rgba(0,255,65,0.3)', icon: <Zap className="w-3 h-3" />, label: 'EASY' },
    MEDIUM: { color: '#ffbb00', border: 'rgba(255,187,0,0.3)', icon: <AlertTriangle className="w-3 h-3" />, label: 'MEDIUM' },
    HARD: { color: '#ff4444', border: 'rgba(255,68,68,0.3)', icon: <Skull className="w-3 h-3" />, label: 'HARD' },
    INSANE: { color: '#cc00ff', border: 'rgba(204,0,255,0.3)', icon: <Skull className="w-3 h-3" />, label: 'INSANE' },
};

const CAT_ICONS: Record<Category, React.ReactNode> = {
    WEB: <Globe className="w-4 h-4" />,
    CRYPTO: <Key className="w-4 h-4" />,
    FORENSICS: <Search className="w-4 h-4" />,
    PWN: <Bug className="w-4 h-4" />,
    MISC: <Code className="w-4 h-4" />,
};

/* ── Layout modes ────────────────────────────────────────────────── */
type ViewMode = 'split' | 'terminal' | 'challenge';

/* ── WebChallengePanel ──────────────────────────────────────────── */
/** Embebe el reto en un iframe a pantalla completa.
 *  Siempre muestra el botón "Abrir en nueva pestaña" en la barra superior.
 *  Solo muestra el overlay de error si hay un fallo de red real (no X-Frame-Options,
 *  que el browser maneja silenciosamente y no se puede detectar de forma fiable).
 */
const WebChallengePanel = ({ url, title }: { url: string; title: string }) => {
    const [loadErr, setLoadErr] = useState(false);
    const [loading, setLoading] = useState(true);

    return (
        <div className="absolute inset-0 flex flex-col">
            {/* Barra superior — siempre visible */}
            <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-black/80 border-b border-[#00ff41]/15">
                <div className="flex items-center gap-2 min-w-0">
                    {loading && !loadErr && (
                        <RefreshCw className="w-3 h-3 animate-spin text-yellow-400 shrink-0" />
                    )}
                    <span className="text-[9px] text-[#00ff41]/40 font-mono truncate">{url}</span>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[#00ff41]/60 hover:text-[#00ff41] border border-[#00ff41]/20 px-2 py-0.5 rounded hover:bg-[#00ff41]/10 transition-colors shrink-0 ml-2 whitespace-nowrap">
                    <ExternalLink className="w-3 h-3" /> Nueva pestaña
                </a>
            </div>

            {/* iframe a pantalla completa */}
            <div className="flex-1 relative">
                {!loadErr ? (
                    <iframe
                        key={url}
                        src={url}
                        title={title}
                        className="absolute inset-0 w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads allow-modals"
                        referrerPolicy="no-referrer"
                        onLoad={() => setLoading(false)}
                        onError={() => { setLoading(false); setLoadErr(true); }}
                    />
                ) : (
                    /* Error de red real (servidor no disponible) */
                    <div className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-center gap-4 text-center p-8">
                        <WifiOff className="w-10 h-10 text-red-400/60" />
                        <div>
                            <p className="text-white font-bold text-sm mb-1">Servidor no disponible</p>
                            <p className="text-[#00ff41]/50 text-[11px] max-w-xs leading-relaxed">
                                No se puede conectar a <code className="text-yellow-400">{url}</code>.
                                Verifica que el contenedor Docker esté corriendo.
                            </p>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm border-2 border-[#00ff41] bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 transition-all">
                            <ExternalLink className="w-4 h-4" /> Intentar en nueva pestaña
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════════
   Main page
   ══════════════════════════════════════════════════════════════════ */
const CTFChallengeLab = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const navigate = useNavigate();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [connState, setConnState] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [flagInput, setFlagInput] = useState('');
    const [flagResult, setFlagResult] = useState<'correct' | 'wrong' | null>(null);
    const [copied, setCopied] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [revealedHints, setRevealedHints] = useState<number[]>([]);
    const [termKey, setTermKey] = useState(0);   // fuerza re-mount al reconectar
    // iframeRef moved into WebChallengePanel

    /* ── Force dark CTF styles ──────────────────────────────────── */
    useEffect(() => {
        const b = document.body, h = document.documentElement, r = document.getElementById('root');
        const ob = b.style.backgroundColor, oc = b.style.color, oh = h.style.backgroundColor, or = r?.style.backgroundColor ?? '';
        b.style.backgroundColor = '#050505'; b.style.color = '#00ff41';
        h.style.backgroundColor = '#050505';
        if (r) r.style.backgroundColor = '#050505';
        return () => { b.style.backgroundColor = ob; b.style.color = oc; h.style.backgroundColor = oh; if (r) r.style.backgroundColor = or; };
    }, []);

    /* ── Find challenge ─────────────────────────────────────────── */
    useEffect(() => {
        const found = challenges.find(c => c.id === challengeId);
        if (!found) { navigate(NAV_ROUTES.ctfChallenges); return; }
        setChallenge(found);

        // Si no tiene terminal, forzamos vista de 'challenge' para ocupar todo el ancho
        if (!found.connection.wsPort) {
            setViewMode('challenge');
        }

        setTimeout(() => setConnState(found.active ? 'connected' : 'error'), 1200);
    }, [challengeId, navigate]);

    /* ── Helpers ────────────────────────────────────────────────── */
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const challengeUrl = (ch: Challenge) => ch.connection.url || `http://${ch.connection.host}:${ch.connection.port}`;

    const connectionCmd = (ch: Challenge): string => {
        switch (ch.connection.type) {
            case 'nc': return `nc ${ch.connection.host} ${ch.connection.port}`;
            case 'ssh': {
                const user = ch.connection.extra?.match(/user:\s*(\S+)/)?.[1] ?? 'user';
                return `ssh ${user}@${ch.connection.host} -p ${ch.connection.port}`;
            }
            case 'web': return challengeUrl(ch);
            case 'file': return `wget ${challengeUrl(ch)}${ch.connection.extra ?? ''}`;
        }
    };

    const wsUrl = (ch: Challenge) =>
        ch.connection.wsPort
            ? `ws://${ch.connection.host}:${ch.connection.wsPort}/ws`
            : null;

    const handleFlag = (e: React.FormEvent) => {
        e.preventDefault();
        const input = flagInput.trim();
        if (!challenge || !input) return;

        if (challenge.flag && input === challenge.flag) {
            setFlagResult('correct');
        } else {
            setFlagResult('wrong');
        }

        setTimeout(() => setFlagResult(null), 3000);
    };

    /* ── Loading state ──────────────────────────────────────────── */
    if (!challenge) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-[#00ff41]">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm">LOADING CHALLENGE DATA...</span>
                </motion.div>
            </div>
        );
    }

    const diff = DIFF[challenge.difficulty];
    const hasTerminal = !!challenge.connection.wsPort;
    const cmd = connectionCmd(challenge);
    const ws = wsUrl(challenge);

    /* ── Page ───────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black flex flex-col">

            {/* Grid bg */}
            <div className="fixed inset-0 z-0 opacity-[0.035] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#00ff41 1px,transparent 1px),linear-gradient(90deg,#00ff41 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
            {/* Scanlines */}
            <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: 'linear-gradient(transparent 50%,rgba(0,0,0,.4) 50%)', backgroundSize: '100% 4px' }} />

            <div className="relative z-10 flex flex-col flex-1 px-4 py-3 max-w-full">

                {/* ═══════════════════════ Header ═══════════════════════ */}
                <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/25 pb-3 mb-4 gap-4 shrink-0">

                    {/* Left: title */}
                    <div className="flex items-center gap-4">
                        <Link to={NAV_ROUTES.ctfChallenges}
                            className="group p-2 rounded-lg border border-[#00ff41]/20 hover:bg-[#00ff41]/10 transition-all">
                            <ArrowLeft className="w-5 h-5 text-[#00ff41]/60 group-hover:text-[#00ff41]" />
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 border-2 rounded-lg bg-black"
                                style={{ borderColor: diff.color, boxShadow: `0 0 15px ${diff.color}33` }}>
                                <Shield className="w-6 h-6" style={{ color: diff.color }} />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-black italic tracking-wide text-white flex items-center gap-2">
                                    <span className="opacity-20 text-xs not-italic font-mono">CHLG //</span> {challenge.title}
                                </h1>
                                <div className="flex items-center gap-4 text-[10px] mt-1 uppercase tracking-widest font-bold">
                                    <span className="flex items-center gap-1.5" style={{ color: diff.color }}>
                                        {diff.icon} {diff.label}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-white/40">
                                        {CAT_ICONS[challenge.category]} {challenge.category}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-sm bg-[#00ff41]/10 border border-[#00ff41]/20 text-[#00ff41]">
                                        {challenge.points} PTS
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-3">
                        {/* Connection status */}
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/40 text-[10px] font-black tracking-widest ${connState === 'connected' ? 'border-[#00ff41]/30 text-[#00ff41]' :
                            connState === 'error' ? 'border-red-500/30 text-red-500' :
                                'border-yellow-500/30 text-yellow-500'
                            }`}>
                            {connState === 'connected' && <><div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" /> TARGET ONLINE</>}
                            {connState === 'error' && <><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> TARGET OFFLINE</>}
                            {connState === 'connecting' && <><RefreshCw className="w-3 h-3 animate-spin" /> ESTABLISHING LINK...</>}
                        </div>

                        {/* View-mode toggles — solo si hay terminal */}
                        {hasTerminal && connState === 'connected' && (
                            <div className="flex items-center bg-black/40 border border-[#00ff41]/20 rounded-lg p-1">
                                {([
                                    { mode: 'challenge' as ViewMode, icon: <Monitor className="w-3.5 h-3.5" />, label: 'RETO' },
                                    { mode: 'split' as ViewMode, icon: <SplitSquareHorizontal className="w-3.5 h-3.5" />, label: 'SPLIT' },
                                    { mode: 'terminal' as ViewMode, icon: <Terminal className="w-3.5 h-3.5" />, label: 'SHELL' },
                                ] as const).map(({ mode, icon, label }) => (
                                    <button key={mode} onClick={() => setViewMode(mode)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewMode === mode
                                            ? 'bg-[#00ff41] text-black shadow-[0_0_10px_#00ff4166]'
                                            : 'text-[#00ff41]/40 hover:text-[#00ff41] hover:bg-[#00ff41]/5'
                                            }`}>
                                        {icon} {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.header>

                {/* ═════════════════════ Body grid ══════════════════════ */}
                <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

                    {/* ── Challenge panel ── */}
                    {(viewMode === 'challenge' || viewMode === 'split') && (
                        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`flex flex-col ${viewMode === 'split' ? 'flex-1' : 'flex-[3]'} min-w-0`}>

                            {/* Window chrome */}
                            <div className="flex flex-col flex-1 border border-[#00ff41]/25 bg-black/80 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.05)]">
                                {/* Title bar */}
                                <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#00ff41]/[0.06] border-b border-[#00ff41]/15">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest opacity-60 flex items-center gap-1.5 ml-1">
                                            {challenge.connection.type === 'web' && <><Globe className="w-2.5 h-2.5" /> WEB_CHALLENGE</>}
                                            {challenge.connection.type === 'nc' && <><Terminal className="w-2.5 h-2.5" /> NC_CHALLENGE</>}
                                            {challenge.connection.type === 'ssh' && <><Terminal className="w-2.5 h-2.5" /> SSH_CHALLENGE</>}
                                            {challenge.connection.type === 'file' && <><Download className="w-2.5 h-2.5" /> FILE_CHALLENGE</>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-[#00ff41]/40">
                                        <span>{challenge.connection.host}:{challenge.connection.port}</span>
                                        {challenge.connection.type === 'web' && (
                                            <a href={challengeUrl(challenge)} target="_blank" rel="noopener noreferrer"
                                                className="p-1 rounded hover:bg-[#00ff41]/10 transition-colors text-[#00ff41]/50 hover:text-[#00ff41]">
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Content area */}
                                <div className="flex-1 relative overflow-hidden">
                                    {/* ─ Connecting overlay ─ */}
                                    {connState === 'connecting' && (
                                        <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-8 h-8 animate-spin text-[#00ff41]" />
                                            <p className="text-sm text-[#00ff41]">Conectando al contenedor...</p>
                                            <p className="text-[10px] text-[#00ff41]/50">{challenge.connection.host}:{challenge.connection.port}</p>
                                        </div>
                                    )}

                                    {/* ─ Offline state ─ */}
                                    {connState === 'error' && (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                                            <WifiOff className="w-12 h-12 text-red-400" />
                                            <div>
                                                <h3 className="text-red-400 font-bold text-base mb-1">CONTAINER OFFLINE</h3>
                                                <p className="text-[#00ff41]/40 text-xs max-w-sm">
                                                    El contenedor no está disponible. Asegúrate de que Docker esté corriendo en el servidor.
                                                </p>
                                            </div>
                                            <button onClick={() => { setConnState('connecting'); setTimeout(() => setConnState(challenge.active ? 'connected' : 'error'), 1200); }}
                                                className="flex items-center gap-2 px-4 py-2 border border-[#00ff41]/30 rounded text-xs hover:bg-[#00ff41]/10 transition-colors">
                                                <RefreshCw className="w-3 h-3" /> RETRY
                                            </button>
                                        </div>
                                    )}

                                    {/* ─ WEB: iframe + fallback ─ */}
                                    {connState === 'connected' && challenge.connection.type === 'web' && (
                                        <WebChallengePanel url={challengeUrl(challenge)} title={challenge.title} />
                                    )}

                                    {/* ─ NC / SSH: connection info ─ */}
                                    {connState === 'connected' && (challenge.connection.type === 'nc' || challenge.connection.type === 'ssh') && (
                                        <div className="h-full overflow-y-auto p-6">
                                            <pre className="text-[#00ff41]/20 text-[8px] leading-tight mb-6 select-none hidden md:block">{`
 ╔══════════════════════════════════════════════╗
 ║   REMOTE SHELL CHALLENGE                    ║
 ║   Usa la terminal de la derecha  →          ║
 ╚══════════════════════════════════════════════╝`}</pre>

                                            <label className="text-[10px] text-[#00ff41]/50 uppercase tracking-wider mb-2 block">
                                                {challenge.connection.type === 'nc' ? '// NETCAT' : '// SSH'}
                                            </label>
                                            <div className="flex items-center gap-2 bg-black/60 border border-[#00ff41]/30 rounded-lg p-3 mb-5 hover:border-[#00ff41]/60 transition-colors group">
                                                <span className="text-[#00ff41]/40 select-none">$</span>
                                                <code className="flex-1 text-white text-sm font-bold">{cmd}</code>
                                                <button onClick={() => copy(cmd)}
                                                    className="p-1.5 rounded border border-[#00ff41]/20 hover:bg-[#00ff41]/10 transition-all shrink-0">
                                                    {copied ? <Check className="w-3.5 h-3.5 text-[#00ff41]" /> : <Copy className="w-3.5 h-3.5 text-[#00ff41]/50" />}
                                                </button>
                                            </div>

                                            {challenge.connection.type === 'ssh' && challenge.connection.extra && (
                                                <div className="mb-5">
                                                    <label className="text-[10px] text-[#00ff41]/50 uppercase tracking-wider mb-2 block">// CREDENCIALES</label>
                                                    <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
                                                        <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                                        <code className="text-yellow-300 text-sm font-bold">{challenge.connection.extra}</code>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stats grid */}
                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                {[
                                                    { label: 'HOST', value: challenge.connection.host },
                                                    { label: 'PORT', value: String(challenge.connection.port) },
                                                    { label: 'PROTOCOL', value: challenge.connection.type.toUpperCase() },
                                                    { label: 'TERMINAL', value: ws ? `WS :${challenge.connection.wsPort}` : 'N/A' },
                                                ].map(({ label, value }) => (
                                                    <div key={label} className="bg-black/40 border border-[#00ff41]/10 rounded-lg p-3">
                                                        <div className="text-[9px] text-[#00ff41]/40 uppercase tracking-wider mb-0.5">{label}</div>
                                                        <div className="text-white text-xs font-bold">{value}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {hasTerminal && (
                                                <div className="bg-[#00ff41]/5 border border-dashed border-[#00ff41]/20 rounded-lg p-4 text-[11px] text-[#00ff41]/60">
                                                    <p className="font-bold text-[#00ff41] mb-1">💡 Tip</p>
                                                    Usa la terminal de la derecha para conectarte directamente al contenedor.
                                                    La terminal Linux real está embebida — ¡sin salir de esta página!
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ─ FILE: download ─ */}
                                    {connState === 'connected' && challenge.connection.type === 'file' && (
                                        <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
                                            <a href={`${challengeUrl(challenge)}${challenge.connection.extra ?? ''}`} download
                                                className="flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-sm border-2 transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] hover:scale-105"
                                                style={{ borderColor: diff.color, color: '#050505', backgroundColor: diff.color }}>
                                                <Download className="w-5 h-5" />
                                                DESCARGAR ARCHIVO
                                            </a>
                                            <div className="flex items-center gap-2 bg-black/60 border border-[#00ff41]/30 rounded-lg p-3 w-full max-w-sm">
                                                <span className="text-[#00ff41]/40 select-none text-xs">$</span>
                                                <code className="flex-1 text-white text-xs truncate">{cmd}</code>
                                                <button onClick={() => copy(cmd)} className="p-1 rounded border border-[#00ff41]/20 hover:bg-[#00ff41]/10 shrink-0">
                                                    {copied ? <Check className="w-3 h-3 text-[#00ff41]" /> : <Copy className="w-3 h-3 text-[#00ff41]/50" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Terminal panel ─────────────────────────────── */}
                    {hasTerminal && connState === 'connected' && (viewMode === 'terminal' || viewMode === 'split') && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'flex-1'} min-w-0`}>
                            <Suspense fallback={
                                <div className="flex-1 bg-[#050505] border border-[#00ff41]/25 rounded-xl flex items-center justify-center text-[#00ff41]/50 text-sm">
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Cargando terminal...
                                </div>
                            }>
                                <WebTerminal
                                    key={termKey}
                                    wsUrl={ws!}
                                    height={undefined}   /* let flex take over */
                                    className="flex-1"
                                />
                            </Suspense>

                            {/* Reconnect terminal */}
                            <button onClick={() => setTermKey(k => k + 1)}
                                className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#00ff41]/30 hover:text-[#00ff41]/60 transition-colors py-1">
                                <RefreshCw className="w-3 h-3" /> Reconectar terminal
                            </button>
                        </motion.div>
                    )}

                    {/* ── Sidebar ── */}
                    <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="w-72 md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">

                        {/* Briefing Card */}
                        <div className="bg-black/40 border border-[#00ff41]/20 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <h3 className="text-white font-black text-[10px] flex items-center gap-2 mb-4 uppercase tracking-[0.2em] border-l-2 border-[#00ff41] pl-3">
                                Briefing_Report
                            </h3>
                            <p className="text-[#00ff41]/80 text-[12px] leading-relaxed mb-4 italic">
                                "{challenge.description}"
                            </p>

                            <div className="space-y-2 pt-4 border-t border-[#00ff41]/10 text-[10px] font-mono">
                                {[
                                    ['OPERATIVE', challenge.author],
                                    ['SOLVES', String(challenge.solves)],
                                    ['CHLG_ID', challenge.id.toUpperCase()],
                                    ...(challenge.flagFormat ? [['FORMAT', challenge.flagFormat]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center gap-4">
                                        <span className="text-[#00ff41]/40">{k}:</span>
                                        <span className="text-white bg-[#00ff41]/5 px-1.5 py-0.5 rounded border border-[#00ff41]/10">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Card */}
                        <div className="bg-black/60 border border-[#00ff41]/30 rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,65,0.05)]">
                            <h3 className="text-[#00ff41] font-black text-[10px] flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
                                <Lock className="w-3.5 h-3.5" /> Submit_Nexus
                            </h3>
                            <form onSubmit={handleFlag} className="space-y-3">
                                <div className="relative">
                                    <input type="text" value={flagInput} onChange={e => setFlagInput(e.target.value)}
                                        placeholder="EclipSec{...}"
                                        className="w-full bg-black border border-[#00ff41]/20 rounded-lg px-4 py-3 text-xs text-white font-mono placeholder:text-[#00ff41]/20 focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41]/30 transition-all" />
                                </div>
                                <button type="submit"
                                    className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest bg-[#00ff41] text-black hover:bg-[#00ff41]/90 transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                                    <Send className="w-4 h-4" /> Validar Flag
                                </button>
                            </form>
                            <AnimatePresence>
                                {flagResult && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        className={`mt-3 p-3 rounded-lg text-[10px] font-black tracking-wider text-center border ${flagResult === 'correct'
                                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                                            }`}>
                                        {flagResult === 'correct' ? '>> ACCESS GRANTED <<' : '>> AUTH_FAILURE <<'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Hints Card */}
                        {challenge.hints && challenge.hints.length > 0 && (
                            <div className="bg-[#1a1500]/40 border border-yellow-500/20 rounded-xl p-5">
                                <button onClick={() => setShowHints(!showHints)}
                                    className="w-full flex items-center justify-between text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4" /> Intel_Hints
                                    </span>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showHints ? 'rotate-90' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showHints && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-3 overflow-hidden">
                                            {challenge.hints.map((hint, i) => (
                                                revealedHints.includes(i)
                                                    ? <div key={i} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-[11px] text-yellow-200/70 border-l-4">
                                                        {hint}
                                                    </div>
                                                    : <button key={i} onClick={() => setRevealedHints(p => [...p, i])}
                                                        className="w-full flex items-center justify-between bg-yellow-500/10 border border-dashed border-yellow-500/30 rounded-lg p-3 text-[10px] text-yellow-500 font-bold hover:bg-yellow-500/20 transition-all">
                                                        <span>REVEAL_HINT #{i + 1}</span>
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Status bar */}
                        <div className="mt-auto pt-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-[#00ff41]/10 text-[8px] font-mono whitespace-nowrap overflow-hidden">
                                <span className="text-[#00ff41]/40 uppercase">System_Link</span>
                                <span className="text-white truncate ml-2 tracking-tighter">{CTF_SERVER.host}:{challenge.connection.port}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-[#00ff41]/10 text-[8px] font-mono">
                                <span className="text-[#00ff41]/40 uppercase">Encryption</span>
                                <span className="text-white">AES-256 / SHA-2</span>
                            </div>
                        </div>
                    </motion.aside>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-[#00ff41]/10 flex justify-between items-center text-[9px] text-[#00ff41]/30 uppercase tracking-widest shrink-0">
                    <span>© {new Date().getFullYear()} ECLIPSEC // UCN HACKING ACADEMY</span>
                    <span>COQUIMBO_CHILE</span>
                </div>
            </div>
        </div>
    );
};

export default CTFChallengeLab;
