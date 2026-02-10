import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, Globe, ShieldCheck, Lock } from 'lucide-react';

const Contact = () => {
    const { t } = useTranslation();

    const contactSchema = z.object({
        name: z.string().min(1, { message: t('common.form.validation.name_required') }),
        company: z.string().optional(),
        email: z.string().email({ message: t('common.form.validation.email_invalid') }),
        message: z.string().min(10, { message: t('common.form.validation.message_min') }),
    });

    type ContactFormValues = z.infer<typeof contactSchema>;

    const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormValues) => {
        try {
            const response = await fetch('https://formspree.io/f/xjgknknk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* Left Column: Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-primary font-bold tracking-wider text-sm uppercase">EclipSec Contact</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-heading mb-6 leading-tight">
                            {t('common.form.title')}
                        </h1>

                        <p className="text-xl text-textMuted mb-12 leading-relaxed">
                            {t('common.form.subtitle')}
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-surface border border-border rounded-lg mt-1">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-heading mb-1">{t('common.form.email_title')}</h3>
                                    <p className="text-textMuted font-mono">contacto@eclipsec.cl</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-surface border border-border rounded-lg mt-1">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-heading mb-1">{t('common.form.location_title')}</h3>
                                    <p className="text-textMuted">{t('common.form.location_value')}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-surface border border-border rounded-lg mt-1">
                                    <Globe className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-heading mb-1">{t('common.form.area_title')}</h3>
                                    <p className="text-textMuted">{t('common.form.area_value')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-surface border border-border p-8 rounded-2xl shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <ShieldCheck className="w-32 h-32 text-primary" />
                        </div>

                        {isSubmitSuccessful ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-heading mb-2">{t('common.form.success_title')}</h3>
                                <p className="text-textMuted max-w-xs mx-auto">{t('common.form.success_desc')}</p>
                                <button
                                    onClick={() => reset()}
                                    className="mt-8 text-sm text-primary hover:text-primaryHover underline"
                                >
                                    {t('common.form.send_another')}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-text mb-2">
                                            {t('common.form.name_label')}
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-textMuted/30"
                                            placeholder="John Doe"
                                        />
                                        {errors.name && (
                                            <p className="text-accent text-xs mt-1">{errors.name.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="company" className="block text-sm font-semibold text-text mb-2">
                                            {t('common.form.company_label')} <span className="text-textMuted font-normal text-xs">({t('common.form.optional')})</span>
                                        </label>
                                        <input
                                            {...register('company')}
                                            type="text"
                                            className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-textMuted/30"
                                            placeholder="Empresa SPA"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-text mb-2">
                                        {t('common.form.email_label')}
                                    </label>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-textMuted/30"
                                        placeholder="john@empresa.com"
                                    />
                                    {errors.email && (
                                        <p className="text-accent text-xs mt-1">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-text mb-2">
                                        {t('common.form.message_label')}
                                    </label>
                                    <textarea
                                        {...register('message')}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder:text-textMuted/30"
                                        placeholder={t('common.form.message_placeholder')}
                                    />
                                    {errors.message && (
                                        <p className="text-accent text-xs mt-1">{errors.message.message}</p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-background bg-primary rounded-lg hover:bg-primaryHover transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {isSubmitting ? (
                                            t('common.loading')
                                        ) : (
                                            <>
                                                <span>{t('common.form.send_btn')}</span>
                                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-center text-textMuted mt-4 opacity-70">
                                        <Lock className="w-3 h-3 inline mr-1" />
                                        {t('common.form.legal_nda')}
                                    </p>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
