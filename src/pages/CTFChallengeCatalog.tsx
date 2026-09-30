import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Terminal, User } from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { isLoggedIn } from '../services/auth';
import { useChallengeCatalog } from '../hooks/useCtfCatalog';
import { CtfPageShell } from '../components/ctf/CtfPageShell';
import { ChallengeCatalogCard } from '../components/ctf/ChallengeCatalogCard';
import {
  CtfEmptyState,
  CtfErrorState,
  CtfLoadingState,
} from '../components/ctf/CtfStateViews';

const NAV_PILL =
  'flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/40 bg-[#00ff41]/5 rounded text-xs text-[#00ff41] hover:bg-[#00ff41]/20 transition-all';

const CTFChallengeCatalog = () => {
  const { challenges, loading, error, reload } = useChallengeCatalog();
  const loggedIn = isLoggedIn();

  return (
    <CtfPageShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-8 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-[#00ff41] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)]">
            <Shield className="w-5 h-5 text-[#00ff41]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-widest uppercase text-white">
                CTF CHALLENGES
              </h1>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#00ff41] border border-[#00ff41]/40 bg-[#00ff41]/10 px-1.5 py-0.5 rounded">
                CTF ARENA
              </span>
            </div>
            <p className="text-xs text-gray-400">Challenges disponibles</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link to={NAV_ROUTES.ctf} className={NAV_PILL}>
            <ArrowLeft className="w-4 h-4" /> Portal CTF
          </Link>
          {loggedIn && (
            <>
              <Link to={NAV_ROUTES.ctfLobby} className={NAV_PILL}>
                <Terminal className="w-4 h-4" /> Lobby
              </Link>
              <Link to={NAV_ROUTES.ctfProfile} className={NAV_PILL}>
                <User className="w-4 h-4" /> Perfil
              </Link>
            </>
          )}
        </nav>
      </motion.div>

      {loading ? (
        <CtfLoadingState message="Cargando challenges..." />
      ) : error ? (
        <CtfErrorState message="No fue posible cargar los challenges." onRetry={reload} />
      ) : challenges.length === 0 ? (
        <CtfEmptyState
          title="Aún no hay challenges disponibles"
          hint="Vuelve pronto: el catálogo se publica a medida que los challenges quedan listos."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge, idx) => (
            <ChallengeCatalogCard key={challenge.id} challenge={challenge} index={idx} />
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500 leading-relaxed">
        Esta versión del catálogo es sólo informativa: el envío de flags y las instancias remotas
        todavía no están disponibles. Los challenges se resuelven localmente con la EclipSec CLI.
      </p>
    </CtfPageShell>
  );
};

export default CTFChallengeCatalog;
