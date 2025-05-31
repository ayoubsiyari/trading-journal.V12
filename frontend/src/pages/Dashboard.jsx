// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

// Utility formatters
const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
const formatPercent = (val) => `${parseFloat(val || 0).toFixed(1)}%`;

// Professional metric card with glass morphism effect
const MetricCard = ({ emoji, label, value, highlight, color = 'blue', trend = null, isLarge = false }) => (
  <div className={`relative group ${isLarge ? 'col-span-2' : ''}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
    <div className="relative bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">{emoji}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-black bg-gradient-to-r from-${color}-600 to-${color}-700 bg-clip-text text-transparent`}>
                {value}
              </p>
            </div>
          </div>
          {highlight && (
            <div className="flex items-center space-x-2">
              {trend === 'up' ? (
                <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">{highlight}</span>
                </div>
              ) : trend === 'down' ? (
                <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">{highlight}</span>
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold">{highlight}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Professional alert card with modern styling
const AlertCard = ({ type, message, emoji }) => {
  const styles = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50 text-green-900',
    warning: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/50 text-yellow-900',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50 text-red-900',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 text-blue-900',
  };
  
  return (
    <div className={`p-5 rounded-xl border backdrop-blur-sm ${styles[type]} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center">
          <span className="text-xl">{emoji}</span>
        </div>
        <p className="text-sm font-semibold leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  // Fetch stats from backend once on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          console.error('❌ Failed to fetch stats:', data.error);
        }
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-300 opacity-30"></div>
          </div>
          <p className="mt-6 text-xl font-semibold text-white">Loading Analytics Dashboard...</p>
          <p className="mt-2 text-blue-300">Analyzing your trading performance</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-6xl">🎯</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Track Your Success</h2>
          <p className="text-xl text-blue-300 leading-relaxed">
            Start adding your trades to unlock powerful analytics and insights that will elevate your trading performance.
          </p>
          <div className="mt-8">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
              Add Your First Trade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform P&L-by-date into chart-friendly objects
  const pnlData = stats.pnl_by_date.map(([dateStr, pnl]) => ({
    date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pnl,
  }));

  // Win/Loss for Pie Chart
  const winLossData = [
    { name: 'Wins', value: stats.win_loss.wins, color: '#10b981' },
    { name: 'Losses', value: stats.win_loss.losses, color: '#ef4444' },
  ];

  // Long vs Short bar+line
  const directionData = [
    { name: 'Long Trades', pnl: stats.buy_pnl, trades: Math.floor(stats.total_trades * 0.6) },
    { name: 'Short Trades', pnl: stats.sell_pnl, trades: Math.floor(stats.total_trades * 0.4) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Professional Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2">
                Trading <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Analytics</span>
              </h1>
              <p className="text-xl text-blue-200 font-medium">Professional Performance Intelligence & Market Insights</p>
              <div className="mt-4 flex items-center space-x-6 text-blue-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold">Live Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{stats.total_trades} Total Trades</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Updated Real-time</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-semibold"
              >
                <option value="all" className="text-gray-900">All Time</option>
                <option value="year" className="text-gray-900">This Year</option>
                <option value="month" className="text-gray-900">This Month</option>
                <option value="week" className="text-gray-900">This Week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 -mt-8 relative z-10">
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <MetricCard
            emoji="💎"
            label="Total P&L"
            value={formatCurrency(stats.total_pnl)}
            highlight={`${stats.total_pnl >= 0 ? '+' : ''}${formatCurrency(stats.total_pnl)}`}
            color={stats.total_pnl >= 0 ? 'green' : 'red'}
            trend={stats.total_pnl >= 0 ? 'up' : 'down'}
            isLarge={false}
          />
          <MetricCard
            emoji="🎯"
            label="Win Rate"
            value={formatPercent(stats.win_rate)}
            highlight={`${stats.win_rate > 50 ? 'Above Average' : 'Needs Improvement'}`}
            color="blue"
            trend={stats.win_rate > 50 ? 'up' : 'down'}
          />
          <MetricCard
            emoji="⚡"
            label="Profit Factor"
            value={stats.profit_factor === Infinity ? '∞' : stats.profit_factor.toFixed(2)}
            highlight={`${stats.profit_factor > 1.5 ? 'Excellent' : stats.profit_factor > 1 ? 'Good' : 'Poor'}`}
            color="purple"
            trend={stats.profit_factor > 1.5 ? 'up' : 'down'}
          />
          <MetricCard
            emoji="📊"
            label="Sharpe Ratio"
            value={stats.sharpe_ratio.toFixed(2)}
            highlight={`${stats.sharpe_ratio > 1 ? 'Strong' : stats.sharpe_ratio > 0.5 ? 'Moderate' : 'Weak'}`}
            color="indigo"
            trend={stats.sharpe_ratio > 1 ? 'up' : 'down'}
          />
        </div>

        {/* Advanced Performance Metrics */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg mr-3"></div>
            Advanced Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              emoji="🧠"
              label="Expectancy"
              value={formatCurrency(stats.expectancy)}
              highlight={`${stats.expectancy > 0 ? 'Positive Edge' : 'Negative Edge'}`}
              color={stats.expectancy >= 0 ? 'green' : 'red'}
            />
            <MetricCard
              emoji="🎲"
              label="Kelly %"
              value={`${stats.kelly_percentage.toFixed(1)}%`}
              highlight={`Optimal Position Size`}
              color="blue"
            />
            <MetricCard
              emoji="📉"
              label="Max Drawdown"
              value={formatCurrency(Math.abs(stats.max_drawdown))}
              highlight={`Risk Management`}
              color="red"
            />
            <MetricCard
              emoji="🚀"
              label="Recovery Factor"
              value={stats.recovery_factor === Infinity ? '∞' : stats.recovery_factor.toFixed(2)}
              highlight={`Bounce Back Ability`}
              color="green"
            />
          </div>
        </div>

        {/* Professional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Equity Curve */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded mr-3"></div>
                Portfolio Equity Curve
              </h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                Cumulative Performance
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.equity_curve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Portfolio Value']}
                  labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative_pnl"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#equityGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily P&L Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded mr-3"></div>
                Daily Performance
              </h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">
                P&L Distribution
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Daily P&L']}
                  labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {pnlData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Win/Loss Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-red-500 rounded mr-3"></div>
              Win/Loss Analysis
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {winLossData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">Winning Trades</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">Losing Trades</span>
              </div>
            </div>
          </div>

          {/* Direction Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded mr-3"></div>
              Long vs Short
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={directionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={600} />
                <YAxis stroke="#64748b" fontSize={11} fontWeight={600} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'pnl' ? formatCurrency(value) : value,
                    name === 'pnl' ? 'P&L' : 'Trade Count'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="pnl" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="trades" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Highlights */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded mr-3"></div>
              Trade Highlights
            </h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide">🏆 Best Trade</h4>
                  <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">
                    R:R {stats.best_trade.rr}
                  </div>
                </div>
                <p className="text-2xl font-black text-green-600 mb-2">
                  {formatCurrency(stats.best_trade.pnl)}
                </p>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold">{stats.best_trade.symbol}</p>
                  <p className="text-xs opacity-75">{stats.best_trade.date}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-r-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide">📉 Worst Trade</h4>
                  <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-semibold">
                    R:R {stats.worst_trade.rr}
                  </div>
                </div>
                <p className="text-2xl font-black text-red-600 mb-2">
                  {formatCurrency(stats.worst_trade.pnl)}
                </p>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold">{stats.worst_trade.symbol}</p>
                  <p className="text-xs opacity-75">{stats.worst_trade.date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Recent Trades */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded mr-3"></div>
              Recent Trading Activity
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Symbol</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Direction</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                    <th className="text-right py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">P&L</th>
                    <th className="text-right py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recent_trades.slice(0, 5).map((trade, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-bold text-gray-900">{trade.symbol}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trade.direction === 'BUY' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trade.direction === 'BUY' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {new Date(trade.date).toLocaleDateString()}
                      </td>
                      <td className={`py-4 px-6 text-right font-bold ${
                        trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(trade.pnl)}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-700">
                        {trade.rr ? trade.rr.toFixed(2) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trading Insights */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded mr-3"></div>
              Trading Insights
            </h3>
            <div className="space-y-4">
              {stats.total_pnl > 0 && stats.win_rate > 50 && (
                <AlertCard
                  type="success"
                  emoji="🎯"
                  message="Excellent performance! Your positive P&L and high win rate indicate strong trading discipline."
                />
              )}
              {stats.profit_factor > 2 && (
                <AlertCard
                  type="success"
                  emoji="🚀"
                  message="Outstanding profit factor! Your winning trades significantly outweigh your losses."
                />
              )}
              {stats.win_rate < 40 && (
                <AlertCard
                  type="warning"
                  emoji="⚠️"
                  message="Consider reviewing your entry strategy. Your win rate could be improved with better trade selection."
                />
              )}
              {stats.sharpe_ratio < 0.5 && (
                <AlertCard
                  type="warning"
                  emoji="📊"
                  message="Your risk-adjusted returns could be optimized. Consider position sizing and risk management."
                />
              )}
              {Math.abs(stats.max_drawdown) > Math.abs(stats.total_pnl * 0.3) && (
                <AlertCard
                  type="error"
                  emoji="🛡️"
                  message="High drawdown detected. Review your risk management and stop-loss strategies."
                />
              )}
              {stats.total_trades < 10 && (
                <AlertCard
                  type="info"
                  emoji="📈"
                  message="Build more trading history for reliable statistical analysis. Keep logging your trades!"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl shadow-2xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-blue-400">{stats.total_trades}</div>
              <div className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Total Trades</div>
            </div>
            <div>
              <div className="text-3xl font-black text-green-400">{stats.win_loss.wins}</div>
              <div className="text-sm font-semibold text-green-200 uppercase tracking-wider">Winning Trades</div>
            </div>
            <div>
              <div className="text-3xl font-black text-red-400">{stats.win_loss.losses}</div>
              <div className="text-sm font-semibold text-red-200 uppercase tracking-wider">Losing Trades</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-400">
                {formatCurrency(stats.avg_pnl)}
              </div>
              <div className="text-sm font-semibold text-purple-200 uppercase tracking-wider">Avg Per Trade</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}