import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ctfChallengeRoute } from '../../config/site';
import type { CtfCatalogChallenge } from '../../services/ctfCatalog';
import { CategoryBadge, DifficultyBadge } from './ChallengeMetaBadges';

export interface ChallengeCatalogCardProps {
  challenge: CtfCatalogChallenge;
  index?: number;
}

export function ChallengeCatalogCard({ challenge, index = 0 }: ChallengeCatalogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border rounded-2xl p-6 bg-[#0a0a0a]/90 backdrop-blur flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border-[#00ff41]/20 hover:border-[#00ff41]/60 shadow-lg"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={challenge.category} />
          <DifficultyBadge difficulty={challenge.difficulty} />
        </div>

        <h2 className="text-lg font-black text-white tracking-wide mb-2">{challenge.name}</h2>

        {challenge.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
            {challenge.description}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-mono">
          {challenge.points !== undefined && (
            <span className="text-[#00ff41] font-black">+{challenge.points} PTS</span>
          )}
          {challenge.version && <span className="text-gray-500">v{challenge.version}</span>}
        </div>

        <Link
          to={ctfChallengeRoute(challenge.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#00ff41] text-black hover:bg-[#00ff41]/80 font-black shadow-[0_0_15px_rgba(0,255,65,0.3)]"
        >
          Ver challenge <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
