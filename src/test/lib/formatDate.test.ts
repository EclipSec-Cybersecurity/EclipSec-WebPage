import { describe, it, expect } from 'vitest';
import { formatDate } from '../../lib/ctfAcademy';

describe('formatDate', () => {
  it('formats epoch milliseconds (number)', () => {
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0);
    expect(formatDate(ms)).not.toBe('—');
    expect(formatDate(ms)).toMatch(/2026/);
  });

  it('formats a numeric string as epoch milliseconds', () => {
    const ms = String(Date.UTC(2026, 0, 15, 12, 0, 0));
    expect(formatDate(ms)).toMatch(/2026/);
  });

  it('formats an ISO date string (the real backend format)', () => {
    // Regression: previously Number("2026-01-15...") -> NaN -> "Invalid Date"
    expect(formatDate('2026-01-15T12:00:00Z')).toMatch(/2026/);
  });

  it('returns a dash for null/undefined/empty', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('returns a dash for an unparseable value', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});
