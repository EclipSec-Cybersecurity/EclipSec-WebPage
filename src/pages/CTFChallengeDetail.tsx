import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flag, Server, Shield, Trophy } from 'lucide-react';
import { NAV_ROUTES } from '../config/site';
import { useChallengeDetail } from '../hooks/useCtfCatalog';
import { CtfPageShell } from '../components/ctf/CtfPageShell';
import { CtfCliCallout } from '../components/ctf/CtfCliCallout';
import { CategoryBadge, DifficultyBadge } from '../components/ctf/ChallengeMetaBadges';
import { CtfErrorState, CtfLoadingState } from '../components/ctf/CtfStateViews';

const GHOST_BUTTON =
  'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20';

const NOT_AVAILABLE_YET = [
  { icon: Server, label: 'Iniciar instancia remota' },
  { icon: Flag, label: 'Envío de flags' },
  { icon: Trophy, label: 'Scoreboard del challenge' },
];

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-wrap items-baseline gap-2 text-xs">
    <span className="text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="font-mono text-white break-all">{value}</span>
  </div>
);

const CTFChallengeDetail = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { challenge, loading, error, reload } = useChallengeDetail(challengeId);

  const header = (
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
          <h1 className="text-xl font-black tracking-widest uppercase text-white">
            {challenge?.name || 'CHALLENGE'}
          </h1>
          <p className="text-xs text-gray-400 font-mono">{challengeId || '—'}</p>
        </div>
      </div>

      <Link to={NAV_ROUTES.ctfChallenges} className={GHOST_BUTTON}>
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>
    </motion.div>
  );

  if (!challengeId) {
    return (
      <CtfPageShell>
        {header}
        <CtfErrorState message="No se indicó ningún challenge." />
      </CtfPageShell>
    );
  }

  return (
    <CtfPageShell>
      {header}

      {loading ? (
        <CtfLoadingState message="Cargando challenge..." />
      ) : error ? (
        <CtfErrorState message="No fue posible cargar el challenge." onRetry={reload} />
      ) : !challenge ? (
        <CtfErrorState message="Challenge no encontrado." onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="bg-[#0a0a0a]/95 border border-[#00ff41]/20 p-4 flex flex-col rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <CategoryBadge category={challenge.category} />
              <DifficultyBadge difficulty={challenge.difficulty} />
              {challenge.points !== undefined && (
                <span className="text-xs font-mono font-black text-[#00ff41]">
                  +{challenge.points} PTS
                </span>
              )}
              {challenge.version && (
                <span className="text-xs font-mono text-gray-500">v{challenge.version}</span>
              )}
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {challenge.description || 'Este challenge todavía no tiene descripción publicada.'}
            </p>

            {(challenge.repository || challenge.path) && (
              <div className="mt-4 pt-4 border-t border-[#00ff41]/10 flex flex-col gap-2">
                {challenge.repository && (
                  <MetaRow label="Repositorio" value={challenge.repository} />
                )}
                {challenge.path && <MetaRow label="Ruta" value={challenge.path} />}
              </div>
            )}
          </div>

          <CtfCliCallout challengeId={challenge.id} />

          <div className="bg-[#0a0a0a]/95 border border-[#00ff41]/20 p-4 flex flex-col rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-black tracking-widest uppercase text-white">
                Próximamente
              </h2>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Estas funciones aún no existen en la plataforma. Se listan sólo como referencia de lo
              que viene.
            </p>
            <ul className="flex flex-col gap-2">
              {NOT_AVAILABLE_YET.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-xs text-gray-500 border border-dashed border-[#00ff41]/15 rounded-xl px-3 py-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  <span className="ml-auto uppercase tracking-widest text-[10px] text-gray-600">
                    No disponible
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </CtfPageShell>
  );
};

export default CTFChallengeDetail;
