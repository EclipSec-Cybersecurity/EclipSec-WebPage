import { AlertTriangle, Bug, Code, Globe, Key, Search, Skull, Zap } from 'lucide-react';
import {
  getCategoryConfig,
  getDifficultyConfig,
  type CategoryIconName,
  type DifficultyIconName,
} from './challengeMeta';

const CATEGORY_ICONS: Record<CategoryIconName, typeof Globe> = {
  Globe,
  Key,
  Search,
  Bug,
  Code,
};

const DIFFICULTY_ICONS: Record<DifficultyIconName, typeof Zap> = {
  Zap,
  AlertTriangle,
  Skull,
};

export interface CategoryBadgeProps {
  category?: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) return null;
  const config = getCategoryConfig(category);
  const Icon = CATEGORY_ICONS[config.icon];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider"
      style={{
        borderColor: `${config.color}60`,
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <Icon className="w-4 h-4" />
      {category}
    </span>
  );
}

export interface DifficultyBadgeProps {
  difficulty?: string;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!difficulty) return null;
  const config = getDifficultyConfig(difficulty);
  const Icon = DIFFICULTY_ICONS[config.icon];

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider"
      style={{
        borderColor: config.border,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {difficulty}
    </span>
  );
}
