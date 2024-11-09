import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Users, Brain, Sparkles } from 'lucide-react';

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  DELAY: 1000,
  REQUEST_TIMEOUT: 15000
};

const GradientGlow = ({ color, blur = 200, opacity = 0.2, className = '' }) => (
  <div 
    className={`absolute pointer-events-none ${className}`}
    style={{
      background: color,
      filter: `blur(${blur}px)`,
      opacity
    }}
  />
);

const CodePreview = () => (
  <div className="relative group">
    <div className="absolute inset-0 bg-blue-500/10 rounded-lg transition-transform group-hover:scale-105" />
    <pre className="relative p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm font-mono text-sm overflow-hidden">
      <code className="text-gray-300">
        <span className="text-blue-400">async</span>{' '}
        <span className="text-yellow-400">function</span> interview() {'{'}
        <br />
        {'  '}await <span className="text-purple-400">prepare</span>({'{'}
        <br />
        {'    '}<span className="text-green-400">skills: [</span>
        <br />
        {'      '}<span className="text-blue-300">'algorithms'</span>,
        <br />
        {'      '}<span className="text-blue-300">'system-design'</span>,
        <br />
        {'      '}<span className="text-blue-300">'problem-solving'</span>
        <br />
        {'    '}],
        <br />
        {'    '}<span className="text-green-400">tools: </span>
        <span className="text-blue-300">'hirebytes'</span>
        <br />
        {'  '}{'}'});
        <br />
        {'  '}<span className="text-purple-400">return</span>{' '}
        <span className="text-blue-300">'success!'</span>;
        <br />
        {'}'}
      </code>
    </pre>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg 
      opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative p-6 rounded-lg border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  </div>
);

const createRoom = async (username, retryCount = 0) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/rooms`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username }),
      signal: AbortSignal.timeout(RETRY_CONFIG.REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your internet connection.');
    }
    
    if (retryCount < RETRY_CONFIG.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.DELAY * (retryCount + 1)));
      return createRoom(username, retryCount + 1);
    }
    
    throw error;
  }
};

export function LandingPage() {
  const [roomInfo, setRoomInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!import.meta.env.VITE_API_URL) {
      setError('API configuration missing. Please check environment setup.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await createRoom(username);
      const shareableLink = `${window.location.origin}/room/${data.roomId}`;
      
      localStorage.setItem('username', username);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('isCreator', 'true');
      
      setRoomInfo({ ...data, shareableLink });
    } catch (error) {
      console.error('Room creation failed:', error);
      
      setError(
        error.message.includes('timeout') ? 'Connection timed out. Please check your internet connection.' :
        error.message.includes('Failed to fetch') ? 'Unable to connect to server. Please check your internet connection.' :
        'Failed to create room. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomInfo.shareableLink);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = roomInfo.shareableLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <GradientGlow 
        color="radial-gradient(circle at center, #3b82f6 0%, transparent 70%)" 
        className="w-[800px] h-[800px] -top-[400px] -left-[400px]"
      />
      <GradientGlow 
        color="radial-gradient(circle at center, #8b5cf6 0%, transparent 70%)" 
        className="w-[600px] h-[600px] -bottom-[300px] -right-[300px]"
      />

      <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 mb-8">
            <Code2 className="w-12 h-12 text-blue-400" />
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              HireBytes
            </h1>
          </div>
          
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            No BS, no data stored, just code. Create a room in seconds and start your technical interview right away.
          </p>

          {!roomInfo ? (
            <div className="max-w-md mx-auto">
              <div className="bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700/50 p-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-md mb-4">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleCreateRoom()}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-600 mb-4"
                />

                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
                    text-white px-6 py-3 rounded-md transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    focus:ring-offset-gray-800 disabled:cursor-not-allowed transform hover:scale-[1.02]
                    flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Interview Room
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-gray-800/50 rounded-lg border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold mb-4">Room Created!</h2>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={roomInfo.shareableLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-md"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-md min-w-[80px]"
                >
                  {showCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => navigate(`/room/${roomInfo.roomId}`)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Enter Room
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard 
            icon={Users}
            title="Real-time Collaboration"
            description="Code together in real-time with syntax highlighting and multi-cursor support."
          />
          <FeatureCard 
            icon={Brain}
            title="AI-Powered Analysis"
            description="Get instant feedback on code quality, complexity, and best practices."
          />
          <FeatureCard 
            icon={Zap}
            title="Zero Setup"
            description="Start coding instantly. No accounts, no installations, no hassle."
          />
        </div>

        <div className="max-w-2xl mx-auto">
          <CodePreview />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;