import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../test-utils';
import CTFChallengeCatalog from '../../pages/CTFChallengeCatalog';

const SEED_CHALLENGE = {
  id: 'web-sqli-001',
  name: 'Login Bypass',
  description: 'Evade el login de una app vulnerable a SQL injection.',
  category: 'web',
  difficulty: 'easy',
  points: 100,
  version: '1.0',
};

function stubFetchOk(payload: unknown) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

describe('CTFChallengeCatalog page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows the loading state and then renders the challenge list', async () => {
    stubFetchOk([SEED_CHALLENGE]);

    render(<CTFChallengeCatalog />);

    expect(screen.getByText(/cargando challenges/i)).toBeInTheDocument();

    expect(await screen.findByText('Login Bypass')).toBeInTheDocument();
    expect(screen.getByText(/\+100 PTS/)).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver challenge/i })).toHaveAttribute(
      'href',
      '/ctf/challenges/web-sqli-001'
    );
  });

  it('renders the empty state when the catalog is empty', async () => {
    stubFetchOk([]);

    render(<CTFChallengeCatalog />);

    expect(await screen.findByText(/aún no hay challenges disponibles/i)).toBeInTheDocument();
  });

  it('renders the error state and refetches when retry is clicked', async () => {
    const failing = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ message: 'boom' }),
    });
    vi.stubGlobal('fetch', failing);

    render(<CTFChallengeCatalog />);

    expect(
      await screen.findByText(/no fue posible cargar los challenges/i)
    ).toBeInTheDocument();
    expect(failing).toHaveBeenCalledTimes(1);

    failing.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [SEED_CHALLENGE],
    });

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Login Bypass')).toBeInTheDocument();
    await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
  });
});
