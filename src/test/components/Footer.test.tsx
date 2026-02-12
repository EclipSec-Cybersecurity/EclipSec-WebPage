import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Footer from '../../components/layout/Footer';
import { SITE_CONFIG, SOCIAL_LINKS } from '../../config/site';

describe('Footer', () => {
    it('renders the brand name', () => {
        render(<Footer />);
        expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
    });

    it('renders the legal name with copyright', () => {
        render(<Footer />);
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`${currentYear}.*${SITE_CONFIG.legalName}`))).toBeInTheDocument();
    });

    it('renders the tagline as a translated string, not a literal', () => {
        render(<Footer />);
        // Should NOT contain the literal function call text
        const tagline = screen.queryByText(/t\('hero\.title'\)/);
        expect(tagline).not.toBeInTheDocument();

        // Should contain actual translated text (Spanish default)
        expect(screen.getByText(/Auditamos|Audit/i)).toBeInTheDocument();
    });

    it('renders social links with correct hrefs', () => {
        render(<Footer />);
        const links = screen.getAllByRole('link');

        const hrefs = links.map((link) => link.getAttribute('href'));
        expect(hrefs).toContain(SOCIAL_LINKS.github);
        expect(hrefs).toContain(SOCIAL_LINKS.linkedin);
        expect(hrefs).toContain(SOCIAL_LINKS.instagram);
    });

    it('social links open in new tab', () => {
        render(<Footer />);
        const links = screen.getAllByRole('link');

        links.forEach((link) => {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        });
    });
});
