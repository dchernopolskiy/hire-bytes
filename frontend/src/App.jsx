import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoomPage from './pages/RoomPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { FeedbackButton } from './components/FeedbackButton';
import Background from './components/Background';
import AdminPage from './pages/AdminPage';

// Create ErrorBoundary component inline since it's simple
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            Something went wrong. Please try refreshing the page.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        <div className="fixed inset-0 z-0">
          <Background />
        </div>
        
        <div className="relative z-10 min-h-screen bg-gray-900/70 backdrop-blur-sm">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route 
              path="/analytics" 
              element={
                <ErrorBoundary>
                  <AnalyticsDashboard />
                </ErrorBoundary>
              } 
            />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <FeedbackButton />
        </div>
      </div>
    </Router>
  );
}

export default App;