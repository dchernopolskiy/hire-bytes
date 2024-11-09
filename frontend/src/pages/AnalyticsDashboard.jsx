import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { 
  Calendar, Clock, Users, Code2, Brain, Loader2,
  TrendingUp, Languages, Activity, ArrowUpRight
} from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#059669',
  chart: ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const formatDate = (isoString) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoString));
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
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'room_created': return Calendar;
      case 'code_analyzed': return Brain;
      case 'language_changed': return Code2;
      default: return Activity;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'room_created': return 'text-blue-400';
      case 'code_analyzed': return 'text-orange-400';
      case 'language_changed': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const Icon = getIcon(activity.type);
  const colorClass = getColor(activity.type);

  return (
    <div className="flex items-start gap-4 p-3 rounded-md hover:bg-gray-700/30">
      <div className={`p-2 bg-gray-700 rounded ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm">{formatActivityDescription(activity)}</p>
        <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
      </div>
    </div>
  );
};

const formatActivityDescription = (activity) => {
  const eventName = activity.type.replace(/_/g, ' ');
  const username = activity.username || `User ${activity.userId?.substring(0, 6)}`;
  return `${username} ${eventName}`;
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
    dailyActivity: [],
    recentActivity: [],
    userRetention: [],
    codeAnalytics: {
      averageLength: 0,
      totalLines: 0,
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

  const trends = useMemo(() => data.trends.map(trend => ({
    ...trend,
    date: new Date(trend.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  })), [data.trends]);

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
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            label="Total Rooms"
            value={data.overview.totalRooms}
            trend={12} // Example trend
            description="Total rooms created"
          />
          <StatCard
            icon={Users}
            label="Active Users"
            value={data.overview.activeUsers}
            trend={8}
            description="Unique users in period"
          />
          <StatCard
            icon={Clock}
            label="Avg. Session"
            value={formatDuration(data.overview.averageSessionDuration)}
            description="Average session duration"
          />
          <StatCard
            icon={Brain}
            label="Code Analyses"
            value={data.overview.totalCodeAnalyses}
            trend={15}
            description="AI analyses performed"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Room Creation Trend">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="rooms"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorRooms)"
              />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Language Distribution">
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

          <ChartCard title="Daily Activity">
            <BarChart data={data.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tickFormatter={date => new Date(date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sessions" fill={COLORS.secondary} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Recent Activity">
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {data.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Code Analytics Section */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-medium mb-4">Code Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Average Code Length</p>
              <p className="text-2xl font-bold">{data.codeAnalytics?.averageLength || 0} lines</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Total Code Written</p>
              <p className="text-2xl font-bold">{data.codeAnalytics?.totalLines || 0} lines</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Most Used Language</p>
              <p className="text-2xl font-bold">
                {data.languages[0]?.name || 'JavaScript'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}