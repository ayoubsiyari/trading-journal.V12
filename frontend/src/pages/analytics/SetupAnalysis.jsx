
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Settings,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  TrendingUp,
  TrendingDown,
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

const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export default function SetupAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [sortBy, setSortBy] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchStrategyStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/strategy-analysis', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch strategy data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('❌ Error loading strategy data:', err);
        setError(err.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchStrategyStats();
  }, []);

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
          <Info className="h-5 w-5" />
          <span>❌ {error}</span>
        </div>
      </div>
    );
  }

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

  const sortedData = () => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      if (sortBy === 'strategy') {
        return sortDirection === 'asc' 
          ? a.strategy.localeCompare(b.strategy) 
          : b.strategy.localeCompare(a.strategy);
      }
      if (sortBy === 'pnl') {
        return sortDirection === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl;
      }
      if (sortBy === 'win_rate') {
        return sortDirection === 'asc' ? a.win_rate - b.win_rate : b.win_rate - a.win_rate;
      }
      return 0;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-white shadow-lg rounded-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Setup Analysis
          </h1>
          <p className="text-gray-600">Detailed performance analysis by trading setups</p>
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

      {/* Main Metrics */}
      {showAdvancedStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Total P&L</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(
                data.reduce((sum, d) => sum + d.pnl, 0)
              )}
            </p>
            <p className="text-sm text-gray-500">
              Total profit/loss across all setups
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Avg Win Rate</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatPercent(
                data.reduce((sum, d) => sum + (d.win_rate || 0), 0) / data.length
              )}
            </p>
            <p className="text-sm text-gray-500">
              Average win rate across setups
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">Avg R:R</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatRiskReward(
                data.reduce((sum, d) => sum + (d.avg_rr || 0), 0) / data.length
              )}
            </p>
            <p className="text-sm text-gray-500">
              Average risk-reward ratio
            </p>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Strategy</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Trades</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Win Rate</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Avg R:R</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-200">
                <td className="py-2 px-4 font-medium text-gray-800">{row.strategy || '—'}</td>
                <td className="py-2 px-4 text-gray-700">{row.trades}</td>
                <td className="py-2 px-4 text-gray-700">{formatPercent(row.win_rate)}</td>
                <td className="py-2 px-4 text-gray-700">{row.avg_rr?.toFixed(2) || 'N/A'}</td>
                <td className="py-2 px-4 font-semibold text-right">
                  <span className={row.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(row.pnl)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">P&L by Strategy</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="strategy" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value), "P&L"]} />
            <Bar dataKey="pnl">
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
