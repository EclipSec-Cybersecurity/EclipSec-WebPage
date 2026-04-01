import React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, Globe, Code, Key, Search,
    Server, Bug, ChevronRight, Zap, Skull, AlertTriangle,
    Wifi, WifiOff
} from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import {
    sortedChallenges as importedChallenges,
    type Difficulty, type Category
} from '../config/challenges';

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

const sortedChallenges = importedChallenges;

const CTFChallenges = () => {
    const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
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

    const filtered = filter === 'ALL' ? sortedChallenges : sortedChallenges.filter(c => c.category === filter);
    const categories: (Category | 'ALL')[] = ['ALL', 'WEB', 'CRYPTO', 'FORENSICS', 'PWN', 'MISC'];

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
                                {filtered.length} CHALLENGES LOADED // {filtered.reduce((acc, c) => acc + c.points, 0)} TOTAL POINTS
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={NAV_ROUTES.ctf}
                            className="flex items-center gap-2 text-[#00ff41]/60 hover:text-[#00ff41] transition-colors border border-[#00ff41]/20 px-3 py-1 rounded text-xs"
                        >
                            <ArrowLeft className="w-3 h-3" /> BACK_TO_CTF
                        </Link>
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#00ff41]/40">
                            <Server className="w-3 h-3" /> NODE: UCN_COQUIMBO
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

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.03 }}
                                onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                                className="border rounded-lg cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(0,255,65,0.08)]"
                                style={{
                                    borderColor: isExpanded ? diff.border : 'rgba(0,255,65,0.12)',
                                    backgroundColor: isExpanded ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
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
                                                <span>AUTHOR: {challenge.author}</span>
                                                <span>ID: {challenge.id.toUpperCase()}</span>
                                                <span>{challenge.solves} OPERATIVES CLEARED</span>
                                            </div>
                                            <button
                                                className="mt-1 px-4 py-2 rounded text-xs font-bold border transition-all hover:shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                                                style={{
                                                    borderColor: diff.color,
                                                    color: '#050505',
                                                    backgroundColor: diff.color,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateTo(`/ctf/challenge/${challenge.id}`);
                                                }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {challenge.active ? (
                                                        <><Wifi className="w-3 h-3" /> ACCESS_CHALLENGE</>
                                                    ) : (
                                                        <><WifiOff className="w-3 h-3" /> OFFLINE</>
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
                    <span>© {new Date().getFullYear()} ECLIPSEC // UCN HACKING ACADEMY</span>
                    <span className="text-[#00ff41]">COQUIMBO_CHILE</span>
                </div>
            </div>
        </div>
    );
};

export default CTFChallenges;
