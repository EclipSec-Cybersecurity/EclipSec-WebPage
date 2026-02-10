import { useTranslation } from 'react-i18next';
import { ShieldAlert, Code, BrainCircuit } from 'lucide-react';
import ServiceCard from '../components/ui/ServiceCard';

const Services = () => {
    const { t } = useTranslation();

    const services = [
        {
            title: t('services.items.consulting.title'),
            description: t('services.items.consulting.description'),
            code: '620200',
            icon: ShieldAlert,
        },
        {
            title: t('services.items.development.title'),
            description: t('services.items.development.description'),
            code: '620900',
            icon: Code,
        },
        {
            title: t('services.items.info.title'),
            description: t('services.items.info.description'),
            code: '639900',
            icon: BrainCircuit,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold text-heading mb-4">{t('services.title')}</h1>
                <p className="text-xl text-textMuted">{t('services.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                    <ServiceCard
                        key={service.code}
                        {...service}
                        delay={index * 0.1}
                    />
                ))}
            </div>
        </div>
    );
};

export default Services;
