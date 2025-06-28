// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import AISummary from '../components/AISummary';
import Calendar from '../components/calendar/Calendar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
} from 'recharts';
import CalendarDay from '../components/calendar/CalendarDay';
import DayTradeModal from '../components/calendar/DayTradeModal';

const colorClasses = {
  profit: 'text-green-600 dark:text-green-400',
  loss: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-500 dark:text-gray-400',
};

// Utility formatters
const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;
const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;
const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [error, setError] = useState('');
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Add dark mode class to body element
    const body = document.querySelector('body');
    if (body && body.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }

    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  const fetchAiSummary = async () => {
    setLoadingAiSummary(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/journal/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats, language }),
      });
      if (!res.ok) throw new Error('Failed to fetch AI summary');
      const data = await res.json();
      setAiSummary(data.summary);
      setShowAiSummary(true);
    } catch (err) {
      console.error('Error fetching AI summary:', err);
      setAiSummary('Failed to generate AI summary. Please try again.');
      setShowAiSummary(true);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-12">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-2 border-indigo-300 dark:border-indigo-600 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
            <div className="absolute inset-6 border-2 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin animation-delay-300"></div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-700 dark:from-slate-200 dark:via-indigo-300 dark:to-blue-300 bg-clip-text text-transparent mb-4">Loading Analytics</h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Preparing your professional trading dashboard...</p>
          <div className="mt-8 flex justify-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full animate-bounce shadow-lg"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce animation-delay-75 shadow-lg"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full animate-bounce animation-delay-150 shadow-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/30 rounded-3xl flex items-center justify-center shadow-2xl border border-red-200/50 dark:border-red-800/50">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-red-800 dark:from-white dark:to-red-400 bg-clip-text text-transparent mb-6">Connection Error</h2>
          <p className="text-lg text-red-600 dark:text-red-400 font-medium mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-10 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:via-rose-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/25 border border-red-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no stats or no trades, show placeholder
  if (!stats || stats.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto p-12">
          <div className="w-40 h-40 mx-auto mb-16 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 rounded-3xl flex items-center justify-center shadow-2xl border border-indigo-200/50 dark:border-indigo-800/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-blue-800 dark:from-white dark:via-indigo-200 dark:to-blue-200 bg-clip-text text-transparent mb-8">Welcome to Trading Analytics</h2>
          <p className="text-2xl text-slate-600 dark:text-slate-400 mb-16 leading-relaxed font-medium">Start by adding your first trade to unlock comprehensive performance insights and advanced analytics.</p>
          <div className="flex items-center justify-center space-x-12 text-lg text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg"></div>
              <span className="font-semibold">Performance Tracking</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
              <span className="font-semibold">AI Insights</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg"></div>
              <span className="font-semibold">Risk Analysis</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pnlData =
    Array.isArray(stats.pnl_by_date) && stats.pnl_by_date.length > 0
      ? stats.pnl_by_date.map(([dateStr, pnlValue]) => ({
          date: new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          pnl: pnlValue,
        }))
      : [];

  const equityCurveData =
    Array.isArray(stats.equity_curve) && stats.equity_curve.length > 0
      ? stats.equity_curve.map((pt) => ({
          date: pt.date,
          cumulative_pnl: pt.cumulative_pnl,
        }))
      : [];

  const winLossData = [
    { name: 'Wins', value: stats.win_loss?.wins || 0, color: '#10b981' },
    { name: 'Losses', value: stats.win_loss?.losses || 0, color: '#ef4444' },
  ];

  const directionData = [
    { name: 'Long Trades', pnl: stats.buy_pnl || 0, trades: Math.floor(stats.total_trades * 0.6) },
    { name: 'Short Trades', pnl: stats.sell_pnl || 0, trades: Math.floor(stats.total_trades * 0.4) },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* PROFESSIONAL HEADER */}
      <div className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg">
        <div className="max-w-full mx-auto px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-8 lg:space-y-0">
            {/* Enhanced Brand Section */}
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300 border border-indigo-500/20">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-800 to-blue-800 dark:from-white dark:via-indigo-200 dark:to-blue-200 bg-clip-text text-transparent">
                  Trading Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">Professional Performance Dashboard</p>
              </div>
            </div>
            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-6 sm:space-y-0 sm:space-x-6">
              {/* Status Indicator */}
              <div className="flex items-center space-x-8 px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Data</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100 bg-white/70 dark:bg-slate-800/70 px-4 py-2 rounded-xl shadow-sm">
                  {stats.total_trades} Trades
                </div>
              </div>
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-6 py-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
              {/* Language Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 border-2 border-slate-200/50 dark:border-slate-600/50 shadow-lg">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    language === 'en'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg transform scale-105 border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    language === 'ar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg transform scale-105 border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  AR
                </button>
              </div>
              {/* AI Insights Button */}
              <button
                onClick={fetchAiSummary}
                disabled={loadingAiSummary}
                className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed shadow-2xl hover:shadow-indigo-500/25 transform hover:scale-105 disabled:transform-none border border-indigo-500/20"
              >
                {loadingAiSummary ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Insights
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAiSummary && (
        <AISummary summary={aiSummary} language={language} onClose={() => setShowAiSummary(false)} />
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <div className="w-full px-8 py-12">
        
        {/* TOP SECTION: CALENDAR, HERO METRICS, TRADE HIGHLIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          {/* TRADING CALENDAR - LEFT HALF */}
          <div className="lg:col-span-6">
            {/* CALENDAR DAYS VIEW */}
        <div className="mb-10">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <CalendarDaysView stats={stats} />
          </div>
        </div>
          </div>

          {/* HERO METRICS AND TRADE HIGHLIGHTS - RIGHT HALF */}
          <div className="lg:col-span-6 flex flex-col gap-10">
            {/* HERO METRICS SECTION */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-emerald-500/10 transition-all duration-500">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-8 lg:mb-0">
                  <div className="flex items-center space-x-5 mb-6">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full shadow-xl"></div>
                    <h2 className="text-2xl font-black text-slate-700 dark:text-slate-300">Total Portfolio Value</h2>
                  </div>
                  <p className={`text-7xl font-black mb-8 ${stats.total_pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(stats.total_pnl)}
                  </p>
                  <div className="flex items-center space-x-8 text-base">
                    <span className={`px-6 py-3 rounded-2xl text-sm font-black shadow-xl border ${
                      stats.total_pnl >= 0 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                    }`}>
                      {stats.total_pnl >= 0 ? '↗ Profitable Portfolio' : '↘ Loss Position'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-black bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                      {stats.total_trades} trades executed
                    </span>
                  </div>
                </div>
                
                <div className="lg:w-96 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurveData.slice(-12)}>
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stats.total_pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                          <stop offset="50%" stopColor={stats.total_pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={stats.total_pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="cumulative_pnl"
                        stroke={stats.total_pnl >= 0 ? '#10b981' : '#ef4444'}
                        fill="url(#heroGradient)"
                        strokeWidth={4}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* ENHANCED TRADE HIGHLIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Best Trade */}
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-400 flex items-center">
                    <span className="text-2xl mr-3">🏆</span>
                    Best Trade
                  </h4>
                  <span className="text-xs bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-800 dark:to-green-800 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-xl font-black shadow-lg border border-emerald-300 dark:border-emerald-700">
                    R:R {stats.best_trade?.rr != null ? stats.best_trade.rr : 'N/A'}
                  </span>
                </div>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
                  {stats.best_trade?.pnl != null ? formatCurrency(stats.best_trade.pnl) : 'N/A'}
                </p>
                <div className="text-base text-slate-600 dark:text-slate-400">
                  <p className="font-black text-lg">{stats.best_trade?.symbol || 'N/A'}</p>
                  <p className="text-sm font-semibold">{stats.best_trade?.date || 'N/A'}</p>
                </div>
              </div>
              
              {/* Worst Trade */}
              <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-3xl p-8 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-black text-red-700 dark:text-red-400 flex items-center">
                    <span className="text-2xl mr-3">📉</span>
                    Worst Trade
                  </h4>
                  <span className="text-xs bg-gradient-to-r from-red-200 to-rose-200 dark:from-red-800 dark:to-rose-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-xl font-black shadow-lg border border-red-300 dark:border-red-700">
                    R:R {stats.worst_trade?.rr != null ? stats.worst_trade.rr : 'N/A'}
                  </span>
                </div>
                <p className="text-3xl font-black text-red-600 dark:text-red-400 mb-4">
                  {stats.worst_trade?.pnl != null ? formatCurrency(stats.worst_trade.pnl) : 'N/A'}
                </p>
                <div className="text-base text-slate-600 dark:text-slate-400">
                  <p className="font-black text-lg">{stats.worst_trade?.symbol || 'N/A'}</p>
                  <p className="text-sm font-semibold">{stats.worst_trade?.date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED CHARTS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
          {/* Portfolio Equity Curve */}
          <div className="xl:col-span-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-blue-500/10 transition-all duration-500">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-800 dark:from-white dark:to-blue-300 bg-clip-text text-transparent">Portfolio Growth</h3>
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-5 py-3 rounded-2xl font-bold shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                Cumulative Performance
              </div>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.8} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={13} fontWeight="600" />
                <YAxis stroke="#64748b" fontSize={13} fontWeight="600" tickFormatter={(val) => `$${val.toFixed(0)}`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Portfolio Value']}
                  labelStyle={{ color: '#1e293b', fontWeight: '800' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(16px)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative_pnl"
                  stroke="#10b981"
                  strokeWidth={4}
                  fill="url(#equityGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 4, r: 5 }}
                  activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 4, fill: '#ffffff', shadow: 'xl' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Win/Loss Breakdown */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-purple-500/10 transition-all duration-500">
            <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-purple-800 dark:from-white dark:to-purple-300 bg-clip-text text-transparent mb-10">Trade Outcomes</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={8}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                  fontSize={13}
                  fontWeight="700"
                >
                  {winLossData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-5 h-5 bg-emerald-600 rounded-full shadow-xl"></div>
                  <span className="text-base font-bold text-slate-600 dark:text-slate-400">Winning Trades</span>
                </div>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 bg-white/70 dark:bg-slate-800/70 px-4 py-2 rounded-xl shadow-sm">
                  {stats.win_loss?.wins || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-5 h-5 bg-red-600 rounded-full shadow-xl"></div>
                  <span className="text-base font-bold text-slate-600 dark:text-slate-400">Losing Trades</span>
                </div>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 bg-white/70 dark:bg-slate-800/70 px-4 py-2 rounded-xl shadow-sm">
                  {stats.win_loss?.losses || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ENHANCED PERFORMANCE METRICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Daily P&L Chart */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-cyan-500/10 transition-all duration-500">
            <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-cyan-800 dark:from-white dark:to-cyan-300 bg-clip-text text-transparent mb-10">Daily Performance</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.8} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={13} fontWeight="600" />
                <YAxis stroke="#64748b" fontSize={13} fontWeight="600" tickFormatter={(val) => `$${val.toFixed(0)}`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Daily P&L']}
                  labelStyle={{ color: '#1e293b', fontWeight: '800' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(16px)',
                  }}
                />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                  {pnlData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Advanced Metrics */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-orange-500/10 transition-all duration-500">
            <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-orange-800 dark:from-white dark:to-orange-300 bg-clip-text text-transparent mb-10">Advanced Metrics</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-600">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Expectancy</h4>
                <p className={`text-3xl font-black ${stats.expectancy == null ? 'text-slate-400' : stats.expectancy >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.expectancy == null ? 'N/A' : formatCurrency(stats.expectancy)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-600">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Kelly %</h4>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats.kelly_percentage == null ? 'N/A' : formatPercent(stats.kelly_percentage)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-600">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Max Drawdown</h4>
                <p className="text-3xl font-black text-red-600 dark:text-red-400">
                  {stats.max_drawdown == null ? 'N/A' : formatCurrency(stats.max_drawdown)}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-600">
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">Sharpe Ratio</h4>
                <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
                  {stats.sharpe_ratio?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* ENHANCED TRADE ACTIVITY */}
        <div className="grid grid-cols-1 gap-10">
          {/* Recent Trades Table */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-10 hover:shadow-teal-500/10 transition-all duration-500">
            <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-teal-800 dark:from-white dark:to-teal-300 bg-clip-text text-transparent mb-10">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="text-left py-6 px-4 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Symbol</th>
                    <th className="text-left py-6 px-4 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left py-6 px-4 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-right py-6 px-4 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">P&L</th>
                    <th className="text-right py-6 px-4 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800">
                  {stats.recent_trades?.slice(0, 8).map((trade, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300">
                      <td className="py-6 px-4 font-black text-lg text-slate-900 dark:text-slate-100">{trade.symbol || 'N/A'}</td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-2 rounded-2xl text-sm font-black shadow-lg border ${
                          trade.direction === 'buy' 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                          {trade.direction === 'buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-base font-bold text-slate-600 dark:text-slate-400">{trade.date || 'N/A'}</td>
                      <td className="py-6 px-4 text-right">
                        <span className={`font-black text-xl ${trade.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right text-base font-black text-slate-600 dark:text-slate-400">
                        {trade.rr != null ? trade.rr : 'N/A'}
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

