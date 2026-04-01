import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import CTF from './pages/CTF';
import CTFChallenges from './pages/CTFChallenges';
import CTFChallengeLab from './pages/CTFChallengeLab';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* CTF section - independent layout */}
        <Route path="/ctf" element={<CTF />} />
        <Route path="/ctf/challenges" element={<CTFChallenges />} />
        <Route path="/ctf/challenge/:challengeId" element={<CTFChallengeLab />} />

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
