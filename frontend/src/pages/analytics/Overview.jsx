import React, { useState } from 'react';
import useAnalyticsData from '../../hooks/useAnalyticsData';

import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Settings,
  Filter,
  Calendar,
  AlertCircle,
  BarChart3,
  Target,
  Activity,
  Award,
  ChevronDown,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

// Helper functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;

const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatInteger = (val) =>
  val == null ? 'N/A' : parseInt(val).toLocaleString('en-US');

// Constants
const PERFORMANCE_RATINGS = {
  excellent: { 
    color: 'emerald', 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    threshold: { pnl: 0, winRate: 60 } 
  },
  good: { 
    color: 'blue', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    threshold: { pnl: 0, winRate: 50 } 
  },
  fair: { 
    color: 'amber', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    threshold: { pnl: 0 } 
  },
  poor: { 
    color: 'red', 
    bgColor: 'bg-red-50', 
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  }
};

const TIMEFRAME_OPTIONS = [
  { value: 'all', label: 'All Time', icon: Calendar },
  { value: 'month', label: 'Last 30 Days', icon: Calendar },
  { value: 'week', label: 'Last 7 Days', icon: Calendar },
  { value: 'day', label: 'Today', icon: Calendar }
];

// Utility functions
const calculatePerformanceRating = (stats) => {
  if (!stats) return null;
  const winRate = stats.win_rate || 0;
  const pnl = stats.total_pnl || 0;
  
  if (pnl >= 0 && winRate >= 60) return 'excellent';
  if (pnl >= 0 && winRate >= 50) return 'good';
  if (pnl >= 0) return 'fair';
  return 'poor';
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, valueColor, trend, isLoading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center mb-3">
          <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10 mr-3 group-hover:bg-opacity-20 transition-colors`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
        </div>
        
        <div className="mb-2">
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
          ) : (
            <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
      
      {trend && (
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
          trend > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
        }`}>
          {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="flex space-x-4">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(null).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="p-8 max-w-7xl mx-auto">
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Trading Data Available</h3>
      <p className="text-gray-500">Start trading to see your performance metrics here.</p>
    </div>
  </div>
);

export default function Overview() {
  const { stats, loading, error } = useAnalyticsData();
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [sortField, setSortField] = useState('total_trades');
  const [sortDirection, setSortDirection] = useState('desc');

  // Early returns for different states
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!stats) return <EmptyState />;

  // Calculate additional metrics with explicit number conversion and consistent decimal places
  const avgWin = stats?.win_loss?.wins && stats?.total_pnl ? 
    (Number(stats.total_pnl) / stats.win_loss.wins) : 0;
  
  const avgLoss = stats?.win_loss?.losses && stats?.total_pnl ? 
    (Number(stats.total_pnl) / stats.win_loss.losses) : 0;
  
  const riskReward = stats?.win_loss?.wins && stats?.win_loss?.losses 
    ? (() => {
        const totalTrades = stats.win_loss.wins + stats.win_loss.losses;
        const winPnl = Number(stats.total_pnl) * (stats.win_loss.wins / totalTrades);
        const lossPnl = Number(stats.total_pnl) * (stats.win_loss.losses / totalTrades);
        return lossPnl !== 0 ? Math.abs(winPnl / lossPnl) : 0;
      })()
    : 0;

  // Calculate performance rating
  const performanceRating = calculatePerformanceRating(stats);
  const ratingConfig = PERFORMANCE_RATINGS[performanceRating] || PERFORMANCE_RATINGS.poor;

  // Calculate profit factor
  // Use the profit_factor from backend for consistency
  const profitFactor = stats?.profit_factor || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Performance</h1>
              <p className="text-gray-600">Comprehensive analysis of your trading activity</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2.5 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {TIMEFRAME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {showAdvancedStats ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAdvancedStats ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>
          </div>
        </div>

        {/* Performance Rating Banner */}
        <div className={`${ratingConfig.bgColor} ${ratingConfig.borderColor} border rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${ratingConfig.bgColor} mr-4`}>
                <Award className={`h-6 w-6 ${ratingConfig.textColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Performance Rating: {performanceRating.charAt(0).toUpperCase() + performanceRating.slice(1)}
                </h3>
                <p className="text-gray-600">
                  Based on profitability (${formatNumber(stats.total_pnl)}) and win rate ({formatPercent(stats.win_rate)})
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full ${ratingConfig.bgColor} ${ratingConfig.textColor} font-medium text-sm border ${ratingConfig.borderColor}`}>
              {performanceRating.charAt(0).toUpperCase() + performanceRating.slice(1)}
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Trades"
            value={formatInteger(stats.total_trades)}
            subtitle="Total number of executed trades"
            icon={Activity}
            iconColor="text-blue-600"
            valueColor="text-gray-900"
          />
          
          <StatCard
            title="Net P&L"
            value={formatCurrency(stats.total_pnl)}
            subtitle="Total profit/loss across all trades"
            icon={DollarSign}
            iconColor={stats.total_pnl >= 0 ? "text-emerald-600" : "text-red-600"}
            valueColor={stats.total_pnl >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          
          <StatCard
            title="Win Rate"
            value={formatPercent(stats.win_rate)}
            subtitle="Percentage of profitable trades"
            icon={Target}
            iconColor="text-blue-600"
            valueColor="text-blue-600"
          />
          
          <StatCard
            title="Risk/Reward Ratio"
            value={riskReward > 0 ? `${formatNumber(riskReward)}:1` : 'N/A'}
            subtitle="Average reward per unit of risk"
            icon={TrendingUp}
            iconColor="text-indigo-600"
            valueColor="text-indigo-600"
          />
        </div>

        {/* Advanced Stats */}
        {showAdvancedStats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center mb-6">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Win</h4>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-600">
                  {avgWin > 0 ? formatCurrency(avgWin) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per winning trade</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Loss</h4>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-xl font-bold text-red-600">
                  {avgLoss < 0 ? formatCurrency(Math.abs(avgLoss)) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per losing trade</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Profit Factor</h4>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {profitFactor > 0 ? formatNumber(profitFactor) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Gross profit / Gross loss</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Wins/Losses</h4>
                  <Activity className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {stats.win_loss ? `${stats.win_loss.wins}/${stats.win_loss.losses}` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Winning vs losing trades</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Data updated in real-time • Last refresh: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}