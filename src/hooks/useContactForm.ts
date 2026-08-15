import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../config/site';

export const useContactForm = (prefilledMessage: string) => {
    const { t } = useTranslation();
    const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const contactSchema = z.object({
        name: z.string().min(1, { message: t('common.form.validation.name_required') }),
        company: z.string().optional(),
        email: z.string().email({ message: t('common.form.validation.email_invalid') }),
        message: z.string().min(10, { message: t('common.form.validation.message_min') }),
        _honeypot: z.string().optional(),
    });

    type ContactFormValues = z.infer<typeof contactSchema>;

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            message: prefilledMessage,
            _honeypot: '',
        },
    });

    const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

    const onSubmit = async (data: ContactFormValues) => {
        setApiError(null);
        if (data._honeypot) return;

        // Client-side Rate Limiting
        const lastSubmitStr = localStorage.getItem('lastContactSubmit');
        const now = new Date().getTime();
        if (lastSubmitStr) {
            const lastSubmit = parseInt(lastSubmitStr, 10);
            const timePassed = now - lastSubmit;
            if (timePassed < RATE_LIMIT_MS) {
                const minutesLeft = Math.ceil((RATE_LIMIT_MS - timePassed) / 60000);
                setApiError(t('common.form.error_rate_limit', { minutes: minutesLeft }));
                return;
            }
        }

        try {
            const submitData = {
                name: data.name,
                company: data.company,
                email: data.email,
                message: data.message,
            };

            if (!SITE_CONFIG.formspreeEndpoint) {
                 setApiError(t('common.form.error_generic'));
                 return;
            }

            const response = await fetch(SITE_CONFIG.formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(submitData),
            });

            if (response.ok) {
                localStorage.setItem('lastContactSubmit', new Date().getTime().toString());
                setIsSubmitSuccessful(true);
                reset();
            } else {
                setApiError(t('common.form.error_generic'));
            }
        } catch {
            setApiError(t('common.form.error_generic'));
        }
    };

    const resetFormStatus = () => {
        setIsSubmitSuccessful(false);
        setApiError(null);
        reset();
    };

    return { register, handleSubmit: handleSubmit(onSubmit), errors, isSubmitting, isSubmitSuccessful, apiError, resetFormStatus };
};
