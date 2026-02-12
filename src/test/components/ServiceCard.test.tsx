import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import ServiceCard from '../../components/ui/ServiceCard';
import { Shield } from 'lucide-react';

describe('ServiceCard', () => {
    const defaultProps = {
        title: 'Test Service',
        description: 'A test service description for testing purposes.',
        code: '123456',
        icon: Shield,
    };

    it('renders the title', () => {
        render(<ServiceCard {...defaultProps} />);
        expect(screen.getByText('Test Service')).toBeInTheDocument();
    });

    it('renders the description', () => {
        render(<ServiceCard {...defaultProps} />);
        expect(screen.getByText(/test service description/i)).toBeInTheDocument();
    });

    it('renders the code with # prefix', () => {
        render(<ServiceCard {...defaultProps} />);
        expect(screen.getByText('#123456')).toBeInTheDocument();
    });
});
