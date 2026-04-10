import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Tag } from 'lucide-react';
import { NAV_ROUTES } from '../config/site';

const Home = () => {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 bg-background opacity-90">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(211,47,47,0.15),transparent_50%)]"></div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <Shield className="w-20 h-20 text-primary mx-auto opacity-90 drop-shadow-[0_0_15px_rgba(211,47,47,0.5)]" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl md:text-6xl font-bold text-heading mb-6 tracking-tight"
                >
                    {t('hero.title').split('. ').map((part, index) => (
                        <span key={index} className="block md:inline">
                            {part}.{' '}
                        </span>
                    ))}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-lg md:text-xl text-text-muted max-w-2xl mb-10"
                >
                    {t('hero.subtitle')}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <Link
                        to={NAV_ROUTES.contact}
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-background bg-primary rounded shadow-[0_0_15px_rgba(211,47,47,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(211,47,47,0.6)] hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10">{t('hero.cta')}</span>
                        <span className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                    </Link>
                </motion.div>

            </section>

            {/* UCN Collaboration Section */}
            <section className="relative z-10 container mx-auto px-4 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative rounded-2xl overflow-hidden border border-border bg-surface/40 backdrop-blur-sm"
                >
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                        {/* Left: UCN Image */}
                        <div className="relative min-h-[280px] md:min-h-[360px] overflow-hidden bg-surface/80 flex items-center justify-center">
                            <img
                                src="/images/ucn-colaboracion.jpg"
                                alt="Colaboración EclipSec — Academia de Ciberseguridad UCN"
                                className="w-[100%] h-[80%] object-contain drop-shadow-[0_0_20px_rgba(211,47,47,0.15)]"
                            />
                            {/* Subtle right-edge fade into card */}
                            <div className="hidden md:block absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface/60 to-transparent"></div>
                            {/* Bottom fade overlay for mobile */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface/60 to-transparent md:hidden"></div>
                        </div>

                        {/* Right: Text content */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                                <Tag className="w-3.5 h-3.5" />
                                {t('home.ucn.label')}
                            </span>

                            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-4 leading-tight">
                                {t('home.ucn.title')}
                            </h2>

                            <p className="text-text-muted leading-relaxed mb-6">
                                {t('home.ucn.subtitle')}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {(['tag1', 'tag2', 'tag3'] as const).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-accent font-medium"
                                    >
                                        {t(`home.ucn.${tag}`)}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </motion.div>
            </section>

            {/* Grid Pattern Overlay — fixed so it fills the full viewport */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 'var(--grid-opacity)', backgroundImage: 'linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
    );
};

export default Home;
