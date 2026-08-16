import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Terminal, User, Lock, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { loginAcademyUser, registerAcademyUser } from '../lib/ctfAcademy';
import { isLoggedIn } from '../services/auth';

type FormMode = 'login' | 'register';

const CTF = () => {
    const [mode, setMode] = useState<FormMode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn()) {
            navigate(NAV_ROUTES.ctfLobby, { replace: true });
        }
    }, [navigate]);

    // Force dark theme for CTF pages
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
        if (root) root.style.backgroundColor = '#050505';

        return () => {
            body.style.backgroundColor = origBodyBg;
            body.style.color = origBodyColor;
            html.style.backgroundColor = origHtmlBg;
            body.style.overflow = origOverflow;
            if (root) root.style.backgroundColor = origRootBg;
        };
    }, []);

    const clearForm = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMsg('');
    };

    const switchMode = (next: FormMode) => {
        clearForm();
        setMode(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!username.trim() || !password.trim()) {
            setError('Usuario y contraseña son requeridos.');
            return;
        }

        if (mode === 'register') {
            if (username.length < 3 || username.length > 24) {
                setError('El usuario debe tener entre 3 y 24 caracteres.');
                return;
            }
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
        }

        setLoading(true);

        try {
            const action = mode === 'login' ? loginAcademyUser : registerAcademyUser;
            const result = await action({ username: username.trim(), password });

            if (!result.ok) {
                setError(result.message);
                return;
            }

            setSuccessMsg(result.message);
            setTimeout(() => navigate(NAV_ROUTES.ctfLobby), 600);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#050505] text-[#00ff41] font-mono overflow-hidden relative flex flex-col items-center justify-center">
            {/* Cyber Grid Background */}
            <div
                className="fixed inset-0 z-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}
            />
            {/* Scanline Effect */}
            <div
                className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
                    backgroundSize: '100% 4px',
                }}
            />

            {/* Back link */}
            <Link
                to={NAV_ROUTES.home}
                className="absolute top-5 left-5 z-20 flex items-center gap-2 text-[#00ff41]/50 hover:text-[#00ff41] transition-colors text-xs border border-[#00ff41]/20 px-3 py-1.5 rounded"
            >
                <ArrowLeft className="w-3 h-3" /> BACK_TO_ECLIPSEC
            </Link>

            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-[#00ff41] rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.3)] mb-4">
                        <Shield className="w-7 h-7 text-[#00ff41]" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter text-white">
                        UCN <span className="text-[#00ff41]">CTF</span> ACADEMY
                    </h1>
                    <p className="text-[#00ff41]/50 text-[11px] mt-1 tracking-widest uppercase">
                        Secure Authentication Portal // EclipSec Infra
                    </p>
                </div>

                {/* Card */}
                <div className="border border-[#00ff41]/30 bg-black/70 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,65,0.07)]">
                    {/* Tab bar */}
                    <div className="flex border-b border-[#00ff41]/20">
                        {(['login', 'register'] as FormMode[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => switchMode(tab)}
                                className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
                                    mode === tab
                                        ? 'bg-[#00ff41]/10 text-[#00ff41] border-b-2 border-[#00ff41]'
                                        : 'text-[#00ff41]/40 hover:text-[#00ff41]/70'
                                }`}
                            >
                                {tab === 'login' ? (
                                    <><Terminal className="w-3 h-3" /> Login</>
                                ) : (
                                    <><UserPlus className="w-3 h-3" /> Register</>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={mode}
                                initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {/* Username */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff41]/40" />
                                        <input
                                            id="ctf-username"
                                            type="text"
                                            autoComplete="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={loading}
                                            placeholder="operator_handle"
                                            className="w-full bg-black/60 border border-[#00ff41]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#00ff41]/20 focus:outline-none focus:border-[#00ff41]/60 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff41]/40" />
                                        <input
                                            id="ctf-password"
                                            type="password"
                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            placeholder="••••••••"
                                            className="w-full bg-black/60 border border-[#00ff41]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#00ff41]/20 focus:outline-none focus:border-[#00ff41]/60 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password (register only) */}
                                <AnimatePresence>
                                    {mode === 'register' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-1.5 overflow-hidden"
                                        >
                                            <label className="text-[10px] text-[#00ff41]/60 uppercase tracking-widest">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff41]/40" />
                                                <input
                                                    id="ctf-confirm-password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    disabled={loading}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/60 border border-[#00ff41]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#00ff41]/20 focus:outline-none focus:border-[#00ff41]/60 focus:shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-all disabled:opacity-50"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                            <span className="text-red-400 text-xs leading-relaxed">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Success message */}
                                <AnimatePresence>
                                    {successMsg && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-start gap-2 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg p-3"
                                        >
                                            <span className="text-[#00ff41] text-xs leading-relaxed">{successMsg}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <button
                                    id="ctf-submit"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#00ff41]/10 border border-[#00ff41]/40 hover:bg-[#00ff41]/20 hover:border-[#00ff41]/70 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] text-[#00ff41] font-bold py-3 rounded-lg text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                    ) : mode === 'login' ? (
                                        '[ AUTHENTICATE ]'
                                    ) : (
                                        '[ REGISTER ]'
                                    )}
                                </button>
                            </motion.form>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[#00ff41]/25 text-[10px] mt-4 tracking-widest uppercase">
                    © {new Date().getFullYear()} EclipSec // UCN Hacking Academy
                </p>
            </motion.div>
        </div>
    );
};

export default CTF;
