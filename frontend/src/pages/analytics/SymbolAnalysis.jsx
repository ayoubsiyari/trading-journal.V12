import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Settings, ChevronUp, ChevronDown, Info, TrendingUp, TrendingDown, Download, Filter, BarChart3, PieChart as PieChartIcon, Activity, Target } from 'lucide-react';

// ─── Format helpers ─────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  if (val == null) return 'N/A';
  
  const num = parseFloat(val);
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(2)}`;
};
const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;
const formatRiskReward = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(2)}:1`;

export default function SymbolAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCols, setShowCols] = useState({ profit_factor: true, gross_profit: true, gross_loss: true });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [equitySymbol, setEquitySymbol] = useState('');

  // holders for lazy PDF libs (module-scope refs)
  let jsPDFRef = null;
  let html2canvasRef = null;

  // ─── Fetch per-symbol stats ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchSymbolStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/symbol-analysis', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch symbol data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('❌ Error loading symbol data:', err);
        setError(err.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchSymbolStats();
  }, []);

  // fetch all entries once for equity
  useEffect(()=>{
    const fetchEntries = async () => {
      try{
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/list', {headers:{Authorization:`Bearer ${token}`}});
        if(res.ok){
          const j= await res.json();
          setEntries(j);
        }
      }catch(e){console.error('entries fetch',e)}
    }
    fetchEntries();
  },[]);

  // ─── Sorting helpers ─────────────────────────────────────────────────────────
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
      return sortDirection === 'asc' ? (
        <ChevronUp className="h-4 w-4 text-blue-600" />
      ) : (
        <ChevronDown className="h-4 w-4 text-blue-600" />
      );
    }
    return null;
  };

  const filteredData = data
    .filter((d) =>
      symbolFilter ? d.symbol.toLowerCase().includes(symbolFilter.toLowerCase()) : true,
    )
    .filter((d) => {
      if (!fromDate && !toDate) return true;
      const date = new Date(d.latest_date || d.first_trade_date || 0);
      if (fromDate && date < new Date(fromDate)) return false;
      if (toDate && date > new Date(toDate)) return false;
      return true;
    });

  const sortedData = () => {
    if (!filteredData) return [];
    return [...filteredData].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortBy === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
      return dir * (a[sortBy] - b[sortBy]);
    });
  };

  // equity curve data
  const equityData = React.useMemo(()=>{
    if(!equitySymbol) return [];
    const trades = entries.filter(e=>e.symbol?.toUpperCase()===equitySymbol.toUpperCase()).sort((a,b)=>new Date(a.date)-new Date(b.date));
    let running=0;
    return trades.map(t=>{running+=t.pnl||0; return {date:t.date, equity:running};});
  },[entries,equitySymbol]);

  // radar data (top 5 by trades)
  const radarData = filteredData.slice(0,5).map(d=>({symbol:d.symbol, win_rate:d.win_rate, rr:d.avg_rr, pf:d.profit_factor||0}));

  // ─── UI States ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-12">
            <div className="flex items-center justify-center space-x-4 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <Info className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Error Loading Data</h2>
                <p className="text-lg mt-2">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Derived helpers ────────────────────────────────────────────────────────
  const totalPairs = data.length;
  const bestPair = [...data].sort((a, b) => b.pnl - a.pnl)[0];
  const worstPair = [...data].sort((a, b) => a.pnl - b.pnl)[0];
  const tradesPie = data.map((d) => ({ name: d.symbol, value: d.trades }));

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-8 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Symbol Analysis Dashboard
                  </h1>
                  <p className="text-gray-600 mt-2">Comprehensive trading performance insights</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-8 p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { key: 'equity', label: 'Equity Curve', icon: Activity },
                { key: 'radar', label: 'Performance Radar', icon: Target }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
              <button
                onClick={async () => {
                  if (!jsPDFRef) {
                    const pdfMod = await import('jspdf');
                    jsPDFRef = pdfMod.jsPDF;
                    const h2cMod = await import('html2canvas');
                    html2canvasRef = h2cMod.default;
                  }
                  const node = document.getElementById('symbol-dashboard');
                  if (!node) return;
                  const canvas = await html2canvasRef(node);
                  const img = canvas.toDataURL('image/png');
                  const pdf = new jsPDFRef('p', 'mm', 'a4');
                  const width = pdf.internal.pageSize.getWidth();
                  const height = (canvas.height * width) / canvas.width;
                  pdf.addImage(img, 'PNG', 0, 0, width, height);
                  pdf.save('symbol-analysis.pdf');
                }}
                className="ml-auto inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Download className="h-5 w-5 mr-2" />
                Export PDF
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50/80 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Filters & Options</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search symbols..."
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <span className="text-sm font-medium text-gray-700">Show Columns:</span>
                {Object.keys(showCols).map((key) => (
                  <label key={key} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showCols[key]}
                      onChange={() => setShowCols({ ...showCols, [key]: !showCols[key] })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div id="symbol-dashboard" className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pairs Traded</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalPairs}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total P&L</h3>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    {formatCurrency(data.reduce((sum, d) => sum + d.pnl, 0))}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Win Rate</h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {formatPercent(data.reduce((s, d) => s + (d.win_rate || 0), 0) / data.length)}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg R:R</h3>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {formatRiskReward(data.reduce((s, d) => s + (d.avg_rr || 0), 0) / data.length)}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Best Pair</h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">{bestPair?.symbol || '—'}</p>
                  <p className="text-sm text-gray-600">P&L: {formatCurrency(bestPair?.pnl)}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Worst Pair</h3>
                  <p className="text-2xl font-bold text-red-600 mt-2">{worstPair?.symbol || '—'}</p>
                  <p className="text-sm text-gray-600">P&L: {formatCurrency(worstPair?.pnl)}</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg mr-3">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Gross Profit vs Loss</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={filteredData.map((d) => ({ symbol: d.symbol, profit: d.gross_profit, loss: d.gross_loss }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="symbol" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'profit' ? 'Gross Profit' : 'Gross Loss']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Win Rate by Symbol</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="symbol" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(v) => [formatPercent(v), 'Win Rate']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="win_rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">P&L by Symbol</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="symbol" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'P&L']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {filteredData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3">
                      <PieChartIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Trade Distribution</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie 
                        data={tradesPie} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tradesPie.map((entry, index) => (
                          <Cell key={`slice-${index}`} fill={["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Detailed Symbol Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th
                          className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => handleSort('symbol')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Symbol</span>
                            {sortIcon('symbol')}
                          </div>
                        </th>
                        <th
                          className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => handleSort('trades')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Trades</span>
                            {sortIcon('trades')}
                          </div>
                        </th>
                        <th
                          className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => handleSort('pnl')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>P&L</span>
                            {sortIcon('pnl')}
                          </div>
                        </th>
                        <th
                          className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => handleSort('win_rate')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Win Rate</span>
                            {sortIcon('win_rate')}
                          </div>
                        </th>
                        <th
                          className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                          onClick={() => handleSort('avg_rr')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Avg R:R</span>
                            {sortIcon('avg_rr')}
                          </div>
                        </th>
                        {showCols.profit_factor && (
                          <th
                            className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                            onClick={() => handleSort('profit_factor')}
                          >
                            <div className="flex items-center space-x-2">
                              <span>Profit Factor</span>
                              {sortIcon('profit_factor')}
                            </div>
                          </th>
                        )}
                        {showCols.gross_profit && (
                          <th
                            className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                            onClick={() => handleSort('gross_profit')}
                          >
                            <div className="flex items-center space-x-2">
                              <span>Gross Profit</span>
                              {sortIcon('gross_profit')}
                            </div>
                          </th>
                        )}
                        {showCols.gross_loss && (
                          <th
                            className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                            onClick={() => handleSort('gross_loss')}
                          >
                            <div className="flex items-center space-x-2">
                              <span>Gross Loss</span>
                              {sortIcon('gross_loss')}
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedData().map((row, idx) => (
                        <tr key={row.symbol} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-4 px-6 text-sm font-semibold text-gray-900">{row.symbol}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">{row.trades}</td>
                          <td className={`py-4 px-6 text-sm font-semibold ${row.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(row.pnl)}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">{formatPercent(row.win_rate)}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">{formatRiskReward(row.avg_rr)}</td>
                          {showCols.profit_factor && (
                            <td className="py-4 px-6 text-sm text-gray-700">{row.profit_factor?.toFixed(2) || 'N/A'}</td>
                          )}
                          {showCols.gross_profit && (
                            <td className="py-4 px-6 text-sm text-emerald-600 font-medium">{formatCurrency(row.gross_profit)}</td>
                          )}
                          {showCols.gross_loss && (
                            <td className="py-4 px-6 text-sm text-red-600 font-medium">{formatCurrency(row.gross_loss)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equity' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Equity Curve by Symbol</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Symbol:</label>
                  <select
                    value={equitySymbol}
                    onChange={(e) => setEquitySymbol(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Symbol</option>
                    {data.map((d) => (
                      <option key={d.symbol} value={d.symbol}>{d.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>
              {equityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Equity']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>Select a symbol to view its equity curve</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'radar' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Performance Radar (Top 5 Symbols)</h2>
              </div>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="symbol" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Radar name="Win Rate" dataKey="win_rate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Radar name="Risk Reward" dataKey="rr" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    <Radar name="Profit Factor" dataKey="pf" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>No data available for radar chart</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

