import { Navigate, useParams } from 'react-router-dom';
import { NAV_ROUTES, ctfChallengeRoute } from '../config/site';

/** Legacy singular `/ctf/challenge/:challengeId` link shape used by CTFLobby. */
const CTFChallengeRedirect = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const target = challengeId ? ctfChallengeRoute(challengeId) : NAV_ROUTES.ctfChallenges;
    return <Navigate to={target} replace />;
};

export default CTFChallengeRedirect;
