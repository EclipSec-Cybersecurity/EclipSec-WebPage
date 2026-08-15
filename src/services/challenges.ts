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

/**
 * List all challenges from the backend.
 * Automatically marks is_solved=true if the user is authenticated.
 */
export async function getChallenges(): Promise<BackendChallenge[]> {
  return apiRequest<BackendChallenge[]>('/api/v1/challenges');
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
