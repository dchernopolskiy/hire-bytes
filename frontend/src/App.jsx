import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { FeedbackButton } from './components/FeedbackButton';
import Background from './components/Background';
import AdminPage from './pages/AdminPage';

function App() {
  useEffect(() => {
    const keepAlive = () => {
      fetch(`${import.meta.env.VITE_API_URL}/keepalive`)
        .catch(() => {});
    };

    keepAlive();
    const interval = setInterval(keepAlive, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen relative">
        {/* Background with proper z-index */}
        <div className="fixed inset-0 z-0">
          <Background />
        </div>
        
        {/* Main content */}
        <div className="relative z-10 min-h-screen bg-gray-900/70 backdrop-blur-sm">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <FeedbackButton />
        </div>
      </div>
    </Router>
  );
}

export default App;