import React from 'react';
import { BarChart3, TrendingUp, Clock, Loader2 } from 'lucide-react';

const BestPerformers = ({ bestSetup, bestInstrument, bestTimeOfDay, loading }) => {
  // Format time to AM/PM
  const formatTime = (hour) => {
    if (hour === undefined || hour === null) return 'N/A';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0-23 to 12-hour format
    return `${displayHour}:00 ${period}`;
  };

  // Format week range for display (e.g., "Jun 1 - Jun 7, 2023")
  const formatWeekRange = (weekRange) => {
    if (!weekRange) return 'N/A';
    
    // If it's already formatted, return as is
    if (typeof weekRange === 'string' && weekRange.includes(' - ')) {
      return weekRange;
    }
    
    // If it's an object with start and end dates
    if (weekRange && typeof weekRange === 'object') {
      const start = new Date(weekRange.start);
      const end = new Date(weekRange.end);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
        });
      };
      
      const formattedStart = formatDate(start);
      const formattedEnd = formatDate(end);
      
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    // Fallback to string representation
    return String(weekRange);
  };

  // Performance data mapped from props
  const performanceData = [
    {
      id: 'setup',
      title: 'Best Performing Setup',
      value: bestSetup?.name || 'No data',
      pnl: bestSetup?.pnl || 0,
      winRate: bestSetup?.win_rate || 0,
      trades: bestSetup?.trades || 0,
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
      loading: loading
    },
    {
      id: 'instrument',
      title: 'Most Profitable Instrument',
      value: bestInstrument?.symbol || 'No data',
      pnl: bestInstrument?.pnl || 0,
      winRate: bestInstrument?.win_rate || 0,
      trades: bestInstrument?.trades || 0,
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      loading: loading
    },
    {
      id: 'time',
      title: 'Best Time of Day',
      value: bestTimeOfDay?.formatted_time || 'No data',
      pnl: bestTimeOfDay?.pnl || 0,
      winRate: bestTimeOfDay?.win_rate || 0,
      trades: bestTimeOfDay?.trades || 0,
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      loading: loading
    },
  ];

  const renderLoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      ))}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {performanceData.map((item) => (
        <div 
          key={item.id}
          className="flex items-start p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex-shrink-0 p-2.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 mr-4">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {item.title}
              </h4>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.pnl >= 0 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {item.pnl >= 0 ? '+' : ''}{item.pnl.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center flex-wrap">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.id === 'week' ? formatWeekRange(item.value) : item.value}
              </p>
              <span className="mx-2 text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.winRate.toFixed(1)}% Win Rate
                </p>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.trades} {item.trades === 1 ? 'Trade' : 'Trades'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Highlights</h3>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Updating...
              </>
            ) : 'Live'}
          </span>
        </div>
      </div>
      {loading ? renderLoadingSkeleton() : renderContent()}
    </div>
  );
};

export default BestPerformers;
