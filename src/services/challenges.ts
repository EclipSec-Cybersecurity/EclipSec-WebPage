import { apiRequest } from '../lib/api';

export interface BackendChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';
  points: number;
  target_url?: string;
  hints?: string;
  solves_count: number;
  is_solved: boolean; // Indicates whether current user has solved it (when authenticated)
}

export interface FlagSubmitResult {
  is_correct: boolean;
  message: string;
  points_awarded: number;
  new_total_score: number;
}

export interface ChallengeCategoryCount {
  category: string;
  count: number;
}

/**
 * List challenges from the backend with optional category and difficulty filtering.
 * Automatically marks is_solved=true if the user is authenticated.
 * GET /api/v1/challenges?category={cat}&difficulty={diff}
 */
export async function getChallenges(filters?: {
  category?: string;
  difficulty?: string;
}): Promise<BackendChallenge[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.difficulty) params.set('difficulty', filters.difficulty);
  const query = params.toString();
  return apiRequest<BackendChallenge[]>(`/api/v1/challenges${query ? `?${query}` : ''}`);
}

/**
 * Fetch recently added challenges.
 * GET /api/v1/challenges/recent?limit=5
 */
export async function getRecentChallenges(limit = 5): Promise<BackendChallenge[]> {
  return apiRequest<BackendChallenge[]>(`/api/v1/challenges/recent?limit=${limit}`);
}

/**
 * Fetch list of challenge categories and exercise count per category.
 * GET /api/v1/challenges/categories
 */
export async function getChallengeCategories(): Promise<ChallengeCategoryCount[]> {
  return apiRequest<ChallengeCategoryCount[]>('/api/v1/challenges/categories');
}

/**
 * Submit a flag for validation against the backend in constant-time HMAC.
 */
export async function submitFlag(
  slug: string,
  flag: string
): Promise<FlagSubmitResult> {
  return apiRequest<FlagSubmitResult>(`/api/v1/challenges/${slug}/submit`, {
    method: 'POST',
    body: JSON.stringify({ flag }),
  });
}
