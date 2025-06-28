import React, { useState, useCallback } from 'react';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import { 
  ChevronRight, 
  Filter,
  Settings,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Helper functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;

const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;

const formatRiskReward = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(2)}:1`;

const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatTradeStatus = (status) => {
  const statusMap = {
    'open': { color: 'bg-blue-100', text: 'text-blue-700' },
    'closed': { color: 'bg-gray-100', text: 'text-gray-700' },
    'pending': { color: 'bg-yellow-100', text: 'text-yellow-700' },
    'cancelled': { color: 'bg-red-100', text: 'text-red-700' }
  };
  
  if (!status) return statusMap['closed'];
  
  const lowerCaseStatus = status.toLowerCase();
  return statusMap[lowerCaseStatus] || statusMap['closed'];
};



export default function RecentTrades() {
  const { stats, loading, error } = useAnalyticsData();
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter trades based on selected timeframe
  const filterTradesByTimeframe = useCallback((trades) => {
    if (!trades || !Array.isArray(trades)) return [];
    
    const now = new Date();
    
    switch (selectedTimeframe) {
      case 'month':
        return trades.filter(trade => {
          const tradeDate = new Date(trade.date);
          return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
        });
      case 'year':
        return trades.filter(trade => {
          const tradeDate = new Date(trade.date);
          return tradeDate.getFullYear() === now.getFullYear();
        });
      default:
        return trades;
    }
  }, [selectedTimeframe]);

  // Sort trades with proper null checks
  const sortTrades = useCallback(() => {
    if (!stats?.recent_trades) return [];
    
    const filteredTrades = filterTradesByTimeframe(stats.recent_trades);
    
    return [...filteredTrades].sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return sortDirection === 'asc' 
            ? a.symbol.localeCompare(b.symbol) 
            : b.symbol.localeCompare(a.symbol);
        case 'direction':
          return sortDirection === 'asc' 
            ? a.direction.localeCompare(b.direction) 
            : b.direction.localeCompare(a.direction);
        case 'date':
          return sortDirection === 'asc' 
            ? new Date(a.date) - new Date(b.date) 
            : new Date(b.date) - new Date(a.date);
        case 'pnl':
          return sortDirection === 'asc' 
            ? (a.pnl || 0) - (b.pnl || 0) 
            : (b.pnl || 0) - (a.pnl || 0);
        default:
          return 0;
      }
    });
  }, [stats?.recent_trades, sortBy, sortDirection, filterTradesByTimeframe]);

  // Calculate statistics with proper null checks
  const calculateStats = useCallback(() => {
    if (!stats?.recent_trades) return null;
    
    const filteredTrades = filterTradesByTimeframe(stats.recent_trades);
    if (filteredTrades.length === 0) return null;
    
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => t.pnl > 0).length;
    const totalPnl = filteredTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const avgPnl = totalTrades > 0 ? (totalPnl / totalTrades) : 0;
    
    return {
      totalTrades,
      winRate: (winningTrades / totalTrades * 100).toFixed(1),
      avgPnl: avgPnl.toFixed(2),
      totalPnl: totalPnl.toFixed(2)
    };
  }, [stats?.recent_trades, filterTradesByTimeframe]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortIcon = (column) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };



  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔄 Trade History</h1>
              <p className="text-gray-600">Detailed view of recent trading activity</p>
            </div>
            <div className="flex space-x-4">
              <div className="relative">
                <select
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="all">All Time</option>
                  <option value="month">Current Month</option>
                  <option value="year">Current Year</option>
                </select>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Settings className="h-5 w-5 mr-2" />
                <span>Settings</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl shadow-md p-6 animate-pulse" />
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  {Array(7).fill(null).map((_, i) => (
                    <th key={i} className="px-6 py-3 bg-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {Array(7).fill(null).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-2 text-red-600">
          <Info className="h-5 w-5" />
          <span>❌ {error}</span>
        </div>
      </div>
    );
  }

  const statsData = calculateStats();
  const trades = sortTrades();

  if (!stats || !Array.isArray(stats.recent_trades) || stats.recent_trades.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <Info className="h-5 w-5" />
          <span>No recent trades available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white shadow-lg rounded-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🔄 Trade History
          </h1>
          <p className="text-gray-600">Detailed view of recent trading activity</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="all">All Time</option>
              <option value="month">Current Month</option>
              <option value="year">Current Year</option>
            </select>
          </div>
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-5 w-5 mr-2" />
            {showAdvancedStats ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>

      {/* Trade Statistics */}
      {showAdvancedStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Trade Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Trades</span>
                <span className="font-medium text-gray-900">{stats.recent_trades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Win Rate</span>
                <span className="font-medium text-green-600">
                  {formatPercent(
                    stats.recent_trades.filter(t => t.pnl > 0).length / stats.recent_trades.length * 100
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg P&L</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(
                    stats.recent_trades.reduce((sum, t) => sum + t.pnl, 0) / stats.recent_trades.length
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => handleSort('symbol')} className="flex items-center space-x-1">
                  <span>Symbol</span>
                  {sortIcon('symbol')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => handleSort('direction')} className="flex items-center space-x-1">
                  <span>Direction</span>
                  {sortIcon('direction')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => handleSort('date')} className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortIcon('date')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => handleSort('pnl')} className="flex items-center space-x-1">
                  <span>P&L</span>
                  {sortIcon('pnl')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                R:R
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortTrades().map((trade, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{trade.symbol}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      trade.direction.toLowerCase() === 'long'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <ChevronRight className="h-4 w-4 mr-1" />
                    {trade.direction}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{trade.date}</td>
                <td
                  className={`px-6 py-4 text-right font-semibold ${
                    trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(trade.pnl)}
                </td>
                <td className="px-6 py-4 text-right text-gray-700">
                  {formatRiskReward(trade.rr)}
                </td>
                <td className="px-6 py-4 text-right text-gray-700">
                  {formatDuration(trade.duration)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      formatTradeStatus(trade.status).color
                    } ${formatTradeStatus(trade.status).text}`}
                  >
                    {trade.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
