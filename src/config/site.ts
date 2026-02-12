/**
 * Site-wide configuration constants.
 * Change values here to update them across the entire application.
 */

export const SITE_CONFIG = {
    /** Company / brand name */
    name: 'EclipSec',
    /** Legal entity name for copyright */
    legalName: 'EclipSec E.I.R.L.',
    /** Primary contact email */
    email: 'contacto@eclipsec.cl',
    /** Formspree form endpoint for the contact form */
    formspreeEndpoint: 'https://formspree.io/f/xjgknknk',
} as const;

export const SOCIAL_LINKS = {
    github: 'https://github.com/ElRetrillo',
    linkedin: 'https://www.linkedin.com/in/eclipsec/',
    instagram: 'https://instagram.com/eclipsec_cl',
} as const;

export const NAV_ROUTES = {
    home: '/',
    services: '/servicios',
    about: '/nosotros',
    contact: '/contacto',
} as const;
