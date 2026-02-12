import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import About from '../../pages/About';

describe('About Page', () => {
    it('renders the page title', () => {
        render(<About />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders all three team feature cards', () => {
        render(<About />);
        // Three h3 headings — one per feature card
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.length).toBe(3);
    });

    it('renders descriptions for each feature', () => {
        render(<About />);
        // Each card has a paragraph with descriptive text
        const paragraphs = document.querySelectorAll('p');
        // Page subtitle (1) + 3 card descriptions = at least 4 paragraphs
        expect(paragraphs.length).toBeGreaterThanOrEqual(4);
    });
});
