import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import CTF from './pages/CTF';
import CTFLobby from './pages/CTFLobby';
import CTFProfile from './pages/CTFProfile';
import CTFChallengeCatalog from './pages/CTFChallengeCatalog';
import CTFChallengeDetail from './pages/CTFChallengeDetail';
import CTFChallengeRedirect from './pages/CTFChallengeRedirect';

function App() {
  return (
    <BrowserRouter>
        <Routes>
          {/* CTF section - independent layout */}
          <Route path="/ctf" element={<CTF />} />
          <Route path="/ctf/lobby" element={<CTFLobby />} />
          <Route path="/ctf/challenges" element={<CTFChallengeCatalog />} />
          <Route path="/ctf/challenges/:challengeId" element={<CTFChallengeDetail />} />
          <Route path="/ctf/challenge/:challengeId" element={<CTFChallengeRedirect />} />
          <Route path="/ctf/profile" element={<CTFProfile />} />
          <Route path="/ctf/profile/:username" element={<CTFProfile />} />

          {/* Legacy & Shortcut redirects */}
          <Route path="/ctf/dashboard" element={<Navigate to="/ctf/profile" replace />} />
          <Route path="/dashboard" element={<Navigate to="/ctf/profile" replace />} />
          <Route path="/perfil" element={<Navigate to="/ctf/profile" replace />} />
          <Route path="/profile" element={<Navigate to="/ctf/profile" replace />} />

          {/* Company site pages with shared layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="servicios" element={<Services />} />
            <Route path="nosotros" element={<About />} />
            <Route path="contacto" element={<Contact />} />
            {/* Fallback to Home for unknown routes */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
