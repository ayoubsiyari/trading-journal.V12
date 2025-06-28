import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  ArrowUpRight,
  PieChart as PieIcon,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;
const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;
const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

const cleanFilename = (filename) => {
  if (!filename) return 'Unknown Batch';

  const parts = filename.split(' - ');
  if (parts.length > 1) {
    filename = parts[0];
  }

  filename = filename.replace(/\.[^/.]+$/, '');

  if (filename.length > 30) {
    filename = filename.substring(0, 27) + '...';
  }
  return filename;
};

// Helper: format a Date as "YYYY-MM-DD"
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performanceRating, setPerformanceRating] = useState(null);

  // import-batch filter state
  const [importHistory, setImportHistory] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

  // Calendar state
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [calendarMatrix, setCalendarMatrix] = useState([]);
  const [currentWeekRow, setCurrentWeekRow] = useState([]);
  const [todayCell, setTodayCell] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // "month" | "week" | "day"

  // ─── Fetch available import batches ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/import/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setImportHistory(await res.json());
      } catch (err) {
        console.error('❌ Failed to load import history:', err);
      }
    })();
  }, []);

  const buildCalendar = useCallback(
    (pnl_by_date) => {
      const pnlMap = {};
      if (Array.isArray(pnl_by_date)) {
        pnl_by_date.forEach(([dateStr, pnl]) => {
          pnlMap[dateStr] = pnl;
        });
      }

      const today = new Date();
      const ref = new Date(referenceDate);

      // ----- Month View -----
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const startWeekday = firstOfMonth.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const weeks = [];
      let currentWeek = new Array(7).fill(null);

      for (let i = 0; i < startWeekday; i++) {
        currentWeek[i] = null;
      }

      let dayCounter = 1;
      while (dayCounter <= daysInMonth) {
        const dateObj = new Date(year, month, dayCounter);
        const weekday = dateObj.getDay();
        const dateKey = toDateKey(dateObj);
        const pnl = pnlMap[dateKey] != null ? pnlMap[dateKey] : null;
        const isFuture = dateObj.setHours(0, 0, 0, 0) >
          today.setHours(0, 0, 0, 0);

        currentWeek[weekday] = { day: dayCounter, dateKey, pnl, isFuture };

        if (weekday === 6 || dayCounter === daysInMonth) {
          weeks.push(currentWeek);
          currentWeek = new Array(7).fill(null);
        }
        dayCounter++;
      }
      setCalendarMatrix(weeks);

      // ----- Week View -----
      const refDay = ref.getDate();
      const refWeekday = ref.getDay();
      const weekStart = new Date(ref);
      weekStart.setDate(refDay - refWeekday);
      const weekCells = [];
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(weekStart);
        dateObj.setDate(weekStart.getDate() + i);
        const dateKey = toDateKey(dateObj);
        const pnl = pnlMap[dateKey] != null ? pnlMap[dateKey] : null;
        const isFuture = dateObj.setHours(0, 0, 0, 0) >
          today.setHours(0, 0, 0, 0);
        weekCells.push({ day: dateObj.getDate(), dateKey, pnl, isFuture });
      }
      setCurrentWeekRow(weekCells);

      // ----- Day View -----
      const dateObj = new Date(referenceDate);
      const dateKey = toDateKey(dateObj);
      const pnl = pnlMap[dateKey] != null ? pnlMap[dateKey] : null;
      const isFutureDay = dateObj.setHours(0, 0, 0, 0) >
        today.setHours(0, 0, 0, 0);
      setTodayCell({ day: dateObj.getDate(), dateKey, pnl, isFuture: isFutureDay });
    },
    [referenceDate]
  );

  // ─── Fetch stats whenever selectedBatch changes ─────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const url = new URL('http://localhost:5000/api/journal/stats');
        if (selectedBatch) url.searchParams.set('batch_id', selectedBatch);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { error: text }; }

        if (!res.ok) {
          console.error('Stats fetch failed:', res.status, data);
          setError(data.error || `Server ${res.status}`);
          return;
        }

        setStats(data);

        // Compute Performance Rating
        const subScores = [];
        subScores.push(
          data.win_rate != null ? Math.min(data.win_rate, 100) : 0
        );
        subScores.push(
          data.profit_factor != null
            ? Math.min((data.profit_factor / 2) * 100, 100)
            : 0
        );
        subScores.push(
          data.sharpe_ratio != null
            ? Math.min((data.sharpe_ratio / 2) * 100, 100)
            : 0
        );
        if (data.expectancy != null) {
          subScores.push(
            data.expectancy >= 0
              ? 100
              : Math.max(0, 100 - (data.expectancy / -100) * 100)
          );
        } else {
          subScores.push(0);
        }
        setPerformanceRating(
          Math.round(subScores.reduce((a, b) => a + b, 0) / subScores.length)
        );

        // Build calendar heatmap
        buildCalendar(data.pnl_by_date);
      } catch (err) {
        console.error('❌ fetchStats error:', err);
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [buildCalendar, selectedBatch]);

  // Rebuild calendar on referenceDate or stats change
  useEffect(() => {
    if (stats) buildCalendar(stats.pnl_by_date);
  }, [referenceDate, stats, buildCalendar]);

  // ─── Loading / Error / No-Data States ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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

  if (!stats || stats.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trading Data</h2>
          <p className="text-gray-600">Add some trades first to see your analytics!</p>
        </div>
      </div>
    );
  }

  // ─── Batch label logic ───────────────────────────────────────────────────
  const selectedBatchObj = importHistory.find(
    (b) => b.id === Number(selectedBatch)
  );
  
  // Clean up the filename display
  const getBatchLabel = (batchObj) => {
    if (!batchObj) return 'All Trades';
    return `Batch: ${cleanFilename(batchObj.filename)}`;
  };

  const batchLabel = getBatchLabel(selectedBatchObj);

  // ─── Prepare chart data ────────────────────────────────────────────────────
  const pnlByDate = Array.isArray(stats.pnl_by_date)
    ? stats.pnl_by_date.map(([dateStr, pnl]) => ({
        date: new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        pnl,
      }))
    : [];
  const equityCurve = Array.isArray(stats.equity_curve)
    ? stats.equity_curve.map((pt) => ({ date: pt.date, cumulative_pnl: pt.cumulative_pnl }))
    : [];
  const winLossData = [
    { name: 'Wins', value: stats.win_loss?.wins || 0, color: '#10b981' },
    { name: 'Losses', value: stats.win_loss?.losses || 0, color: '#ef4444' },
  ];
  const directionData = [
    { name: 'Long', pnl: stats.buy_pnl || 0 },
    { name: 'Short', pnl: stats.sell_pnl || 0 },
  ];
  const allSymbols = Array.isArray(stats.top_symbols) ? stats.top_symbols : [];
  const totalPnL = allSymbols.reduce((sum, [, data]) => sum + data.pnl, 0);
  const avgPnL = allSymbols.length > 0 ? totalPnL / allSymbols.length : 0;
  const topSymbols = allSymbols.filter(([, data]) => data.pnl >= avgPnL);
  const worstSymbols = allSymbols.filter(([, data]) => data.pnl < avgPnL);
  const symbolPerformanceData = allSymbols.map(([symbol, data]) => ({ symbol, pnl: data.pnl }));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonthYear = referenceDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goPrev = () => {
    if (calendarView === 'month') {
      const prev = new Date(referenceDate);
      prev.setMonth(prev.getMonth() - 1);
      setReferenceDate(prev);
    } else if (calendarView === 'week') {
      const prev = new Date(referenceDate);
      prev.setDate(prev.getDate() - 7);
      setReferenceDate(prev);
    } else {
      const prev = new Date(referenceDate);
      prev.setDate(prev.getDate() - 1);
      setReferenceDate(prev);
    }
  };
  const goNext = () => {
    if (calendarView === 'month') {
      const nxt = new Date(referenceDate);
      nxt.setMonth(nxt.getMonth() + 1);
      setReferenceDate(nxt);
    } else if (calendarView === 'week') {
      const nxt = new Date(referenceDate);
      nxt.setDate(nxt.getDate() + 7);
      setReferenceDate(nxt);
    } else {
      const nxt = new Date(referenceDate);
      nxt.setDate(nxt.getDate() + 1);
      setReferenceDate(nxt);
    }
  };


  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2">
                Trading <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Analytics</span>
              </h1>
              <p className="text-xl text-blue-200 font-medium">Professional Performance Intelligence & Market Insights</p>
              <div className="mt-4 flex flex-wrap items-center space-x-6 text-blue-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold">Live Data</span>
                </div>
                <div className="flex items-center space-x-2"><span className="font-semibold">{stats.total_trades} Total Trades</span></div>
                <div className="flex items-center space-x-2"><span className="font-semibold">Updated Real-time</span></div>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-white rounded-full px-5 py-3 flex items-center space-x-3 shadow-lg">
                <Award className="h-6 w-6 text-yellow-500" />
                <div><p className="text-sm font-medium text-gray-600 uppercase">Performance Rating</p><p className="text-2xl font-bold text-gray-900">{performanceRating}/100</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BATCH FILTER */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center space-x-3">
        <label htmlFor="batchFilter" className="font-medium text-gray-700">Show:</label>
        <select
          id="batchFilter"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Trades</option>
          {importHistory.map((batch) => (
            <option key={batch.id} value={batch.id.toString()}>{cleanFilename(batch.filename)}</option>
          ))}
        </select>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* 1. SUMMARY METRICS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary Metrics ({batchLabel})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Total Trades */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Trades
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_trades}
                </p>
              </div>
            </div>

            {/* Total Net P&L */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <ArrowUpRight className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Net P&L
                </p>
                <p
                  className={`text-2xl font-bold ${
                    stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(stats.total_pnl)}
                </p>
                <p className="text-xs text-gray-400">Overall profitability</p>
              </div>
            </div>

            {/* Avg P&L per Trade */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <ArrowUpRight className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg P&L per Trade
                </p>
                <p
                  className={`text-2xl font-bold ${
                    stats.total_trades
                      ? stats.avg_pnl >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      : 'text-gray-400'
                  }`}
                >
                  {stats.total_trades ? formatCurrency(stats.avg_pnl) : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">Average per position</p>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate (%)
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercent(stats.win_rate)}
                </p>
                <p className="text-xs text-gray-400">Fraction of profitable trades</p>
              </div>
            </div>

            {/* Loss Rate */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loss Rate (%)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.win_rate != null
                    ? formatPercent(100 - stats.win_rate)
                    : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">Complement to Win Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. RISK-REWARD & TRADE-LEVEL METRICS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Risk-Reward &amp; Trade-Level Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Avg Win */}
            <div className="bg-white rounded-2xl shadow p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Win
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.avg_win)}
              </p>
              <p className="text-xs text-gray-400">Mean profit on winning trades</p>
            </div>
            {/* Avg Loss */}
            <div className="bg-white rounded-2xl shadow p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Loss
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.avg_loss)}
              </p>
              <p className="text-xs text-gray-400">Mean loss on losing trades</p>
            </div>
            {/* Avg R:R */}
            <div className="bg-white rounded-2xl shadow p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg R:R
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatNumber(stats.avg_rr)}
              </p>
              <p className="text-xs text-gray-400">Average risk‐reward per trade</p>
            </div>
            {/* Best/Worst Trade */}
            <div className="bg-white rounded-2xl shadow p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Best Trade (P&L)
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.best_trade?.pnl != null
                  ? formatCurrency(stats.best_trade.pnl)
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">
                {stats.best_trade?.symbol || 'N/A'} on {stats.best_trade?.date || '–'}
              </p>
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worst Trade (P&L)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.worst_trade?.pnl != null
                    ? formatCurrency(stats.worst_trade.pnl)
                    : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">
                  {stats.worst_trade?.symbol || 'N/A'} on {stats.worst_trade?.date || '–'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROFITABILITY & EFFICIENCY METRICS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profitability &amp; Efficiency Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Profit Factor */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Factor
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.profit_factor === Infinity
                  ? '∞'
                  : stats.profit_factor == null
                  ? 'N/A'
                  : parseFloat(stats.profit_factor).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Gross Profit ÷ Gross Loss</p>
            </div>
            {/* Expectancy */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-5 w-5 text-purple-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expectancy
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.expectancy == null
                    ? 'text-gray-400'
                    : stats.expectancy >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(stats.expectancy)}
              </p>
              <p className="text-xs text-gray-400">Average return per trade</p>
            </div>
            {/* Gross Profit */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Profit
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.gross_profit)}
              </p>
              <p className="text-xs text-gray-400">Sum of winning trades</p>
            </div>
            {/* Gross Loss */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-red-600 transform rotate-90" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Loss
                </p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.gross_loss)}
              </p>
              <p className="text-xs text-gray-400">
                Sum of losing trades (absolute)
              </p>
            </div>
            {/* Sharpe Ratio */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sharpe Ratio
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.sharpe_ratio != null
                  ? parseFloat(stats.sharpe_ratio).toFixed(2)
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">Risk-adjusted return</p>
            </div>
            {/* Sortino Ratio */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-5 w-5 text-purple-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sortino Ratio
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.sortino_ratio != null
                  ? parseFloat(stats.sortino_ratio).toFixed(2)
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">
                Downside risk‐adjusted return
              </p>
            </div>
            {/* Kelly % */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelly %
                </p>
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.kelly_percentage != null
                  ? `${parseFloat(stats.kelly_percentage).toFixed(1)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-400">Optimal risk per trade</p>
            </div>
          </div>
        </section>

        {/* 4. RISK METRICS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Risk Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Max Drawdown */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Drawdown
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.max_drawdown)}
                </p>
                <p className="text-xs text-gray-400">Worst equity drop</p>
              </div>
            </div>
            {/* Max Drawdown % */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Drawdown (%)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.max_drawdown_percent != null
                    ? formatPercent(stats.max_drawdown_percent)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* Max Consecutive Wins */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Award className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Consecutive Wins
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.max_consecutive_wins || 0}
                </p>
                <p className="text-xs text-gray-400">Longest winning run</p>
              </div>
            </div>
            {/* Max Consecutive Losses */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Consecutive Losses
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.max_consecutive_losses || 0}
                </p>
                <p className="text-xs text-gray-400">Longest losing run</p>
              </div>
            </div>
            {/* Recovery Factor */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Award className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recovery Factor
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.recovery_factor === Infinity
                    ? '∞'
                    : stats.recovery_factor == null
                    ? 'N/A'
                    : parseFloat(stats.recovery_factor).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">Net Profit ÷ Max Drawdown</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TIME-BASED HIGHLIGHTS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Time-Based Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Best Day of Week */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best Day (Week)
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.best_day_of_week?.day || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {stats.best_day_of_week?.pnl != null
                    ? formatCurrency(stats.best_day_of_week.pnl)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* Worst Day */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Calendar className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worst Day (Week)
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.worst_day_of_week?.day || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {stats.worst_day_of_week?.pnl != null
                    ? formatCurrency(stats.worst_day_of_week.pnl)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* Best Hour */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best Hour
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.best_hour?.hour != null ? `${stats.best_hour.hour}:00` : 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {stats.best_hour?.pnl != null
                    ? formatCurrency(stats.best_hour.pnl)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* Worst Hour */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <Clock className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worst Hour
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.worst_hour?.hour != null ? `${stats.worst_hour.hour}:00` : 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {stats.worst_hour?.pnl != null
                    ? formatCurrency(stats.worst_hour.pnl)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {/* Max Drawdown % */}
            <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Drawdown (%)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.max_drawdown_percent != null
                    ? formatPercent(stats.max_drawdown_percent)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PROFIT/LOSS CALENDAR */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profit/Loss Calendar ({currentMonthYear})
          </h2>
          {/* Calendar nav & view selector */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={goPrev}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={goNext}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <label htmlFor="calendarView" className="text-sm font-medium text-gray-700">
              View:
            </label>
            <select
              id="calendarView"
              name="calendarView"
              value={calendarView}
              onChange={(e) => setCalendarView(e.target.value)}
              className="block w-32 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-600">
              {weekdays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>
            {/* Month view */}
            {calendarView === 'month' && (
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarMatrix.map((week, wi) =>
                  week.map((cell, di) => {
                    if (cell === null) {
                      return <div key={`${wi}-${di}`} className="h-12 bg-gray-100"></div>;
                    }
                    const { day, pnl, isFuture } = cell;
                    let bg = 'bg-gray-100';
                    if (isFuture) bg = 'bg-gray-50';
                    else if (pnl != null) bg = pnl > 0 ? 'bg-green-200' : pnl < 0 ? 'bg-red-200' : 'bg-gray-200';
                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={`${bg} h-12 flex items-center justify-center rounded-md`}
                        title={
                          isFuture
                            ? 'Upcoming Day'
                            : pnl != null
                            ? `P&L: ${formatCurrency(pnl)}`
                            : 'No trades'
                        }
                      >
                        <span className="text-sm font-semibold">{day}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {/* Week view */}
            {calendarView === 'week' && (
              <div className="mt-1 grid grid-cols-7 gap-1">
                {currentWeekRow.map((cell, i) => {
                  if (!cell) return <div key={i} className="h-12 bg-gray-100"></div>;
                  const { day, pnl, isFuture } = cell;
                  let bg = 'bg-gray-100';
                  if (isFuture) bg = 'bg-gray-50';
                  else if (pnl != null) bg = pnl > 0 ? 'bg-green-200' : pnl < 0 ? 'bg-red-200' : 'bg-gray-200';
                  return (
                    <div
                      key={i}
                      className={`${bg} h-12 flex items-center justify-center rounded-md`}
                      title={
                        isFuture
                          ? 'Upcoming Day'
                          : pnl != null
                          ? `P&L: ${formatCurrency(pnl)}`
                          : 'No trades'
                      }
                    >
                      <span className="text-sm font-semibold">{day}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Day view */}
            {calendarView === 'day' && todayCell && (
              <div className="mt-1 grid grid-cols-7 gap-1">
                {weekdays.map((_, idx) => {
                  const weekday = new Date(todayCell.dateKey).getDay();
                  const before = new Array(weekday).fill(null);
                  const after = new Array(6 - weekday).fill(null);
                  const slots = [...before, todayCell, ...after];
                  const cell = slots[idx];
                  if (cell == null) return <div key={idx} className="h-12 bg-gray-100"></div>;
                  let bg = 'bg-gray-100';
                  if (cell.isFuture) bg = 'bg-gray-50';
                  else if (cell.pnl != null) bg = cell.pnl > 0 ? 'bg-green-200' : cell.pnl < 0 ? 'bg-red-200' : 'bg-gray-200';
                  return (
                    <div
                      key={idx}
                      className={`${bg} h-12 flex items-center justify-center rounded-md`}
                      title={
                        cell.isFuture
                          ? 'Upcoming Day'
                          : cell.pnl != null
                          ? `P&L: ${formatCurrency(cell.pnl)}`
                          : 'No trades'
                      }
                    >
                      <span className="text-sm font-semibold">{cell.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-4 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 bg-green-200 mr-1 rounded-full"></span> Profit &nbsp;
              <span className="inline-block w-3 h-3 bg-red-200 mr-1 ml-4 rounded-full"></span> Loss &nbsp;
              <span className="inline-block w-3 h-3 bg-gray-200 mr-1 ml-4 rounded-full"></span> No Trades &nbsp;
              <span className="inline-block w-3 h-3 bg-gray-50 mr-1 ml-4 rounded-full"></span> Upcoming
            </p>
          </div>
        </section>

        {/* 7. EQUITY CURVE & DAILY P&L */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Equity Curve</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {equityCurve.length > 0 ? (
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Equity']}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative_pnl"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#eqGrad)"
                    />
                  </AreaChart>
                ) : (
                  <p className="text-xs text-gray-400 text-center mt-8">No equity data</p>
                )}
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Daily P&L</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {pnlByDate.length > 0 ? (
                  <BarChart data={pnlByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Daily P&L']}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {pnlByDate.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <p className="text-xs text-gray-400 text-center mt-8">No daily data</p>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 8. WIN/LOSS & LONG VS SHORT */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Performance Breakdowns
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <PieIcon className="h-5 w-5 text-blue-600 mr-2" /> Win/Loss Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
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
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" /> Long vs Short P&L
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={directionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
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
          </div>
        </section>

        {/* 9. TOP & WORST SYMBOLS */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Instrument Breakdowns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieIcon className="h-5 w-5 text-blue-600 mr-2" /> Top Performing Symbols
              </h3>
              {topSymbols.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topSymbols.map(([symbol, data]) => (
                    <div
                      key={symbol}
                      className="bg-gray-50 rounded-lg p-4 text-center"
                    >
                      <p className="font-semibold text-lg text-gray-900">
                        {symbol}
                      </p>
                      <p
                        className={`mt-1 text-md font-bold ${
                          data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(data.pnl)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {data.trades} trades •{' '}
                        {formatPercent((data.wins / data.trades) * 100)} win rate
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No symbols above average</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" /> Worst Performing Symbols
              </h3>
              {worstSymbols.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {worstSymbols.map(([symbol, data]) => (
                    <div
                      key={symbol}
                      className="bg-gray-50 rounded-lg p-4 text-center"
                    >
                      <p className="font-semibold text-lg text-gray-900">
                        {symbol}
                      </p>
                      <p
                        className={`mt-1 text-md font-bold ${
                          data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(data.pnl)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {data.trades} trades •{' '}
                        {formatPercent((data.wins / data.trades) * 100)} win rate
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No symbols below average</p>
              )}
            </div>
          </div>
        </section>

        {/* 10. PERFORMANCE BY PAIR */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Performance by Pair
          </h2>
          <div className="bg-white rounded-2xl shadow p-6">
            <ResponsiveContainer width="100%" height={300}>
              {symbolPerformanceData.length > 0 ? (
                <BarChart data={symbolPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="symbol" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {symbolPerformanceData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <p className="text-xs text-gray-400 text-center mt-8">
                  No symbol performance data
                </p>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* 11. RECENT TRADES */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Trades</h2>
          <div className="bg-white rounded-2xl shadow overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    R:R
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_trades.map((t, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {t.symbol}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          t.direction.toLowerCase() === 'long'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{t.date}</td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${
                        t.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(t.pnl)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {t.rr != null ? t.rr.toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
