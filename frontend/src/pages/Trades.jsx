// frontend/src/pages/Trades.jsx

import React, { useEffect, useState } from 'react';

// Utility formatters
const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Professional action button component
const ActionButton = ({ onClick, type, children, disabled = false }) => {
  const styles = {
    edit: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white',
    delete: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white',
    view: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${styles[type]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// Professional status badge component
const StatusBadge = ({ status, pnl }) => {
  const isProfit = parseFloat(pnl) >= 0;
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
      isProfit 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isProfit ? 'PROFIT' : 'LOSS'}
    </div>
  );
};

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDirection, setFilterDirection] = useState('all');

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      setError('');

      // 1. Grab the JWT from localStorage
      const token = localStorage.getItem('token');
      console.log('📦 Trades.jsx: token from localStorage →', token);

      if (!token) {
        setError('❌ You must be logged in to view trades.');
        setLoading(false);
        return;
      }

      try {
        // 2. Fetch from /api/journal/list instead of /api/trades/list
        const res = await fetch('http://localhost:5000/api/journal/list', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('📦 Trades.jsx: GET /api/journal/list → status', res.status);

        if (res.status === 401) {
          setError('❌ Unauthorized. Please log in again.');
          setLoading(false);
          return;
        }
        if (res.status === 422) {
          setError('❌ Invalid or expired token. Please log in again.');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          // any other HTTP error
          throw new Error(`HTTP ${res.status}`);
        }

        // 3. Parse the JSON response (should be an array of entries)
        const data = await res.json();
        console.log('📦 Trades.jsx: data from backend →', data);

        // The journal route returns a plain array, e.g.:
        // [ { id: 1, symbol: 'EURUSD', direction: 'long', entry_price: 1.234, ... }, … ]
        if (Array.isArray(data)) {
          setTrades(data);
        } else {
          // In case backend wrapped it differently, adjust here if needed
          setTrades([]);
        }
      } catch (err) {
        console.error('❌ Trades.jsx: fetch error →', err);
        setError('❌ Failed to load trades. See console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trade.notes && trade.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDirection = filterDirection === 'all' || trade.direction === filterDirection;
      return matchesSearch && matchesDirection;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (['entry_price', 'exit_price', 'pnl', 'rr'].includes(sortField)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate summary stats
  const totalTrades = filteredTrades.length;
  const totalPnL = filteredTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
  const winningTrades = filteredTrades.filter(trade => parseFloat(trade.pnl) > 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100) : 0;

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 4. Show loading spinner while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-300 opacity-30"></div>
          </div>
          <p className="mt-6 text-xl font-semibold text-white">Loading Trades...</p>
          <p className="mt-2 text-blue-300">Fetching your trading history</p>
        </div>
      </div>
    );
  }

  // 5. Show any errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-red-300 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 6. Render the professional trades interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Professional Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-black text-white mb-2">
                Trading <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">History</span>
              </h1>
              <p className="text-xl text-blue-200 font-medium">Complete Trade Management & Analysis</p>
              <div className="mt-4 flex items-center space-x-6 text-blue-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold">{totalTrades} Total Trades</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Win Rate: {winRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Total P&L: {formatCurrency(totalPnL)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 -mt-8 relative z-10">
        {trades.length === 0 ? (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <span className="text-6xl">📋</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">No Trades Yet</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Start building your trading history by adding your first trade from the Journal page.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
              Add Your First Trade
            </button>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search Trades</label>
                  <input
                    type="text"
                    placeholder="Search by symbol or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Direction</label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium bg-white"
                  >
                    <option value="all">All Directions</option>
                    <option value="long">Long Only</option>
                    <option value="short">Short Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium bg-white"
                  >
                    <option value="created_at">Date</option>
                    <option value="symbol">Symbol</option>
                    <option value="pnl">P&L</option>
                    <option value="rr">Risk:Reward</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
                  <select
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium bg-white"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Trades Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded mr-3"></div>
                  Trading History ({filteredTrades.length} trades)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th 
                        className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {sortField === 'created_at' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Symbol</span>
                          {sortField === 'symbol' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Direction</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Entry</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Exit</th>
                      <th 
                        className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                        onClick={() => handleSort('pnl')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>P&L</span>
                          {sortField === 'pnl' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                        onClick={() => handleSort('rr')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>R:R</span>
                          {sortField === 'rr' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Notes</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredTrades.map((trade, idx) => (
                      <tr key={trade.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {formatDate(trade.created_at)}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {trade.symbol}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            trade.direction === 'long' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {trade.direction === 'long' ? '📈 LONG' : '📉 SHORT'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-700">
                          {formatCurrency(trade.entry_price)}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-700">
                          {formatCurrency(trade.exit_price)}
                        </td>
                        <td className={`py-4 px-6 font-bold text-lg ${
                          parseFloat(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-700">
                          {trade.rr ? `${Number(trade.rr).toFixed(2)}:1` : '—'}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status="completed" pnl={trade.pnl} />
                        </td>
                        <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                          {trade.notes || '—'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <ActionButton type="view" onClick={() => console.log('View trade', trade.id)}>
                              👁️ View
                            </ActionButton>
                            <ActionButton type="edit" onClick={() => console.log('Edit trade', trade.id)}>
                              ✏️ Edit
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl p-6 mt-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-black text-blue-400">{totalTrades}</div>
                  <div className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Total Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-green-400">{winningTrades}</div>
                  <div className="text-sm font-semibold text-green-200 uppercase tracking-wider">Winning Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-purple-400">{winRate.toFixed(1)}%</div>
                  <div className="text-sm font-semibold text-purple-200 uppercase tracking-wider">Win Rate</div>
                </div>
                <div>
                  <div className={`text-2xl font-black ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalPnL)}
                  </div>
                  <div className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Total P&L</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}