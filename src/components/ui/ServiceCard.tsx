import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceCardProps {
    title: string;
    description: string;
    code: string;
    icon: LucideIcon;
    delay?: number;
}

const ServiceCard = ({ title, description, code, icon: Icon, delay = 0 }: ServiceCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="group relative h-full"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl transform group-hover:scale-105 transition-transform duration-300"></div>

            <div className="relative h-full bg-surface/50 backdrop-blur-sm border border-border p-6 rounded-xl hover:border-primary/50 transition-colors duration-300">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-background/50 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
                    </div>
                    <span className="text-xs font-code text-textMuted/50 group-hover:text-primary/50 transition-colors">
                        #{code}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-primary transition-colors duration-300">
                    {title}
                </h3>

                <p className="text-textMuted text-sm leading-relaxed">
                    {description}
                </p>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl"></div>
            </div>
        </motion.div>
    );
};

export default ServiceCard;
