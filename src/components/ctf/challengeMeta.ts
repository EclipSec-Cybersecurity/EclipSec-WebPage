/**
 * Shared category / difficulty palettes for the CTF challenge catalog.
 *
 * NOTE: `src/pages/CTFLobby.tsx` keeps its own inline copies of these maps
 * (with JSX icon nodes). They were intentionally left untouched to avoid
 * regressions in the live lobby; this module only serves the new catalog and
 * detail pages. Icons here are lucide component names so the module stays a
 * plain `.ts` file.
 */

export type CategoryKey = 'WEB' | 'CRYPTO' | 'FORENSICS' | 'PWN' | 'MISC';
export type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';

export type CategoryIconName = 'Globe' | 'Key' | 'Search' | 'Bug' | 'Code';
export type DifficultyIconName = 'Zap' | 'AlertTriangle' | 'Skull';

export interface CategoryConfig {
  color: string;
  icon: CategoryIconName;
}

export interface DifficultyConfig {
  color: string;
  border: string;
  bg: string;
  icon: DifficultyIconName;
}

export const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  WEB: { color: '#3b82f6', icon: 'Globe' },
  CRYPTO: { color: '#eab308', icon: 'Key' },
  FORENSICS: { color: '#10b981', icon: 'Search' },
  PWN: { color: '#ef4444', icon: 'Bug' },
  MISC: { color: '#a855f7', icon: 'Code' },
};

export const DIFFICULTY_CONFIG: Record<DifficultyKey, DifficultyConfig> = {
  EASY: {
    color: '#00ff41',
    border: 'rgba(0,255,65,0.4)',
    bg: 'rgba(0,255,65,0.08)',
    icon: 'Zap',
  },
  MEDIUM: {
    color: '#eab308',
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.08)',
    icon: 'AlertTriangle',
  },
  HARD: {
    color: '#ef4444',
    border: 'rgba(239,68,68,0.4)',
    bg: 'rgba(239,68,68,0.08)',
    icon: 'AlertTriangle',
  },
  INSANE: {
    color: '#a855f7',
    border: 'rgba(168,85,247,0.4)',
    bg: 'rgba(168,85,247,0.08)',
    icon: 'Skull',
  },
};

/** Neutral fallbacks so an unknown value from the backend still renders. */
const NEUTRAL_CATEGORY: CategoryConfig = { color: '#00ff41', icon: 'Code' };
const NEUTRAL_DIFFICULTY: DifficultyConfig = {
  color: '#9ca3af',
  border: 'rgba(156,163,175,0.4)',
  bg: 'rgba(156,163,175,0.08)',
  icon: 'AlertTriangle',
};

/**
 * The backend sends category/difficulty lowercase while these palettes are
 * keyed uppercase, so both getters normalize before looking up and fall back to
 * a neutral entry so unknown values still render.
 */
export function getCategoryConfig(category?: string): CategoryConfig {
  const key = (category || '').trim().toUpperCase();
  return CATEGORY_CONFIG[key as CategoryKey] ?? NEUTRAL_CATEGORY;
}

export function getDifficultyConfig(difficulty?: string): DifficultyConfig {
  const key = (difficulty || '').trim().toUpperCase();
  return DIFFICULTY_CONFIG[key as DifficultyKey] ?? NEUTRAL_DIFFICULTY;
}
