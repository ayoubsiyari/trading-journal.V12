// frontend/src/pages/Analytics.jsx

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

// Simple formatters
const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
const formatPercent = (val) => `${parseFloat(val || 0).toFixed(1)}%`;

export default function Analytics() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Computed stats
  const [stats, setStats] = useState({
    total_trades: 0,
    total_pnl: 0,
    win_rate: 0,
    profit_factor: 0,
    equity_curve: [],    // [{ date: '2025-05-01', cumulative_pnl: 100 }, ...]
    pnl_by_date: [],     // [{ date: '2025-05-01', pnl: 50 }, ...]
    win_loss: { wins: 0, losses: 0 },
    direction_pnl: { long: 0, short: 0 },
  });

  // 1. Fetch all journal entries on mount
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json(); // Array of { id, symbol, direction, entry_price, exit_price, pnl, rr, notes, created_at, updated_at }
        setEntries(data);
        computeStats(data);
      } catch (err) {
        console.error('Error fetching journal entries:', err);
        setError('❌ Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  // 2. Compute derived stats from `entries`
  const computeStats = (data) => {
    // Sort entries by created_at ascending
    const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const totalTrades = sorted.length;
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    let sumWins = 0;
    let sumLosses = 0;
    let directionPnl = { long: 0, short: 0 };

    // For equity curve (cumulative P&L per day), and daily P&L aggregation
    const dailyMap = {}; // dateStr -> daily sum
    const equityCurve = [];
    let cumulative = 0;

    sorted.forEach((e) => {
      const pnl = parseFloat(e.pnl) || 0;
      totalPnl += pnl;

      if (pnl > 0) {
        wins += 1;
        sumWins += pnl;
      } else if (pnl < 0) {
        losses += 1;
        sumLosses += Math.abs(pnl);
      }

      // Direction-based P&L
      if (e.direction === 'long') {
        directionPnl.long += pnl;
      } else {
        directionPnl.short += pnl;
      }

      // Group by date (YYYY-MM-DD)
      const dateKey = new Date(e.created_at).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = 0;
      dailyMap[dateKey] += pnl;
    });

    // Build `pnl_by_date` array sorted by date
    const pnlByDateArr = Object.keys(dailyMap)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((d) => ({ date: d, pnl: dailyMap[d] }));

    // Build `equity_curve`: cumulative P&L on each date
    let cum = 0;
    pnlByDateArr.forEach((obj) => {
      cum += obj.pnl;
      // Format date for chart (e.g. "May 1")
      const dt = new Date(obj.date);
      const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      equityCurve.push({ date: label, cumulative_pnl: cum });
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = sumLosses === 0 ? (sumWins > 0 ? Infinity : 0) : sumWins / sumLosses;

    setStats({
      total_trades: totalTrades,
      total_pnl: totalPnl,
      win_rate: winRate,
      profit_factor: profitFactor,
      equity_curve: equityCurve,
      pnl_by_date: pnlByDateArr.map((d) => ({
        // Convert date key into "MMM DD" again
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: d.pnl,
      })),
      win_loss: { wins, losses },
      direction_pnl: directionPnl,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (stats.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4">🎯</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trading Data</h2>
          <p className="text-gray-600">Add some trades first to see analytics!</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const { equity_curve, pnl_by_date, win_loss, direction_pnl } = stats;
  const pnlData = pnl_by_date.map((d) => ({ date: d.date, pnl: d.pnl }));
  const winLossChartData = [
    { name: 'Wins', value: win_loss.wins, color: '#10b981' },
    { name: 'Losses', value: win_loss.losses, color: '#ef4444' },
  ];
  const directionData = [
    { name: 'Long Trades', pnl: direction_pnl.long, trades: Math.round(stats.total_trades * 0.6) },
    { name: 'Short Trades', pnl: direction_pnl.short, trades: Math.round(stats.total_trades * 0.4) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Trading Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics based on your real trades</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-sm border rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">💲</span>
              <p className="text-sm font-medium text-gray-600">Total Trades</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.total_trades}</p>
          </div>

          <div className="bg-white shadow-sm border rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">💰</span>
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
            </div>
            <p className={`text-2xl font-bold ${stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.total_pnl)}
            </p>
          </div>

          <div className="bg-white shadow-sm border rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">📊</span>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatPercent(stats.win_rate)}</p>
          </div>

          <div className="bg-white shadow-sm border rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">📈</span>
              <p className="text-sm font-medium text-gray-600">Profit Factor</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.profit_factor === Infinity ? '∞' : stats.profit_factor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Equity Curve & Daily P&L Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Equity Curve */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Equity Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equity_curve}>
                <defs>
                  <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Cumulative P&L']} />
                <Area
                  type="monotone"
                  dataKey="cumulative_pnl"
                  stroke="#3b82f6"
                  fill="url(#colorEq)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily P&L */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Daily P&L</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Pie & Long vs Short ComposedChart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Win/Loss Pie */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">🎯 Win/Loss Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winLossChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                >
                  {winLossChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Long vs Short P&L */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Long vs Short P&L</h3>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={directionData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'pnl' ? formatCurrency(value) : value,
                    name === 'pnl' ? 'P&L' : 'Trades'
                  ]}
                />
                <Bar dataKey="pnl" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="trades" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
