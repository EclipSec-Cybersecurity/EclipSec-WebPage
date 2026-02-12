import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Layout from '../../components/layout/Layout';

describe('Layout', () => {
    it('renders Navbar and Footer', () => {
        render(<Layout />);
        // Navbar has the brand name
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        // Footer element
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('has a main content area', () => {
        render(<Layout />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
