import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Award, 
  Calendar as CalendarIcon,
  Clock,
  BarChart2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Snowflake,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings,
  Download
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, isSameDay, addDays } from 'date-fns';

// Helper functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toLocaleString('en-US');

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
};

const StreakCard = ({ title, value, subtitle, icon: Icon, iconColor, trend, trendText, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    );
  }


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColor || 'bg-blue-100 dark:bg-blue-900/30'} text-${iconColor?.replace('bg-', 'text-') || 'blue-500'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
          <span className={`ml-2 text-sm flex items-center ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      {trendText && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          {trend > 0 ? (
            <Flame className="h-3 w-3 text-red-500 mr-1" />
          ) : trend < 0 ? (
            <Snowflake className="h-3 w-3 text-blue-500 mr-1" />
          ) : null}
          {trendText}
        </p>
      )}
    </div>
  );
};

const StreakAnalyzer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streakData, setStreakData] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [showDetails, setShowDetails] = useState(false);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/journal/streaks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }
      
      const data = await response.json();
      setStreakData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError('Failed to load streak data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreakData();
  }, [timeframe]);

  const renderStreakCards = () => {
    if (!streakData) return null;

    const { current_streak, longest_winning_streak, longest_losing_streak } = streakData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StreakCard
          title="Current Streak"
          value={`${current_streak.count} ${current_streak.type === 'winning' ? 'Wins' : current_streak.type === 'losing' ? 'Losses' : ''}`}
          subtitle={current_streak.start_date ? `${formatDate(current_streak.start_date)} - ${formatDate(current_streak.end_date)}` : 'No active streak'}
          icon={current_streak.type === 'winning' ? TrendingUp : current_streak.type === 'losing' ? TrendingDown : Activity}
          iconColor={
            current_streak.type === 'winning' 
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : current_streak.type === 'losing' 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }
          trendText={
            current_streak.type === 'winning' 
              ? `${current_streak.count} ${current_streak.count === 1 ? 'win' : 'wins'} in a row!` 
              : current_streak.type === 'losing' 
                ? `${current_streak.count} ${current_streak.count === 1 ? 'loss' : 'losses'} in a row` 
                : 'No active streak'
          }
          isLoading={loading}
        />
        
        <StreakCard
          title="Longest Winning Streak"
          value={`${longest_winning_streak.count} Wins`}
          subtitle={longest_winning_streak.start_date ? `${formatDate(longest_winning_streak.start_date)} - ${formatDate(longest_winning_streak.end_date)}` : 'No winning streaks'}
          icon={Award}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          trend={longest_winning_streak.pnl > 0 ? 100 : 0}
          trendText={`Total P&L: ${formatCurrency(longest_winning_streak.pnl)}`}
          isLoading={loading}
        />
        
        <StreakCard
          title="Longest Losing Streak"
          value={`${longest_losing_streak.count} Losses`}
          subtitle={longest_losing_streak.start_date ? `${formatDate(longest_losing_streak.start_date)} - ${formatDate(longest_losing_streak.end_date)}` : 'No losing streaks'}
          icon={AlertCircle}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          trend={longest_losing_streak.pnl < 0 ? -100 : 0}
          trendText={`Total P&L: ${formatCurrency(longest_losing_streak.pnl)}`}
          isLoading={loading}
        />
      </div>
    );
  };
  const renderStreakHistory = () => {
    if (!streakData || !streakData.all_streaks || streakData.all_streaks.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No streak history available</p>
        </div>
      );
    }

    const reversedStreaks = [...streakData.all_streaks].reverse();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Streak History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Length
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Period
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reversedStreaks.map((streak, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {streak.type === 'winning' ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Winning</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Losing</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {streak.count} {streak.count === 1 ? 'trade' : 'trades'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(streak.start_date)} to {formatDate(streak.end_date)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    streak.pnl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(streak.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!streakData || !streakData.all_streaks || streakData.all_streaks.length === 0) {
      return null;
    }

    // Prepare data for the charts
    const winningStreaks = streakData.all_streaks.filter(s => s.type === 'winning');
    const losingStreaks = streakData.all_streaks.filter(s => s.type === 'losing');

    // Prepare data for the streak length distribution chart
    const streakLengths = {
      '1': 0, '2-3': 0, '4-5': 0, '6-10': 0, '10+': 0
    };

    streakData.all_streaks.forEach(streak => {
      if (streak.count === 1) {
        streakLengths['1']++;
      } else if (streak.count <= 3) {
        streakLengths['2-3']++;
      } else if (streak.count <= 5) {
        streakLengths['4-5']++;
      } else if (streak.count <= 10) {
        streakLengths['6-10']++;
      } else {
        streakLengths['10+']++;
      }
    });

    const streakLengthData = Object.entries(streakLengths).map(([range, count]) => ({
      range,
      count,
      type: 'winning' // Just for coloring, we'll handle that in the render
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Streak Length Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Streak Length Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={streakLengthData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="range" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value) => [`${value} ${value === 1 ? 'streak' : 'streaks'}`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}
                  fill="#8884d8"
                >
                  {streakLengthData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.range === '1' ? '#ef4444' :
                        entry.range === '2-3' ? '#f59e0b' :
                        entry.range === '4-5' ? '#10b981' :
                        entry.range === '6-10' ? '#3b82f6' : '#8b5cf6'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div> 1 trade</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div> 2-3 trades</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> 4-5 trades</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div> 6-10 trades</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div> 10+ trades</div>
          </div>
        </div>

        {/* Win/Loss Streak Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Win/Loss Streak Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { 
                    name: 'Winning', 
                    count: winningStreaks.length,
                    avgLength: winningStreaks.reduce((sum, s) => sum + s.count, 0) / (winningStreaks.length || 1),
                    avgPnl: winningStreaks.reduce((sum, s) => sum + s.pnl, 0) / (winningStreaks.length || 1)
                  },
                  { 
                    name: 'Losing', 
                    count: losingStreaks.length,
                    avgLength: losingStreaks.reduce((sum, s) => sum + s.count, 0) / (losingStreaks.length || 1),
                    avgPnl: losingStreaks.reduce((sum, s) => sum + s.pnl, 0) / (losingStreaks.length || 1)
                  }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value, name, props) => {
                    if (name === 'Average Length') {
                      return [value.toFixed(1) + ' trades', name];
                    } else if (name === 'Average P&L') {
                      return [formatCurrency(value), name];
                    } else {
                      return [value, name];
                    }
                  }}
                />
                <Bar 
                  dataKey="avgLength" 
                  name="Average Length" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="avgPnl" 
                  name="Average P&L" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {value}
                    </span>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={fetchStreakData}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Streak Analyzer</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyze your winning and losing streaks to identify patterns in your trading performance
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <button
            onClick={fetchStreakData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {renderStreakCards()}
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Streak Analytics</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showDetails && renderCharts()}
        
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Streak History
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
              (Showing {streakData?.all_streaks?.length || 0} streaks)
            </span>
          </h3>
          {renderStreakHistory()}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Understanding Streaks</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Analyzing your winning and losing streaks can help you identify patterns in your trading performance. 
          Look for trends in your streak lengths and the P&L associated with different types of streaks to 
          improve your trading strategy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Winning Streaks</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Track your longest winning streaks to understand what's working well in your strategy.
            </p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Losing Streaks</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Identify and analyze losing streaks to recognize when to adjust your approach.
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-medium text-purple-800 dark:text-purple-200">Streak Patterns</h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Look for recurring patterns in your streaks to optimize your entry and exit strategies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakAnalyzer;
