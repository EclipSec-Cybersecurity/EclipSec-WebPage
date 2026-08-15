import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiRequest, getAuthToken, setAuthToken, removeAuthData, getApiBaseUrl } from '../../lib/api';

describe('API Client (src/lib/api.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('manages auth tokens in localStorage', () => {
    expect(getAuthToken()).toBeNull();

    setAuthToken('test-jwt-token');
    expect(getAuthToken()).toBe('test-jwt-token');

    removeAuthData();
    expect(getAuthToken()).toBeNull();
  });

  it('resolves API base URL correctly without trailing slashes', () => {
    const url = getApiBaseUrl();
    expect(typeof url).toBe('string');
    expect(url.endsWith('/')).toBe(false);
  });

  it('injects Authorization Bearer header when token is present', async () => {
    setAuthToken('secret-token-123');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiRequest<{ status: string }>('/api/v1/test');
    expect(result).toEqual({ status: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer secret-token-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('handles 204 No Content responses correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiRequest('/api/v1/no-content');
    expect(result).toEqual({});
  });

  it('throws structured error message on non-ok responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Credenciales inválidas' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(apiRequest('/api/v1/auth/login')).rejects.toThrow('Credenciales inválidas');
  });
});
