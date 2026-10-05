import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Users } from 'lucide-react';

import { CtfPageShell } from '../components/ctf/CtfPageShell';
import { CtfLoadingState, CtfErrorState, CtfEmptyState } from '../components/ctf/CtfStateViews';
import { getLeaderboard, type LeaderboardEntry } from '../services/leaderboard';
import { getCountryFlag } from '../lib/ctfAcademy';
import { NAV_ROUTES } from '../config/site';

const RANK_ACCENT: Record<number, string> = {
  1: '#ffd700',
  2: '#c0c0c0',
  3: '#cd7f32',
};

export default function CTFLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(100);
      setEntries(data.leaderboard);
      setTotalPlayers(data.total_players);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el ranking.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CtfPageShell>
      <header className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
            <Trophy className="w-5 h-5 text-[#00ff41]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase text-white flex items-center gap-2">
              Leaderboard
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" /> {totalPlayers} jugadores
            </p>
          </div>
        </div>
        <Link
          to={NAV_ROUTES.ctfLobby}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/5 rounded text-xs text-[#00ff41] hover:bg-[#00ff41]/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al lobby
        </Link>
      </header>

      {loading ? (
        <CtfLoadingState message="Cargando ranking ..." />
      ) : error ? (
        <CtfErrorState message={error} onRetry={load} />
      ) : entries.length === 0 ? (
        <CtfEmptyState title="Aún no hay jugadores en el ranking" hint="Resuelve un challenge para aparecer aquí." />
      ) : (
        <div className="border border-[#00ff41]/30 bg-[#0a0a0a]/90 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.05)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-[#00ff41]/20">
                <th className="text-left px-4 py-3 font-normal">#</th>
                <th className="text-left px-4 py-3 font-normal">Jugador</th>
                <th className="text-right px-4 py-3 font-normal">Solves</th>
                <th className="text-right px-4 py-3 font-normal">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const accent = RANK_ACCENT[entry.rank];
                return (
                  <tr
                    key={entry.user_id}
                    className="border-b border-[#00ff41]/10 last:border-0 hover:bg-[#00ff41]/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-black" style={accent ? { color: accent } : undefined}>
                      {entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`${NAV_ROUTES.ctfProfile}/${encodeURIComponent(entry.username)}`}
                        className="flex items-center gap-2 text-white hover:text-[#00ff41] transition-colors"
                      >
                        <span>{getCountryFlag(entry.nationality)}</span>
                        <span className="font-bold">{entry.username}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{entry.solves_count}</td>
                    <td className="px-4 py-3 text-right font-black text-[#00ff41]">{entry.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CtfPageShell>
  );
}
