import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { register, login, logout, getStoredUser, isLoggedIn, getUserProfile } from '../../services/auth';
import { getChallenges, getRecentChallenges, getChallengeCategories, submitFlag } from '../../services/challenges';
import { getLeaderboard, getCountryStats } from '../../services/leaderboard';

describe('Auth Service (src/services/auth.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('performs registration successfully via CTF adapter', async () => {
    const mockCtfResponse = {
      ok: true,
      message: 'Registro exitoso',
      token: 'jwt-token-reg',
      data: {
        currentUser: {
          id: 'usr-1',
          username: 'hacker1',
          nationality: 'CL',
          role: 'user',
          score: 0,
          solvesCount: 0,
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCtfResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await register({
      username: 'hacker1',
      password: 'password123',
      nationality: 'CL',
    });

    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ctf-academy'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('performs login, saves token and user in localStorage', async () => {
    const mockAuthResponse = {
      ok: true,
      message: 'Login exitoso',
      token: 'jwt-access-token-xyz',
      data: {
        currentUser: {
          id: 'usr-1',
          username: 'hacker1',
          nationality: 'CL',
          role: 'user',
          score: 100,
          rankName: 'Hacker',
          globalRank: 1,
          solvesCount: 2,
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAuthResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    await login({
      username: 'hacker1',
      password: 'password123',
    });

    expect(isLoggedIn()).toBe(true);
    expect(getStoredUser()?.username).toBe('hacker1');
  });

  it('fetches user profile from GET /api/v1/users/{username}/profile', async () => {
    const mockProfile = {
      username: 'hacker1',
      role: 'user',
      nationality: 'CL',
      score: 150,
      rankName: 'Hacker',
      globalRank: 3,
      solvesCount: 2,
      createdAt: '1723700000000',
      categoryBreakdown: {
        web: { count: 1, points: 100 },
        crypto: { count: 1, points: 50 },
      },
      recentSolves: [
        { challenge_title: 'Sanitizer Web', category: 'WEB', points: 100, solved_at: '1723701000000' },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProfile,
    });
    vi.stubGlobal('fetch', mockFetch);

    const userProfile = await getUserProfile('hacker1');
    expect(userProfile.username).toBe('hacker1');
    expect(userProfile.score).toBe(150);
    expect(userProfile.rankName).toBe('Hacker');
    expect(userProfile.globalRank).toBe(3);
  });

  it('clears credentials on logout', async () => {
    localStorage.setItem('eclipsec_token', 'sample-token');
    localStorage.setItem('eclipsec_ctf_user', JSON.stringify({ username: 'test' }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await logout();
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

  it('fetches challenge list with category and difficulty query filters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    await getChallenges({ category: 'web', difficulty: 'EASY' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/challenges?category=web&difficulty=EASY'),
      expect.anything()
    );
  });

  it('fetches recent challenges limit=5', async () => {
    const mockRecent = [
      { id: 'ch-1', slug: 'ch-1', title: 'New Web Challenge', category: 'web', difficulty: 'EASY', points: 100 },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRecent,
    });
    vi.stubGlobal('fetch', mockFetch);

    const data = await getRecentChallenges(5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/challenges/recent?limit=5'),
      expect.anything()
    );
    expect(data.length).toBe(1);
    expect(data[0].title).toBe('New Web Challenge');
  });

  it('fetches category list with exercise counts', async () => {
    const mockCategories = [{ category: 'web', count: 11 }];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockCategories,
    });
    vi.stubGlobal('fetch', mockFetch);

    const data = await getChallengeCategories();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/challenges/categories'),
      expect.anything()
    );
    expect(data).toEqual([{ category: 'web', count: 11 }]);
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
