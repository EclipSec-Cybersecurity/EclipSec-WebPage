import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ServiceCardProps {
    title: string;
    description: string;
    code: string;
    icon: LucideIcon;
    delay?: number;
    price?: string;
    features?: string[];
    badge?: string;
}

const ServiceCard = ({ title, description, code, icon: Icon, delay = 0, price, features, badge }: ServiceCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="group relative h-full"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl transform group-hover:scale-105 transition-transform duration-300"></div>

            <div className="relative h-full bg-surface/50 backdrop-blur-sm border border-border p-6 rounded-xl hover:border-primary/50 transition-colors duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-background/50 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {badge && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-accent border border-primary/30">
                                {badge}
                            </span>
                        )}
                        <span className="text-xs font-code text-text-muted/50 group-hover:text-primary/50 transition-colors">
                            #{code}
                        </span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-heading mb-2 group-hover:text-primary transition-colors duration-300">
                    {title}
                </h3>

                <p className="text-text-muted text-sm leading-relaxed mb-4">
                    {description}
                </p>

                {features && features.length > 0 && (
                    <ul className="space-y-2 mb-5 flex-1">
                        {features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {price && (
                    <div className="mt-auto pt-4 border-t border-border/50">
                        <p className="text-xs text-text-muted/60 mb-0.5">Precio estimado desde</p>
                        <p className="text-lg font-bold text-primary">{price}</p>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl"></div>
            </div>
        </motion.div>
    );
};

export default ServiceCard;
