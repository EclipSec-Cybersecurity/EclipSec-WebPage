import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Home = () => {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 bg-background opacity-90">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(211,47,47,0.15),transparent_50%)]"></div>
            </div>

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
                    className="text-lg md:text-xl text-textMuted max-w-2xl mb-10"
                >
                    {t('hero.subtitle')}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <Link
                        to="/contacto"
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-background bg-primary rounded shadow-[0_0_15px_rgba(211,47,47,0.4)] transition-all hover:bg-primaryHover hover:shadow-[0_0_25px_rgba(211,47,47,0.6)] hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10">{t('hero.cta')}</span>
                        <span className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                    </Link>
                </motion.div>

            </section>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
    );
};

export default Home;
