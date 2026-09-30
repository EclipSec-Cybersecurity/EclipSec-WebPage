import { useCallback, useEffect, useState } from 'react';
import { getChallenge, getChallenges, type CtfCatalogChallenge } from '../services/ctfCatalog';

interface ChallengeCatalogState {
  challenges: CtfCatalogChallenge[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface ChallengeDetailState {
  challenge: CtfCatalogChallenge | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Both hooks store the settled result together with the request key that
 * produced it and derive `loading` from that, instead of flipping a loading
 * flag synchronously inside the effect (which triggers cascading renders and is
 * flagged by react-hooks/set-state-in-effect).
 */
interface Settled<T> {
  key: string;
  data: T;
  error: string | null;
}

/** Read-only catalog listing from GET /api/challenges. */
export function useChallengeCatalog(): ChallengeCatalogState {
  const [reloadKey, setReloadKey] = useState(0);
  const [settled, setSettled] = useState<Settled<CtfCatalogChallenge[]> | null>(null);
  const requestKey = String(reloadKey);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let mounted = true;

    getChallenges()
      .then((result) => {
        if (mounted) setSettled({ key: requestKey, data: result, error: null });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setSettled({
          key: requestKey,
          data: [],
          error: err instanceof Error ? err.message : 'No fue posible cargar los challenges.',
        });
      });

    return () => {
      mounted = false;
    };
  }, [requestKey]);

  const fresh = settled?.key === requestKey ? settled : null;

  return {
    challenges: fresh?.data ?? [],
    loading: fresh === null,
    error: fresh?.error ?? null,
    reload,
  };
}

/** Single challenge detail from GET /api/challenges/{challenge_id}. */
export function useChallengeDetail(challengeId?: string): ChallengeDetailState {
  const [reloadKey, setReloadKey] = useState(0);
  const [settled, setSettled] = useState<Settled<CtfCatalogChallenge | null> | null>(null);
  const requestKey = `${challengeId ?? ''}::${reloadKey}`;

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!challengeId) return;
    let mounted = true;

    getChallenge(challengeId)
      .then((result) => {
        if (mounted) setSettled({ key: requestKey, data: result, error: null });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setSettled({
          key: requestKey,
          data: null,
          error: err instanceof Error ? err.message : 'No fue posible cargar el challenge.',
        });
      });

    return () => {
      mounted = false;
    };
  }, [challengeId, requestKey]);

  if (!challengeId) {
    return {
      challenge: null,
      loading: false,
      error: 'No se indicó ningún challenge.',
      reload,
    };
  }

  const fresh = settled?.key === requestKey ? settled : null;

  return {
    challenge: fresh?.data ?? null,
    loading: fresh === null,
    error: fresh?.error ?? null,
    reload,
  };
}
