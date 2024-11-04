import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, Users, Code2, Brain, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

// Color palette for charts
const colors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  error: '#ef4444',
  warning: '#f59e0b',
  chartColors: ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState({
    overview: {
      totalRooms: 0,
      activeUsers: 0,
      averageSessionDuration: 0,
      totalCodeAnalyses: 0
    },
    trends: [],
    languages: [],
    hourlyActivity: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/dashboard?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics data...');
      console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/analytics/dashboard?range=${timeRange}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/dashboard?range=${timeRange}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Analytics fetch error:', errorData);
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      console.log('Analytics data received:', result);
      setData(result);
    } catch (err) {
      console.error('Analytics error details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  // Refresh every 5 minutes
  const interval = setInterval(fetchData, 300000);
  return () => clearInterval(interval);
}, [timeRange]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            Error loading analytics: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 hover:bg-gray-800 rounded-md"
              title="Refresh data"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-sm text-gray-400">Total Rooms</h3>
                <p className="text-2xl font-bold">{data.overview.totalRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-sm text-gray-400">Active Users</h3>
                <p className="text-2xl font-bold">{data.overview.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-sm text-gray-400">Avg. Session Duration</h3>
                <p className="text-2xl font-bold">
                  {formatDuration(data.overview.averageSessionDuration)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="text-sm text-gray-400">Code Analyses</h3>
                <p className="text-2xl font-bold">{data.overview.totalCodeAnalyses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Creation Trend */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-4">Room Creation Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rooms"
                    stroke={colors.primary}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Programming Languages */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-4">Popular Languages</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.languages}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data.languages.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Activity */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-4">Hourly Activity</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Bar dataKey="sessions" fill={colors.secondary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {data.recentActivity?.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-md hover:bg-gray-700/30"
                >
                  <div className="p-2 bg-gray-700 rounded">
                    {activity.type === 'room_created' && <Calendar className="w-4 h-4 text-blue-400" />}
                    {activity.type === 'code_analyzed' && <Brain className="w-4 h-4 text-orange-400" />}
                    {activity.type === 'language_changed' && <Code2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <div>
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}