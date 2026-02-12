import { describe, it, expect } from 'vitest';
import { SITE_CONFIG, SOCIAL_LINKS, NAV_ROUTES } from '../../config/site';

describe('Site Config', () => {
    it('has all required SITE_CONFIG fields', () => {
        expect(SITE_CONFIG.name).toBeTruthy();
        expect(SITE_CONFIG.legalName).toBeTruthy();
        expect(SITE_CONFIG.email).toBeTruthy();
        expect(SITE_CONFIG.formspreeEndpoint).toBeTruthy();
    });

    it('email has a valid format', () => {
        expect(SITE_CONFIG.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('formspree endpoint is a valid URL', () => {
        expect(SITE_CONFIG.formspreeEndpoint).toMatch(/^https:\/\/formspree\.io\//);
    });

    it('has all social links defined as valid URLs', () => {
        expect(SOCIAL_LINKS.github).toMatch(/^https:\/\//);
        expect(SOCIAL_LINKS.linkedin).toMatch(/^https:\/\//);
        expect(SOCIAL_LINKS.instagram).toMatch(/^https:\/\//);
    });

    it('has all navigation routes defined', () => {
        expect(NAV_ROUTES.home).toBe('/');
        expect(NAV_ROUTES.services).toBeTruthy();
        expect(NAV_ROUTES.about).toBeTruthy();
        expect(NAV_ROUTES.contact).toBeTruthy();
    });

    it('all routes start with /', () => {
        Object.values(NAV_ROUTES).forEach((route) => {
            expect(route).toMatch(/^\//);
        });
    });
});
