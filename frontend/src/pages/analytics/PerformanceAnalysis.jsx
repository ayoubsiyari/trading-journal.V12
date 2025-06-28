import React, { useCallback } from 'react';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import BestPerformers from '../../components/analytics/BestPerformers';
import PerformanceByTime from '../../components/analytics/PerformanceByTime';
import PerformanceByWeek from '../../components/analytics/PerformanceByWeek';
import InteractivePerformanceChart from '../../components/analytics/InteractivePerformanceChart';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Settings
} from 'lucide-react';

const PerformanceAnalysis = () => {
  const { 
    loading, 
    error,
    performanceData,
    performanceLoading,
    performanceError,
    refreshPerformanceData 
  } = useAnalyticsData();

  // Process weekly performance data for the interactive chart
  const chartData = React.useMemo(() => {
    if (!performanceData?.weekly_performance?.length) {
      console.log('No weekly performance data available');
      return [];
    }
    
    const processedData = performanceData.weekly_performance.map(week => {
      // Create a proper date string in YYYY-MM-DD format
      const dateStr = week.week_start || (week.formatted_range ? week.formatted_range.split(' - ')[0] : null);
      let date = new Date();
      
      try {
        if (dateStr) {
          // Try to parse the date string
          date = new Date(dateStr);
          // If invalid date, use current date as fallback
          if (isNaN(date.getTime())) date = new Date();
        }
      } catch (e) {
        console.error('Error parsing date:', dateStr, e);
        date = new Date();
      }
      
      return {
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        timestamp: date.getTime(), // For proper sorting
        pnl: Number(week.pnl) || 0,
        winRate: Number(week.win_rate) || 0,
        trades: Number(week.trades) || 0,
        weekNumber: week.week_num,
        year: week.year,
        formatted_range: week.formatted_range || `Week ${week.week_num}, ${week.year}`
      };
    });
    
    // Sort by timestamp to ensure correct order
    processedData.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Processed chart data:', processedData);
    return processedData;
  }, [performanceData?.weekly_performance]);

  const handleRefresh = useCallback(() => {
    refreshPerformanceData();
  }, [refreshPerformanceData]);

  // Loading state
  if (loading || performanceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"></div>
            ))}
          </div>
          <div className="h-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"></div>
        </div>
      </div>
    );
  }

  // Show loading state if data is being fetched
  if (loading || performanceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"></div>
            <div className="h-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || performanceError) {
    const errorMessage = error || performanceError;
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Error loading performance data: {errorMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleRefresh}
                className="text-red-700 dark:text-red-300 hover:text-red-500 dark:hover:text-red-200"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Analysis</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyze your trading performance and identify your strengths and weaknesses
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Calendar className="-ml-1 mr-2 h-4 w-4" />
            Date Range
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter className="-ml-1 mr-2 h-4 w-4" />
            Filters
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading || performanceLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || performanceLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${(loading || performanceLoading) ? 'animate-spin' : ''}`} />
            {(loading || performanceLoading) ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="space-y-6">
        <InteractivePerformanceChart 
          data={chartData}
          loading={performanceLoading}
          height={300}
          title="Weekly Performance Overview"
          description="Track your trading performance week over week"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceByTime 
            hourlyPerformance={performanceData.hourly_performance} 
            loading={performanceLoading} 
          />
          <PerformanceByWeek 
            weeklyPerformance={performanceData.weekly_performance}
            loading={performanceLoading}
          />
        </div>
        
        <BestPerformers 
          bestSetup={performanceData.best_setup}
          bestInstrument={performanceData.best_instrument}
          bestTimeOfDay={performanceData.best_time_of_day}
          bestWeek={performanceData.best_week}
          loading={performanceLoading}
        />
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
