import { apiRequest } from '../lib/api';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  nationality: string;
  score: number;
  solves_count: number;
  start_date: string;
  last_connected_at: string;
  last_solve_at?: string;
}

export interface LeaderboardResponse {
  total_players: number;
  leaderboard: LeaderboardEntry[];
}

export interface CountryStat {
  nationality: string;
  total_players: number;
  total_score: number;
  total_solves: number;
}

/**
 * Fetch global player leaderboard ordered by score and solve timestamp
 */
export async function getLeaderboard(limit = 100): Promise<LeaderboardResponse> {
  return apiRequest<LeaderboardResponse>(`/api/v1/leaderboard?limit=${limit}`);
}

/**
 * Fetch aggregate statistics grouped by country/nationality
 */
export async function getCountryStats(): Promise<CountryStat[]> {
  return apiRequest<CountryStat[]>('/api/v1/leaderboard/countries');
}
