/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n';

/**
 * Custom render that wraps components with all required providers
 * (Router, Theme, i18n) so tests mirror the real app environment.
 */
function AllProviders({ children }: { children: ReactNode }) {
    return (
        <BrowserRouter>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </BrowserRouter>
    );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from RTL, overriding render
export * from '@testing-library/react';
export { customRender as render };
