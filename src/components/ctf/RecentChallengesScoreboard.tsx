import { useEffect, useState } from 'react';
import { getRecentChallenges, type BackendChallenge } from '../../services/challenges';

export function RecentChallengesScoreboard() {
  const [recent, setRecent] = useState<BackendChallenge[]>([]);

  useEffect(() => {
    getRecentChallenges(5)
      .then((data) => setRecent(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <aside className="w-full xl:w-80 bg-[#0a0a0a]/95 border border-[#00ff41]/20 p-4 flex flex-col space-y-4 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center space-x-2 pb-2 border-b border-[#00ff41]/20">
        <span className="text-[#00ff41]">⚡ RETOS RECIENTES</span>
      </h3>
      <div className="flex flex-col space-y-2">
        {recent.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">Sin retos recientes</p>
        ) : (
          recent.map((ch) => (
            <div
              key={ch.id || ch.slug}
              className="p-3 bg-black/60 rounded-xl border border-[#00ff41]/20 hover:border-[#00ff41]/60 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#00ff41] uppercase tracking-wider">
                  {ch.category}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-gray-300 font-mono border border-gray-800">
                  {ch.difficulty}
                </span>
              </div>
              <span className="text-xs font-bold text-white mt-1 line-clamp-1">
                {ch.title}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
                +{ch.points} PTS
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
