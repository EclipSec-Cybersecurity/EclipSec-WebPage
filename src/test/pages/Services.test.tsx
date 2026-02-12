import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Services from '../../pages/Services';

describe('Services Page', () => {
    it('renders the page title', () => {
        render(<Services />);
        // The page heading
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders all three service cards with their codes', () => {
        render(<Services />);
        expect(screen.getByText('#620200')).toBeInTheDocument();
        expect(screen.getByText('#620900')).toBeInTheDocument();
        expect(screen.getByText('#639900')).toBeInTheDocument();
    });

    it('renders three service card headings', () => {
        render(<Services />);
        // Each ServiceCard has an h3 title
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.length).toBe(3);
    });
});
