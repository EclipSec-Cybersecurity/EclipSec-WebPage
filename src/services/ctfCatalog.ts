import { apiRequest } from '../lib/api';

/**
 * Single source of truth for the challenge catalog prefix.
 * Verified against the running backend (academiahacking_ucncqbo): the catalog
 * lives under `/api/v1/challenges`; the unversioned `/api/challenges` returns 404.
 */
export const CHALLENGES_ENDPOINT = '/api/v1/challenges';

/**
 * Challenge as exposed by `GET /api/v1/challenges` and `GET /api/v1/challenges/{id}`.
 * Only `id` and `name` are treated as required: the backend contract for the
 * optional metadata is documented but not yet verifiable from this repo.
 */
export interface CtfCatalogChallenge {
  id: string;
  name: string;
  description?: string;
  category?: string;
  difficulty?: string;
  points?: number;
  version?: string;
  repository?: string;
  path?: string;
}

/**
 * WHY this normalizer is deliberately tolerant:
 * the catalog backend was NOT reachable while this was written, so the exact
 * response envelope and field names could not be verified. It therefore accepts
 * both a bare array and `{ data: [...] }` / `{ challenges: [...] }` envelopes
 * (the sibling `/api/ctf-academy` lane already uses a `{ ok, message, data }`
 * envelope, so that shape is plausible here too) plus the field aliases
 * `challenge_id` / `slug` for `id` and `title` for `name`.
 *
 * TODO: tighten this (drop the aliases and the envelope sniffing) once the real
 * response shape is confirmed against a running backend.
 */
export function normalizeChallenge(raw: unknown): CtfCatalogChallenge | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const id = firstString(record.id, record.challenge_id, record.slug);
  const name = firstString(record.name, record.title);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: optionalString(record.description),
    category: optionalString(record.category),
    difficulty: optionalString(record.difficulty),
    points: optionalNumber(record.points),
    version: optionalString(record.version),
    repository: optionalString(record.repository),
    path: optionalString(record.path),
  };
}

/** GET /api/v1/challenges — read-only catalog listing. */
export async function getChallenges(): Promise<CtfCatalogChallenge[]> {
  const payload = await apiRequest<unknown>(CHALLENGES_ENDPOINT);
  return unwrapList(payload)
    .map(normalizeChallenge)
    .filter((challenge): challenge is CtfCatalogChallenge => challenge !== null);
}

/** GET /api/v1/challenges/{challenge_id} — single challenge detail. */
export async function getChallenge(challengeId: string): Promise<CtfCatalogChallenge> {
  const payload = await apiRequest<unknown>(
    `${CHALLENGES_ENDPOINT}/${encodeURIComponent(challengeId)}`
  );
  const challenge = normalizeChallenge(unwrapItem(payload));
  if (!challenge) {
    throw new Error(`Respuesta inválida del servidor para el challenge "${challengeId}"`);
  }
  // `unwrapItem` may have picked an entry out of a list, and a backend could
  // ignore the path id altogether. Fail loudly instead of rendering a different
  // challenge under the requested URL.
  if (challenge.id.toLowerCase() !== challengeId.toLowerCase()) {
    throw new Error(
      `El servidor devolvió el challenge "${challenge.id}" en lugar de "${challengeId}"`
    );
  }
  return challenge;
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.challenges)) return record.challenges;
  }
  return [];
}

function unwrapItem(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload[0];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (record.data && typeof record.data === 'object') return record.data;
    if (record.challenge && typeof record.challenge === 'object') return record.challenge;
  }
  return payload;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const parsed = optionalString(value);
    if (parsed) return parsed;
  }
  return undefined;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
