import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Shield, Cpu, Globe, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { NAV_ROUTES } from '../config/site';

const CTF = () => {
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();
    const terminalRef = useRef<HTMLDivElement>(null);

    const initialLines = [
        'Connecting to UCN Hacking Academy CTF...',
        'Authorization required...',
        'System: EclipSec Secure Node initialized.',
        'Welcome, Operator.',
        'Type "help" to see available commands or "join" to enter the competition.'
    ];

    // Force body/html styles for CTF page to prevent global CSS conflicts
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
        body.style.overflow = 'hidden';
        if (root) {
            root.style.backgroundColor = '#050505';
        }

        return () => {
            body.style.backgroundColor = origBodyBg;
            body.style.color = origBodyColor;
            html.style.backgroundColor = origHtmlBg;
            body.style.overflow = origOverflow;
            if (root) {
                root.style.backgroundColor = origRootBg;
            }
        };
    }, []);

    useEffect(() => {
        let currentLine = 0;
        const interval = setInterval(() => {
            if (currentLine < initialLines.length) {
                const idx = currentLine;
                currentLine++;
                setTerminalLines(prev => [...prev, initialLines[idx]]);
            } else {
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLines]);

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = inputValue.toLowerCase().trim();
        let response = '';

        if (cmd === 'help') {
            response = 'Available commands: help, join, info, status, challenges, clear';
        } else if (cmd === 'join') {
            response = 'Redirecting to Challenge Database... [ACCESS GRANTED]';
            setTimeout(() => navigate(NAV_ROUTES.ctfChallenges), 800);
        } else if (cmd === 'challenges') {
            response = 'Loading challenge database...';
            setTimeout(() => navigate(NAV_ROUTES.ctfChallenges), 600);
        } else if (cmd === 'info') {
            response = 'UCN Hacking Academy CTF - Hosted by EclipSec. Challenge your skills in Web, Crypto, Pwn and Forensics.';
        } else if (cmd === 'status') {
            response = 'Competition: ACTIVE | Participants: 124 | Top Score: 4500 pts';
        } else if (cmd === 'clear') {
            setTerminalLines([]);
            setInputValue('');
            return;
        } else if (cmd !== '') {
            response = `Command not found: ${cmd}`;
        }

        if (cmd !== '') {
            setTerminalLines(prev => [...prev, `> ${inputValue}`, response]);
        }
        setInputValue('');
    };

    return (
        <div className="h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black overflow-hidden relative flex flex-col">
            {/* Cyber Grid Background */}
            <div className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}>
            </div>

            {/* Scanline Effect */}
            <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
                    backgroundSize: '100% 4px'
                }}>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-4 py-4 w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/30 pb-3 mb-4 shrink-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_#00ff41]">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">
                                UCN <span className="text-white">CTF</span> ACADEMY
                            </h1>
                            <p className="text-[#00ff41]/70 text-xs">SECURE ENVIRONMENT // ECLIPSEC_INFRA</p>
                        </div>
                    </div>
                    <div className="flex gap-4 text-sm items-center">
                        <Link
                            to={NAV_ROUTES.home}
                            className="flex items-center gap-2 text-[#00ff41]/60 hover:text-[#00ff41] transition-colors border border-[#00ff41]/20 px-3 py-1 rounded text-xs"
                        >
                            <ArrowLeft className="w-3 h-3" /> BACK_TO_ECLIPSEC
                        </Link>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[#00ff41]/50 uppercase text-[10px]">System Status</span>
                            <span className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse"></span>
                                OPERATIONS_ACTIVE
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Grid - fills remaining space */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                    {/* Terminal Area */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 border border-[#00ff41]/40 bg-black/80 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.1)] flex flex-col"
                    >
                        <div className="bg-[#00ff41]/10 px-4 py-2 flex items-center justify-between border-b border-[#00ff41]/20 shrink-0">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <span className="text-xs font-bold tracking-widest opacity-80 flex items-center gap-2">
                                <Terminal className="w-3 h-3" /> SESSION: TTY_S001
                            </span>
                        </div>
                        <div
                            ref={terminalRef}
                            className="p-4 overflow-y-auto flex-1 flex flex-col gap-1 text-sm"
                        >
                            {terminalLines.filter(Boolean).map((line, index) => (
                                <div key={index} className={line.startsWith('> ') ? "text-white mt-1" : "text-[#00ff41] opacity-90"}>
                                    {line}
                                </div>
                            ))}
                            <form onSubmit={handleCommand} className="mt-1 flex items-center gap-2">
                                <span className="text-white font-bold opacity-80">&gt;</span>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="bg-transparent border-none outline-none flex-grow text-white caret-[#00ff41] font-mono"
                                    autoComplete="off"
                                />
                            </form>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
                        {/* Challenge Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-black/40 border border-[#00ff41]/20 p-4 rounded-xl flex-1"
                        >
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                                <Cpu className="w-4 h-4 text-[#00ff41]" /> CHALLENGE_STATS
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'NETWORK_FW', pct: 85 },
                                    { name: 'WEB_EXPLOIT', pct: 42 },
                                    { name: 'CRYPTOGRAPHY', pct: 12 },
                                    { name: 'FORENSICS', pct: 67 },
                                ].map(ch => (
                                    <div key={ch.name}>
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span>{ch.name}</span>
                                            <span>{ch.pct}% COMPLETED</span>
                                        </div>
                                        <div className="w-full h-1 bg-[#00ff41]/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#00ff41] shadow-[0_0_10px_#00ff41] transition-all duration-1000" style={{ width: `${ch.pct}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Join Academy */}
                        <Link to={NAV_ROUTES.ctfChallenges} className="block">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-[#00ff41]/5 border border-[#00ff41]/20 p-4 rounded-xl hover:bg-[#00ff41]/10 transition-colors cursor-pointer group"
                            >
                                <h3 className="text-white font-bold mb-1 flex items-center gap-2 uppercase text-sm">
                                    <Globe className="w-4 h-4 text-[#00ff41]" /> Challenges
                                </h3>
                                <p className="text-[10px] text-[#00ff41]/60 mb-2">
                                    Accede al listado de desafíos y pon a prueba tus habilidades.
                                </p>
                                <div className="flex items-center text-xs font-bold group-hover:translate-x-2 transition-transform">
                                    ENTER_DATABASE <ChevronRight className="w-3 h-3" />
                                </div>
                            </motion.div>
                        </Link>

                        {/* Security Notice */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="p-3 rounded-xl border border-dashed border-[#00ff41]/30"
                        >
                            <div className="flex items-center gap-2 text-[#00ff41]/40">
                                <Lock className="w-4 h-4 shrink-0" />
                                <span className="text-[9px] leading-tight">
                                    ALL DATA IS ENCRYPTED AND PROTECTED UNDER UCN ACADEMIC SECURITY PROTOCOLS. HOSTED BY ECLIPSEC.
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-[#00ff41]/10 flex flex-wrap justify-between items-center text-[9px] text-[#00ff41]/40 uppercase tracking-[0.15em] shrink-0">
                    <span>© {new Date().getFullYear()} ECLIPSEC // UCN HACKING ACADEMY</span>
                    <div className="flex gap-6">
                        <span>LAT: -23.6452</span>
                        <span>LONG: -70.3953</span>
                        <span className="text-[#00ff41]">COQUIMBO_CHILE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CTF;
