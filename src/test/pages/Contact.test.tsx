import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Contact from '../../pages/Contact';
import { SITE_CONFIG } from '../../config/site';

describe('Contact Page', () => {
    it('renders the page title', () => {
        render(<Contact />);
        expect(screen.getByText(/Hablemos de Seguridad|Let.*Talk.*Security/i)).toBeInTheDocument();
    });

    it('renders the contact email from config', () => {
        render(<Contact />);
        expect(screen.getByText(SITE_CONFIG.email)).toBeInTheDocument();
    });

    it('renders the brand name from config', () => {
        render(<Contact />);
        expect(screen.getByText(new RegExp(`${SITE_CONFIG.name}.*Contact`))).toBeInTheDocument();
    });

    it('renders the contact form with all fields', () => {
        render(<Contact />);
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Empresa SPA')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('john@empresa.com')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
        render(<Contact />);
        expect(screen.getByRole('button', { name: /Iniciar|Start/i })).toBeInTheDocument();
    });

    it('renders the NDA notice', () => {
        render(<Contact />);
        expect(screen.getByText(/NDA/i)).toBeInTheDocument();
    });

    it('renders location info', () => {
        render(<Contact />);
        expect(screen.getByText(/Coquimbo, Chile/i)).toBeInTheDocument();
    });
});
