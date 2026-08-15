import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { register, login, getMe, logout, getStoredUser, isLoggedIn } from '../../services/auth';
import { getChallenges, submitFlag } from '../../services/challenges';
import { getLeaderboard, getCountryStats } from '../../services/leaderboard';

describe('Auth Service (src/services/auth.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('performs registration successfully', async () => {
    const mockUser = {
      id: 'usr-1',
      username: 'hacker1',
      email: 'hacker1@ucn.cl',
      nationality: 'CL',
      role: 'user' as const,
      score: 0,
      created_at: '2026-08-14T00:00:00Z',
      last_connected_at: '2026-08-14T00:00:00Z',
      is_active: true,
      solves_count: 0,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });
    vi.stubGlobal('fetch', mockFetch);

    const user = await register({
      username: 'hacker1',
      email: 'hacker1@ucn.cl',
      password: 'password123',
      nationality: 'CL',
    });

    expect(user.username).toBe('hacker1');
    expect(user.nationality).toBe('CL');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('performs login, saves token and user in localStorage', async () => {
    const mockAuthResponse = {
      access_token: 'jwt-access-token-xyz',
      token_type: 'bearer',
      user: {
        id: 'usr-1',
        username: 'hacker1',
        email: 'hacker1@ucn.cl',
        nationality: 'CL',
        role: 'user' as const,
        score: 100,
        created_at: '2026-08-14T00:00:00Z',
        last_connected_at: '2026-08-14T00:00:00Z',
        is_active: true,
        solves_count: 1,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAuthResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    const response = await login({
      username_or_email: 'hacker1',
      password: 'password123',
    });

    expect(response.access_token).toBe('jwt-access-token-xyz');
    expect(isLoggedIn()).toBe(true);
    expect(getStoredUser()?.username).toBe('hacker1');
  });

  it('fetches current user profile with getMe and updates stored user', async () => {
    const mockUser = {
      id: 'usr-1',
      username: 'hacker1',
      email: 'hacker1@ucn.cl',
      nationality: 'CL',
      role: 'user' as const,
      score: 150,
      created_at: '2026-08-14T00:00:00Z',
      last_connected_at: '2026-08-14T00:05:00Z',
      is_active: true,
      solves_count: 2,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });
    vi.stubGlobal('fetch', mockFetch);

    const user = await getMe();
    expect(user.username).toBe('hacker1');
    expect(user.score).toBe(150);
    expect(getStoredUser()?.score).toBe(150);
  });

  it('clears credentials on logout', () => {
    localStorage.setItem('eclipsec_token', 'sample-token');
    localStorage.setItem('eclipsec_user', JSON.stringify({ username: 'test' }));

    logout();
    expect(isLoggedIn()).toBe(false);
    expect(getStoredUser()).toBeNull();
  });
});

describe('Challenges Service (src/services/challenges.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches challenge list from backend', async () => {
    const mockChallenges = [
      {
        id: 'web-001',
        slug: 'web-001',
        title: 'Hidden in Plain Sight',
        description: 'Test description',
        category: 'WEB',
        difficulty: 'EASY',
        points: 100,
        solves_count: 5,
        is_solved: false,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockChallenges,
    });
    vi.stubGlobal('fetch', mockFetch);

    const list = await getChallenges();
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe('web-001');
  });

  it('submits flag and returns validation response', async () => {
    const mockSubmitResult = {
      is_correct: true,
      message: '¡Flag correcta!',
      points_awarded: 100,
      new_total_score: 250,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSubmitResult,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await submitFlag('web-001', 'EclipSec{flag}');
    expect(result.is_correct).toBe(true);
    expect(result.points_awarded).toBe(100);
    expect(result.new_total_score).toBe(250);
  });
});

describe('Leaderboard Service (src/services/leaderboard.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches player leaderboard', async () => {
    const mockLb = {
      total_players: 1,
      leaderboard: [
        {
          rank: 1,
          user_id: 'usr-1',
          username: 'operator1',
          nationality: 'CL',
          score: 500,
          solves_count: 3,
          start_date: '2026-08-14T00:00:00Z',
          last_connected_at: '2026-08-14T00:00:00Z',
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLb,
    });
    vi.stubGlobal('fetch', mockFetch);

    const data = await getLeaderboard();
    expect(data.total_players).toBe(1);
    expect(data.leaderboard[0].username).toBe('operator1');
    expect(data.leaderboard[0].nationality).toBe('CL');
  });

  it('fetches country statistics', async () => {
    const mockCountryStats = [
      {
        nationality: 'CL',
        total_players: 10,
        total_score: 3500,
        total_solves: 25,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCountryStats,
    });
    vi.stubGlobal('fetch', mockFetch);

    const stats = await getCountryStats();
    expect(stats.length).toBe(1);
    expect(stats[0].nationality).toBe('CL');
    expect(stats[0].total_players).toBe(10);
  });
});
