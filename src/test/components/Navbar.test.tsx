import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Navbar from '../../components/layout/Navbar';
import { SITE_CONFIG, NAV_ROUTES } from '../../config/site';

describe('Navbar', () => {
    it('renders the brand name', () => {
        render(<Navbar />);
        expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(<Navbar />);
        // Desktop + mobile nav links may result in duplicates
        const serviceLinks = screen.getAllByRole('link', { name: /servicios|services/i });
        expect(serviceLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the logo link pointing to home', () => {
        render(<Navbar />);
        const logoLink = screen.getByText(SITE_CONFIG.name).closest('a');
        expect(logoLink).toHaveAttribute('href', NAV_ROUTES.home);
    });

    it('renders CTA contact button(s)', () => {
        render(<Navbar />);
        // Both desktop and mobile CTA buttons link to contact
        const ctaLinks = screen.getAllByRole('link', { name: /cifrado|encrypted/i });
        ctaLinks.forEach((link) => {
            expect(link).toHaveAttribute('href', NAV_ROUTES.contact);
        });
    });

    it('renders theme toggle button(s)', () => {
        render(<Navbar />);
        // Desktop + mobile each render a ThemeToggle
        const toggles = screen.getAllByLabelText('Toggle Theme');
        expect(toggles.length).toBeGreaterThanOrEqual(1);
        toggles.forEach((toggle) => {
            expect(toggle).toBeInTheDocument();
        });
    });

    it('renders language toggle button(s)', () => {
        render(<Navbar />);
        // Desktop has aria-label, mobile has a simpler button
        const languageToggles = screen.getAllByLabelText('Toggle Language');
        expect(languageToggles.length).toBeGreaterThanOrEqual(1);
    });
});
