import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../components/ui/ThemeToggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('renders the toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByLabelText('Toggle Theme')).toBeInTheDocument();
    });

    it('toggles the theme on click', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        const button = screen.getByLabelText('Toggle Theme');
        const initialTheme = document.documentElement.getAttribute('data-theme');

        await user.click(button);

        const newTheme = document.documentElement.getAttribute('data-theme');
        expect(newTheme).not.toBe(initialTheme);
    });

    it('persists theme to localStorage', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        await user.click(screen.getByLabelText('Toggle Theme'));
        expect(localStorage.getItem('theme')).toBeTruthy();
    });
});
