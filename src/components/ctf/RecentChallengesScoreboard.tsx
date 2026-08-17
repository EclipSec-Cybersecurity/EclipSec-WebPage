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
    <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col space-y-4 rounded-xl">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
        <span>⚡ Retos Agregados Recientemente</span>
      </h3>
      <div className="flex flex-col space-y-2">
        {recent.map((ch) => (
          <div
            key={ch.id || ch.slug}
            className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 flex flex-col"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">
                {ch.category}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                {ch.difficulty}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-200 mt-1">
              {ch.title}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">{ch.points} pts</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
