import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Home from '../../pages/Home';
import { NAV_ROUTES } from '../../config/site';

describe('Home Page', () => {
    it('renders the hero title heading', () => {
        render(<Home />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        // Title text split across spans: "Auditamos lo Invisible." + "Protegemos lo Esencial."
        expect(heading.textContent).toMatch(/Auditamos|Audit/i);
    });

    it('renders the hero subtitle', () => {
        render(<Home />);
        expect(screen.getByText(/Pentesting|Red Teaming/i)).toBeInTheDocument();
    });

    it('renders CTA button linking to contact', () => {
        render(<Home />);
        const ctaLink = screen.getByRole('link', { name: /Auditoría|Audit/i });
        expect(ctaLink).toHaveAttribute('href', NAV_ROUTES.contact);
    });

    it('renders the Shield icon', () => {
        render(<Home />);
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThanOrEqual(1);
    });
});
