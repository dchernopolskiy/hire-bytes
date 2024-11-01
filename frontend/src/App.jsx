import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  // Move useEffect inside the component
  useEffect(() => {
    const keepAlive = () => {
      fetch(`${import.meta.env.VITE_API_URL}/keepalive`)
        .catch(() => {}); // ignore any errors
    };

    // Initial ping when app loads
    keepAlive();
    
    // Then ping every 14 minutes
    const interval = setInterval(keepAlive, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;