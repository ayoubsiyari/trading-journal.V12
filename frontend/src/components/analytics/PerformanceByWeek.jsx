import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid,
  LabelList
} from 'recharts';
import { Calendar, Loader2, TrendingUp, BarChart3, Target } from 'lucide-react';

const PerformanceByWeek = ({ weeklyPerformance = [], loading = false }) => {
  // Process the weekly performance data for the chart
  const chartData = useMemo(() => {
    if (!weeklyPerformance || weeklyPerformance.length === 0) {
      return [];
    }
    
    // Sort by week
    return [...weeklyPerformance]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week_num - b.week_num;
      })
      .map(weekData => ({
        ...weekData,
        pnl: weekData.pnl || 0,
        winRate: weekData.win_rate || 0,
        trades: weekData.trades || 0,
        // Shorten the label for better display
        weekLabel: `W${weekData.week_num} ${weekData.year}`
      }));
  }, [weeklyPerformance]);
  
  // Find the best performing week
  const bestWeek = useMemo(() => {
    if (!weeklyPerformance || weeklyPerformance.length === 0) return null;
    
    return weeklyPerformance.reduce((best, current) => {
      return (current.pnl > (best?.pnl || -Infinity)) ? current : best;
    }, null);
  }, [weeklyPerformance]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Performance</h3>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Loading...
            </span>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // No data state
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No weekly performance data available</p>
          <p className="text-sm text-gray-400">Trade during different weeks to see performance metrics</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{data.formatted_range}</p>
          <p className="text-sm">
            <span className="text-gray-500">P&L: </span>
            <span className={data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${data.pnl.toFixed(2)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Win Rate: </span>
            <span className="font-medium">{data.winRate.toFixed(1)}%</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Trades: </span>
            <span className="font-medium">{data.trades}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate chart domain for better visualization
  const maxPnl = Math.max(...chartData.map(d => Math.abs(d.pnl)));
  const domain = [-maxPnl * 1.1, maxPnl * 1.1];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Weekly Performance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your performance across different weeks
            </p>
          </div>
          
          {bestWeek && (
            <div className="mt-4 md:mt-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Best Week</p>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-500 mr-1.5" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {bestWeek.formatted_range}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  bestWeek.pnl >= 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {bestWeek.pnl >= 0 ? '+' : ''}{bestWeek.pnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
              barCategoryGap={4}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={domain}
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey="weekLabel" 
                type="category" 
                width={60}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} 
                    className="transition-all duration-200 hover:opacity-80"
                  />
                ))}
                <LabelList 
                  dataKey="pnl" 
                  position="right" 
                  formatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}`}
                  style={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              <span>Total Trades</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {chartData.reduce((sum, week) => sum + week.trades, 0)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              <span>Avg. Weekly P&L</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {chartData.length > 0 
                ? `$${(chartData.reduce((sum, week) => sum + week.pnl, 0) / chartData.length).toFixed(2)}`
                : '$0.00'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Target className="w-4 h-4 mr-1.5" />
              <span>Win Rate</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {chartData.length > 0 
                ? `${(chartData.reduce((sum, week) => sum + week.winRate, 0) / chartData.length).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceByWeek;
