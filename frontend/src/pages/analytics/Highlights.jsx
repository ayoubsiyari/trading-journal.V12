import React, { useState } from 'react';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import { Calendar, Clock, TrendingDown, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper functions
// Helper functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;

const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;

const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export default function Highlights() {
  const { stats, loading, error } = useAnalyticsData();
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-2 text-red-600">
          <TrendingDown className="h-5 w-5" />
          <span>❌ {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          <TrendingDown className="h-8 w-8 mx-auto mb-2" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-white shadow-lg rounded-xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📊 Time-Based Performance</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="week">Last Week</option>
              <option value="day">Today</option>
            </select>
          </div>
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Filter className="h-5 w-5 mr-2" />
            {showAdvancedStats ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Best Day of Week</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-800">
                {stats.best_day_of_week?.day || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Best performing day</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.best_day_of_week?.pnl)}
              </p>
              <p className="text-sm text-gray-500">P&L</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Calendar className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Worst Day of Week</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-800">
                {stats.worst_day_of_week?.day || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Worst performing day</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats.worst_day_of_week?.pnl)}
              </p>
              <p className="text-sm text-gray-500">P&L</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Clock className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Best Trading Hour</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-800">
                {stats.best_hour?.hour != null ? `${stats.best_hour.hour}:00` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Peak performance time</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.best_hour?.pnl)}
              </p>
              <p className="text-sm text-gray-500">P&L</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Clock className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Worst Trading Hour</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-800">
                {stats.worst_hour?.hour != null ? `${stats.worst_hour.hour}:00` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Lowest performance time</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats.worst_hour?.pnl)}
              </p>
              <p className="text-sm text-gray-500">P&L</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <TrendingDown className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Max Drawdown</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-2xl font-bold text-red-600">
                {stats.max_drawdown_percent != null
                  ? `${parseFloat(stats.max_drawdown_percent).toFixed(2)}%`
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Maximum account drawdown</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Stats */}
      {showAdvancedStats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <Filter className="h-6 w-6 text-blue-600 mr-2" />
            Advanced Time Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">Daily Patterns</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Daily P&L</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(stats.avg_daily_pnl)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Win Rate</span>
                  <span className="font-medium text-green-600">
                    {formatPercent(stats.daily_win_rate)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">Intraday Performance</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Hourly P&L</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(stats.avg_hourly_pnl)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hourly Win Rate</span>
                  <span className="font-medium text-green-600">
                    {formatPercent(stats.hourly_win_rate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
