// CAD - Claude Assisted Development
import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { 
  Clock, Users, Code2, Brain, Loader2, RefreshCw,
  Activity, ArrowUpRight, Terminal, GitBranch
} from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',   // Blue
  secondary: '#10b981', // Green
  accent: '#8b5cf6',    // Purple
  gray: '#4b5563',      // Subtle gray
  chart: ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const StatCard = ({ icon: Icon, label, value, trend, description }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-blue-500/20">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span className={`flex items-center text-sm ${
              trend > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              <ArrowUpRight className="w-4 h-4" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className }) => (
  <div className={`bg-gray-800/50 rounded-lg border border-gray-700 p-6 ${className}`}>
    <h3 className="text-lg font-medium mb-4">{title}</h3>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {
            entry.dataKey === 'avgCodingTime' ? 
              formatDuration(entry.value) : 
              entry.value
          }
        </p>
      ))}
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getIconAndColor = (type) => {
    switch (type) {
      case 'code_change':
        return { Icon: Code2, color: 'text-blue-400' };
      case 'code_analyzed':
        return { Icon: Brain, color: 'text-purple-400' };
      case 'language_changed':
        return { Icon: Terminal, color: 'text-green-400' };
      default:
        return { Icon: Activity, color: 'text-gray-400' };
    }
  };

  const { Icon, color } = getIconAndColor(activity.type);

  return (
    <div className="flex items-start gap-4 p-3 rounded-md hover:bg-gray-700/30">
      <div className={`p-2 bg-gray-700 rounded ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm">{activity.description}</p>
        <p className="text-xs text-gray-400">
          {new Date(activity.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState({
    overview: {
      activeRooms: 0,
      totalParticipants: 0,
      avgSessionDuration: 0,
      avgCodingTimePerParticipant: 0
    },
    trends: [],
    languages: [],
    activity: [],
    codingMetrics: {
      avgSolutionTime: 0,
      completionRate: 0,
      languageDistribution: []
    }
  });  

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/analytics/dashboard?range=${timeRange}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
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
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Active Rooms"
            value={data.overview.activeRooms}
            description="Currently in progress"
          />
          <StatCard
            icon={Clock}
            label="Avg. Session"
            value={formatDuration(data.overview.avgSessionDuration)}
            description="Interview duration"
          />
          <StatCard
            icon={Code2}
            label="Avg. Coding Time"
            value={formatDuration(data.overview.avgCodingTimePerParticipant)}
            description="Per participant"
          />
          <StatCard
            icon={Brain}
            label="Code Reviews"
            value={data.codingMetrics?.completionRate ?? 0}
            description="AI analysis used"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Activity Trend */}
          <ChartCard title="Interview Sessions">
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorSessions)"
              />
            </AreaChart>
          </ChartCard>

          {/* Language Distribution */}
          <ChartCard title="Popular Languages">
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.chart[index % COLORS.chart.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ChartCard>

          {/* Coding Time Distribution */}
          <ChartCard title="Average Coding Time by Language">
            <BarChart data={data.languages.map(lang => ({
              name: lang.name,
              avgCodingTime: lang.avgCodingTime
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={(value) => formatDuration(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgCodingTime" fill={COLORS.secondary} />
            </BarChart>
          </ChartCard>

          {/* Recent Activity */}
          <ChartCard title="Recent Activity">
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {data.activity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}