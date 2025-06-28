import React, { useState } from 'react';

import { AlertCircle } from 'lucide-react'

import useAnalyticsData from '../../hooks/useAnalyticsData';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowLeftRight,
  Download,
  Settings
} from 'lucide-react';

// Enhanced formatting functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;

const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;

const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export default function Breakdowns() {
  const { stats, loading, error } = useAnalyticsData();
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); // 'all', 'month', 'week', 'day'
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 text-red-600">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    </div>
  );
  
  if (!stats) return (
    <div className="p-6 text-gray-500">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-5 w-5" />
        <span>No data available.</span>
      </div>
    </div>
  );

  // Enhanced data calculations
  const winLossData = [
    { name: 'Wins', value: stats.win_loss?.wins || 0, color: '#10b981', percentage: ((stats.win_loss?.wins || 0) / ((stats.win_loss?.wins || 0) + (stats.win_loss?.losses || 0)) * 100).toFixed(1) },
    { name: 'Losses', value: stats.win_loss?.losses || 0, color: '#ef4444', percentage: ((stats.win_loss?.losses || 0) / ((stats.win_loss?.wins || 0) + (stats.win_loss?.losses || 0)) * 100).toFixed(1) }
  ];

  const directionData = [
    { 
      name: 'Long', 
      pnl: stats.buy_pnl || 0,
      percentage: ((stats.buy_pnl || 0) / ((stats.buy_pnl || 0) + Math.abs(stats.sell_pnl || 0)) * 100).toFixed(1)
    },
    { 
      name: 'Short', 
      pnl: stats.sell_pnl || 0,
      percentage: ((Math.abs(stats.sell_pnl || 0)) / ((stats.buy_pnl || 0) + Math.abs(stats.sell_pnl || 0)) * 100).toFixed(1)
    }
  ];

  // Calculate additional metrics
  const winRate = ((stats.win_loss?.wins || 0) / ((stats.win_loss?.wins || 0) + (stats.win_loss?.losses || 0)) * 100).toFixed(1);
  const avgWin = stats.win_loss?.wins ? (stats.total_pnl / stats.win_loss.wins).toFixed(2) : 0;
  const avgLoss = stats.win_loss?.losses ? (stats.total_pnl / stats.win_loss.losses).toFixed(2) : 0;
  const riskReward = stats.win_loss?.wins && stats.win_loss?.losses ? 
    Math.abs((stats.total_pnl / stats.win_loss.wins) / (stats.total_pnl / stats.win_loss.losses)).toFixed(2) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-xl space-y-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Breakdown</h1>
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
            <Settings className="h-5 w-5 mr-2" />
            {showAdvancedStats ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Win/Loss Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <PieIcon className="h-6 w-6 text-blue-600 mr-2" />
              Win/Loss Distribution
            </h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Win Rate: {winRate}%
              </span>
            </div>
          </div>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {winLossData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  formatter={(value, name) => [
                    `${name}: ${value} (${winLossData.find(d => d.name === name).percentage}%)`,
                    'Trades'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {showAdvancedStats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Average Win</h4>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(avgWin)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Average Loss</h4>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(avgLoss)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Directional Analysis */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowUpDown className="h-6 w-6 text-blue-600 mr-2" />
              Directional Analysis
            </h3>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Risk/Reward: {riskReward}x
              </span>
            </div>
          </div>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={directionData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis tickFormatter={(v) => `$${v}`} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  formatter={(value) => [formatCurrency(value), 'P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {directionData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.pnl >= 0
                          ? entry.name === 'Long'
                            ? '#10b981'
                            : '#3b82f6'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {showAdvancedStats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Long %</h4>
                <p className="text-lg font-semibold text-green-600">{directionData[0].percentage}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Short %</h4>
                <p className="text-lg font-semibold text-blue-600">{directionData[1].percentage}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
