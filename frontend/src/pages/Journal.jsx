import React, { useState, useEffect } from 'react';

const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
const formatNumber = (val) => parseFloat(val || 0).toFixed(2);
const formatPercent = (val) => `${parseFloat(val || 0).toFixed(2)}%`;

export default function ProfessionalTradingJournal() {
  const [form, setForm] = useState({ 
    symbol: '', 
    direction: 'long', 
    entry: '', 
    exit: '', 
    quantity: '', 
    pnl: '', 
    rr: '', 
    notes: '',
    strategy: '',
    setup: ''
  });
  const [trades, setTrades] = useState([]);
  
  const [editingTrade, setEditingTrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch trades from database
  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/journal/list", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTrades(data);
        setError('');
      } else {
        throw new Error(data.error || 'Failed to fetch');
      }
    } catch (err) {
      setError('❌ Failed to load trades');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => { 
    fetchTrades(); 
  }, []);

  // Calculate statistics
  const stats = {
    totalTrades: trades.length,
    winningTrades: trades.filter(t => parseFloat(t.pnl) > 0).length,
    totalPnL: trades.reduce((sum, t) => sum + parseFloat(t.pnl), 0),
    winRate: trades.length > 0 ? (trades.filter(t => parseFloat(t.pnl) > 0).length / trades.length * 100) : 0,
    avgRR: trades.length > 0 ? trades.reduce((sum, t) => sum + parseFloat(t.rr || 0), 0) / trades.length : 0,
    avgWin: trades.filter(t => parseFloat(t.pnl) > 0).reduce((sum, t, _, arr) => sum + parseFloat(t.pnl) / arr.length, 0),
    avgLoss: Math.abs(trades.filter(t => parseFloat(t.pnl) < 0).reduce((sum, t, _, arr) => sum + parseFloat(t.pnl) / arr.length, 0))
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    
    // Auto-calculate P&L
    if ((name === 'entry' || name === 'exit' || name === 'quantity') && updated.entry && updated.exit && updated.quantity) {
      const entry = parseFloat(updated.entry);
      const exit = parseFloat(updated.exit);
      const qty = parseFloat(updated.quantity);
      
      if (updated.direction === 'long') {
        updated.pnl = ((exit - entry) * qty).toFixed(2);
      } else {
        updated.pnl = ((entry - exit) * qty).toFixed(2);
      }
    }
    
    setForm(updated);
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setForm({
      symbol: trade.symbol,
      direction: trade.direction,
      entry: trade.entry_price,
      exit: trade.exit_price,
      quantity: trade.quantity || '',
      pnl: trade.pnl,
      rr: trade.rr,
      strategy: trade.strategy || '',
      setup: trade.setup || '',
      notes: trade.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/journal/delete/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        await fetchTrades(); // Refresh the list
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete trade');
      }
    } catch (err) {
      setError('❌ Failed to delete trade');
      console.error('Delete error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.entry || !form.exit) {
      setError('Please fill in required fields: Symbol, Entry Price, Exit Price');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem("token");
      const payload = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction === 'long' ? 'long' : 'short',
        entry_price: parseFloat(form.entry),
        exit_price: parseFloat(form.exit),
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        pnl: parseFloat(form.pnl),
        rr: form.rr ? parseFloat(form.rr) : null,
        strategy: form.strategy || null,
        setup: form.setup || null,
        notes: form.notes || null
      };

      const url = editingTrade
        ? `http://localhost:5000/api/journal/edit/${editingTrade.id}`
        : `http://localhost:5000/api/journal/add`;
      const method = editingTrade ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        // Reset form and close
        setForm({ symbol: '', direction: 'long', entry: '', exit: '', quantity: '', pnl: '', rr: '', strategy: '', setup: '', notes: '' });
        setEditingTrade(null);
        setShowForm(false);
        await fetchTrades(); // Refresh the list
        setError('');
      } else {
        setError(data.error || 'Failed to save trade');
      }
    } catch (err) {
      setError('❌ Failed to save trade');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesFilter = filter === 'all' || 
      (filter === 'wins' && parseFloat(trade.pnl) > 0) ||
      (filter === 'losses' && parseFloat(trade.pnl) < 0) ||
      (filter === 'long' && trade.direction === 'long') ||
      (filter === 'short' && trade.direction === 'short');
    
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.setup.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Trading Journal</h1>
            <p className="text-slate-600">Track, analyze, and optimize your trading performance</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <span className="text-lg">+</span>
            Add Trade
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total P&L</p>
                <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalPnL)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <span className="text-green-600 text-xl font-bold">$</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold text-slate-800">{formatPercent(stats.winRate)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <span className="text-blue-600 text-xl font-bold">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg R:R</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(stats.avgRR)}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <span className="text-purple-600 text-xl font-bold">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Trades</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalTrades}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <span className="text-orange-600 text-xl font-bold">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingTrade ? 'Edit Trade' : 'Add New Trade'}
            </h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Symbol</label>
                  <input
                    name="symbol"
                    value={form.symbol}
                    onChange={handleChange}
                    placeholder="e.g., AAPL"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Direction</label>
                  <select
                    name="direction"
                    value={form.direction}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
                  <input
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="100"
                    type="number"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Entry Price</label>
                  <input
                    name="entry"
                    value={form.entry}
                    onChange={handleChange}
                    placeholder="150.25"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Exit Price</label>
                  <input
                    name="exit"
                    value={form.exit}
                    onChange={handleChange}
                    placeholder="155.80"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">P&L</label>
                  <input
                    name="pnl"
                    value={form.pnl}
                    onChange={handleChange}
                    placeholder="Auto-calculated"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Risk:Reward</label>
                  <input
                    name="rr"
                    value={form.rr}
                    onChange={handleChange}
                    placeholder="2.5"
                    type="number"
                    step="0.1"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Strategy</label>
                  <input
                    name="strategy"
                    value={form.strategy}
                    onChange={handleChange}
                    placeholder="e.g., Breakout"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Setup</label>
                  <input
                    name="setup"
                    value={form.setup}
                    onChange={handleChange}
                    placeholder="e.g., Bull Flag"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add your trading notes, observations, and lessons learned..."
                  rows="4"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingTrade ? 'Update Trade' : 'Save Trade'}
                  </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTrade(null);
                    setForm({ symbol: '', direction: 'long', entry: '', exit: '', quantity: '', pnl: '', rr: '', strategy: '', setup: '', notes: '' });
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'wins', 'losses', 'long', 'short'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    filter === filterType
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Trade History Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Trade History</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-all duration-200">
                  <span>📥</span>
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-all duration-200">
                  <span>🔽</span>
                  Filter
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Symbol</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Direction</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Entry</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Exit</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Qty</th>
                  <th className="text-left p-4 font-semibold text-slate-700">P&L</th>
                  <th className="text-left p-4 font-semibold text-slate-700">R:R</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Strategy</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade, index) => (
                  <tr key={trade.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                    <td className="p-4 text-slate-600">
                      {new Date(trade.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{trade.symbol}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {trade.direction === 'long' ? (
                          <span className="text-green-600 font-bold">↗</span>
                        ) : (
                          <span className="text-red-600 font-bold">↘</span>
                        )}
                        <span className={`font-medium capitalize ${trade.direction === 'long' ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.direction}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">{formatCurrency(trade.entry_price)}</td>
                    <td className="p-4 text-slate-700">{formatCurrency(trade.exit_price)}</td>
                    <td className="p-4 text-slate-700">{trade.quantity || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`font-bold ${parseFloat(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{formatNumber(trade.rr)}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-800">{trade.strategy || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{trade.setup || ''}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(trade)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                        <button
                          onClick={() => handleDelete(trade.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTrades.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">
                  <span className="text-6xl">📊</span>
                </div>
                <p className="text-slate-600 text-lg">No trades found</p>
                <p className="text-slate-400">Add your first trade to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}