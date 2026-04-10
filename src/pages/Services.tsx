import { useTranslation } from 'react-i18next';
import { ShieldAlert, Code, GraduationCap, Swords } from 'lucide-react';
import ServiceCard from '../components/ui/ServiceCard';
import { motion } from 'framer-motion';

const Services = () => {
    const { t } = useTranslation();

    const services = [
        {
            title: t('services.items.development.title'),
            description: t('services.items.development.description'),
            code: '620900',
            icon: Code,
            badge: t('services.items.development.badge'),
            price: t('services.items.development.price'),
            features: t('services.items.development.features', { returnObjects: true }) as string[],
        },
        {
            title: t('services.items.consulting.title'),
            description: t('services.items.consulting.description'),
            code: '620200',
            icon: ShieldAlert,
            badge: t('services.items.consulting.badge'),
            price: t('services.items.consulting.price'),
            features: t('services.items.consulting.features', { returnObjects: true }) as string[],
        },
        {
            title: t('services.items.redteam.title'),
            description: t('services.items.redteam.description'),
            code: '620201',
            icon: Swords,
            badge: t('services.items.redteam.badge'),
            price: t('services.items.redteam.price'),
            features: t('services.items.redteam.features', { returnObjects: true }) as string[],
        },
        {
            title: t('services.items.tutoring.title'),
            description: t('services.items.tutoring.description'),
            code: '639900',
            icon: GraduationCap,
            badge: t('services.items.tutoring.badge'),
            price: t('services.items.tutoring.price'),
            features: t('services.items.tutoring.features', { returnObjects: true }) as string[],
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
                <h1 className="text-4xl font-bold text-heading mb-4">{t('services.title')}</h1>
                <p className="text-xl text-text-muted">{t('services.subtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.map((service, index) => (
                    <ServiceCard
                        key={service.code}
                        {...service}
                        delay={index * 0.1}
                    />
                ))}
            </div>

            {/* Disclaimer note */}
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center text-xs text-text-muted/50 mt-12"
            >
                {t('services.disclaimer')}
            </motion.p>
        </div>
    );
};

export default Services;
