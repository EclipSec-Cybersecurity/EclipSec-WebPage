import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getChallenge,
  getChallenges,
  normalizeChallenge,
  CHALLENGES_ENDPOINT,
} from '../../services/ctfCatalog';

const SEED_CHALLENGE = {
  id: 'web-sqli-001',
  name: 'Login Bypass',
  description: 'Evade el login de una app vulnerable a SQL injection.',
  category: 'web',
  difficulty: 'easy',
  points: 100,
  version: '1.0',
  repository: 'eclipsec/ctf-challenges',
  path: 'web/sqli/login-bypass',
};

function stubFetch(payload: unknown) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

describe('CTF Catalog Service (src/services/ctfCatalog.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('exposes the unversioned /api/challenges prefix', () => {
    expect(CHALLENGES_ENDPOINT).toBe('/api/challenges');
  });

  it('fetches the catalog from GET /api/challenges with a bare array response', async () => {
    const mockFetch = stubFetch([SEED_CHALLENGE]);

    const challenges = await getChallenges();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/challenges'),
      expect.anything()
    );
    expect(challenges).toHaveLength(1);
    expect(challenges[0].id).toBe('web-sqli-001');
    expect(challenges[0].name).toBe('Login Bypass');
    expect(challenges[0].points).toBe(100);
  });

  it('unwraps a { data: [...] } envelope', async () => {
    stubFetch({ ok: true, message: 'ok', data: [SEED_CHALLENGE] });

    const challenges = await getChallenges();
    expect(challenges).toHaveLength(1);
    expect(challenges[0].name).toBe('Login Bypass');
  });

  it('unwraps a { challenges: [...] } envelope', async () => {
    stubFetch({ challenges: [SEED_CHALLENGE] });

    const challenges = await getChallenges();
    expect(challenges).toHaveLength(1);
  });

  it('accepts the challenge_id / slug and title field aliases', async () => {
    stubFetch([
      { challenge_id: 'crypto-rsa-002', title: 'Weak Modulus' },
      { slug: 'pwn-bof-003', title: 'Stack Smash' },
    ]);

    const challenges = await getChallenges();
    expect(challenges.map((c) => c.id)).toEqual(['crypto-rsa-002', 'pwn-bof-003']);
    expect(challenges.map((c) => c.name)).toEqual(['Weak Modulus', 'Stack Smash']);
  });

  it('drops junk entries that have no usable id + name', async () => {
    stubFetch([SEED_CHALLENGE, { id: 'no-name' }, { name: 'No Id' }, null, 'nope', 42, {}]);

    const challenges = await getChallenges();
    expect(challenges).toHaveLength(1);
    expect(challenges[0].id).toBe('web-sqli-001');
  });

  it('keeps missing optional fields as undefined instead of inventing values', async () => {
    stubFetch([{ id: 'misc-001', name: 'Minimal' }]);

    const [challenge] = await getChallenges();
    expect(challenge.description).toBeUndefined();
    expect(challenge.category).toBeUndefined();
    expect(challenge.difficulty).toBeUndefined();
    expect(challenge.points).toBeUndefined();
    expect(challenge.version).toBeUndefined();
    expect(challenge.repository).toBeUndefined();
    expect(challenge.path).toBeUndefined();
  });

  it('returns an empty list for an unexpected payload shape', async () => {
    stubFetch({ unexpected: true });
    await expect(getChallenges()).resolves.toEqual([]);
  });

  it('fetches a single challenge from GET /api/challenges/{id}', async () => {
    const mockFetch = stubFetch(SEED_CHALLENGE);

    const challenge = await getChallenge('web-sqli-001');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/challenges/web-sqli-001'),
      expect.anything()
    );
    expect(challenge.name).toBe('Login Bypass');
    expect(challenge.category).toBe('web');
    expect(challenge.difficulty).toBe('easy');
  });

  it('unwraps a { data: {...} } envelope on the detail endpoint', async () => {
    stubFetch({ ok: true, message: 'ok', data: SEED_CHALLENGE });

    const challenge = await getChallenge('web-sqli-001');
    expect(challenge.id).toBe('web-sqli-001');
  });

  it('throws when the detail payload cannot be normalized', async () => {
    stubFetch({ ok: false });
    await expect(getChallenge('web-sqli-001')).rejects.toThrow(/web-sqli-001/);
  });

  it('propagates HTTP errors from the backend', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ detail: 'Challenge not found' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(getChallenge('nope')).rejects.toThrow('Challenge not found');
    await expect(getChallenges()).rejects.toThrow('Challenge not found');
  });

  it('rejects a detail response whose id does not match the requested one', async () => {
    stubFetch({ ...SEED_CHALLENGE, id: 'web-xss-002' });
    await expect(getChallenge('web-sqli-001')).rejects.toThrow(/web-xss-002/);
  });

  it('accepts a detail id that differs only in casing', async () => {
    stubFetch({ ...SEED_CHALLENGE, id: 'WEB-SQLI-001' });
    const challenge = await getChallenge('web-sqli-001');
    expect(challenge.id).toBe('WEB-SQLI-001');
  });

  it('normalizeChallenge rejects non-object input', () => {
    expect(normalizeChallenge(null)).toBeNull();
    expect(normalizeChallenge([SEED_CHALLENGE])).toBeNull();
    expect(normalizeChallenge('web-sqli-001')).toBeNull();
    expect(normalizeChallenge(SEED_CHALLENGE)?.id).toBe('web-sqli-001');
  });
});
