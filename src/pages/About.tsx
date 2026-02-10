import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, HeartHandshake } from 'lucide-react';

const About = () => {
    const { t } = useTranslation();

    const features = [
        {
            key: 'students',
            icon: GraduationCap,
        },
        {
            key: 'experience',
            icon: Briefcase,
        },
        {
            key: 'support',
            icon: HeartHandshake,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto mb-16"
            >
                <h1 className="text-4xl font-bold text-heading mb-4">{t('about.title')}</h1>
                <p className="text-xl text-textMuted">{t('about.subtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div
                            key={feature.key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="bg-surface/50 border border-border p-8 rounded-2xl hover:border-primary/50 transition-colors text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                                <Icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-heading mb-4">
                                {t(`about.team.${feature.key}.title`)}
                            </h3>
                            <p className="text-textMuted leading-relaxed">
                                {t(`about.team.${feature.key}.description`)}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default About;
