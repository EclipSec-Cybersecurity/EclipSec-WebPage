import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../test-utils';
import CTFLeaderboard from '../../pages/CTFLeaderboard';

const SAMPLE = {
  total_players: 2,
  leaderboard: [
    {
      rank: 1,
      user_id: 'u1',
      username: 'alice',
      nationality: 'CL',
      score: 300,
      solves_count: 3,
      start_date: '2026-01-01T00:00:00Z',
      last_connected_at: '2026-01-02T00:00:00Z',
    },
    {
      rank: 2,
      user_id: 'u2',
      username: 'bob',
      nationality: 'AR',
      score: 100,
      solves_count: 1,
      start_date: '2026-01-01T00:00:00Z',
      last_connected_at: '2026-01-02T00:00:00Z',
    },
  ],
};

function stubFetch(payload: unknown, ok = true) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

describe('CTFLeaderboard page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders players ordered from the backend response', async () => {
    stubFetch(SAMPLE);
    render(<CTFLeaderboard />);

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText(/2 jugadores/i)).toBeInTheDocument();
  });

  it('links a player to their profile', async () => {
    stubFetch(SAMPLE);
    render(<CTFLeaderboard />);

    const link = await screen.findByRole('link', { name: /alice/i });
    expect(link).toHaveAttribute('href', '/ctf/profile/alice');
  });

  it('shows the empty state when there are no players', async () => {
    stubFetch({ total_players: 0, leaderboard: [] });
    render(<CTFLeaderboard />);

    expect(await screen.findByText(/aún no hay jugadores/i)).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    stubFetch({ detail: 'boom' }, false);
    render(<CTFLeaderboard />);

    expect(await screen.findByText(/boom|no se pudo cargar/i)).toBeInTheDocument();
  });
});
