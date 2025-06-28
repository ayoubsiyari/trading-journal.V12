// src/components/ProfessionalTradingJournal.jsx

import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import { ThemeContext } from '../context/ThemeContext';


const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;
const formatNumber = (val) => (val == null ? 'N/A' : parseFloat(val).toFixed(2));
const formatPercent = (val) => `${parseFloat(val || 0).toFixed(2)}%`;

export default function ProfessionalTradingJournal() {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [form, setForm] = useState({
    symbol: '',
    direction: 'long',
    entry: '',
    exit: '',
    stop_loss: '',
    take_profit: '',
    quantity: '',
    pnl: '',
    rr: '',
    instrument_type: 'crypto',
    contract_size: '',
    risk_amount: '',
    strategy: '',
    setup: '',
    notes: '',
    variables: {},
  });
  const [visibleVarCount, setVisibleVarCount] = useState(1);
  const [trades, setTrades] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [editingTrade, setEditingTrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // ─── Pagination State ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // can be number or 'all'

  // ─── Fetch Trades & Import History ───────────────────────────────────────────────
  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/journal/list", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch trades');
      }
      const data = await res.json();
      setTrades(data);
      setError('');
      setCurrentPage(1);
    } catch (err) {
      setError('❌ Failed to load trades');
      console.error('Fetch trades error:', err);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/journal/import/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setImportHistory(data);
      setError("");
    } catch (err) {
      setError("❌ Failed to load import history");
      console.error("Fetch import history error:", err);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchImportHistory();
  }, []);

  // ─── Reset page when filter or search changes ──────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, pageSize, trades]);

  // ─── Statistics Calculation ───────────────────────────────────────────────────
  const stats = {
    totalTrades: trades.length,
    winningTrades: trades.filter((t) => parseFloat(t.pnl) > 0).length,
    totalPnL: trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0),
    // Calculate win rate excluding break-even trades
    winRate: trades.length > 0
      ? (trades.filter((t) => parseFloat(t.pnl) > 0).length /
          trades.filter((t) => parseFloat(t.pnl) !== 0).length) *
        100
      : 0,
    avgRR:
      trades.length > 0
        ? trades.reduce((sum, t) => sum + parseFloat(t.rr || 0), 0) /
          trades.length
        : 0,
    avgWin: trades
      .filter((t) => parseFloat(t.pnl) > 0)
      .reduce((sum, t, _, arr) => sum + parseFloat(t.pnl) / arr.length, 0),
    avgLoss: Math.abs(
      trades
        .filter((t) => parseFloat(t.pnl) < 0)
        .reduce((sum, t, _, arr) => sum + parseFloat(t.pnl) / arr.length, 0)
    ),
  };

  // ─── Handle Input Changes & Auto-Calculate P&L & R:R ─────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    // Auto-calc P&L when entry, exit, quantity, direction exist
    if (
      ["entry", "exit", "quantity", "direction"].includes(name) &&
      updated.entry &&
      updated.exit &&
      updated.quantity
    ) {
      const entryPrice = parseFloat(updated.entry);
      const exitPrice = parseFloat(updated.exit);
      const qty = parseFloat(updated.quantity);
      let rawPnl = 0;

      if (updated.direction === "long") {
        rawPnl = (exitPrice - entryPrice) * qty;
      } else {
        rawPnl = (entryPrice - exitPrice) * qty;
      }
      updated.pnl = rawPnl.toFixed(2);

      // Auto-calc R:R if risk_amount present
      if (updated.risk_amount) {
        const riskAmt = parseFloat(updated.risk_amount);
        updated.rr = riskAmt ? (rawPnl / riskAmt).toFixed(2) : "";
      }
    }

    // Recalculate R:R if risk_amount changed
    if (
      name === "risk_amount" &&
      updated.entry &&
      updated.exit &&
      updated.quantity
    ) {
      const entryPrice = parseFloat(updated.entry);
      const exitPrice = parseFloat(updated.exit);
      const qty = parseFloat(updated.quantity);
      let rawPnl = 0;

      if (updated.direction === "long") {
        rawPnl = (exitPrice - entryPrice) * qty;
      } else {
        rawPnl = (entryPrice - exitPrice) * qty;
      }
      const riskAmt = parseFloat(updated.risk_amount);
      updated.rr = riskAmt ? (rawPnl / riskAmt).toFixed(2) : "";
    }

    setForm(updated);
  };

  // ─── Edit & Delete Handlers ────────────────────────────────────────────────────
   const handleEdit = (trade) => {
    setEditingTrade(trade);
    setForm({
      symbol: trade.symbol,
      direction: trade.direction,
      entry: trade.entry_price,
      exit: trade.exit_price,
      stop_loss: trade.stop_loss || '',
      take_profit: trade.take_profit || '',
      quantity: trade.quantity || '',
      pnl: trade.pnl,
      rr: trade.rr,
      instrument_type: trade.instrument_type || 'crypto',
      contract_size: trade.contract_size || '',
      risk_amount: trade.risk_amount || '',
      strategy: trade.strategy || '',
      setup: trade.setup || '',
      notes: trade.notes || '',
      var1: trade.extra_data?.var1 || '',
      var2: trade.extra_data?.var2 || '',
      var3: trade.extra_data?.var3 || '',
      var4: trade.extra_data?.var4 || '',
      var5: trade.extra_data?.var5 || '',
      var6: trade.extra_data?.var6 || '',
      var7: trade.extra_data?.var7 || '',
      var8: trade.extra_data?.var8 || '',
      var9: trade.extra_data?.var9 || '',
      var10: trade.extra_data?.var10 || '',
      extraData: trade.extra_data || {}
    });
    setVisibleVarCount(1);
    setShowForm(true);
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trade?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/journal/delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchTrades();
        setError("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete trade");
      }
    } catch (err) {
      setError("❌ Failed to delete trade");
      console.error("Delete trade error:", err);
    }
  };

  // ─── Delete Import Batch ───────────────────────────────────────────────────────
  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Delete this import batch and all its trades?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/journal/import/${batchId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchTrades();
        await fetchImportHistory();
        setError("");
      } else {
        setError(data.error || "Failed to delete import batch");
      }
    } catch (err) {
      setError("❌ Failed to delete import batch");
      console.error("Delete batch error:", err);
    }
  };

  // ─── Add / Update Trade ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // 1) Build payload
    const token = localStorage.getItem("token");
    const payload = {
      symbol: form.symbol.toUpperCase(),
      direction: form.direction === "long" ? "long" : "short",
      entry_price: parseFloat(form.entry),
      exit_price: parseFloat(form.exit),
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      quantity: parseFloat(form.quantity),
      instrument_type: form.instrument_type,
      contract_size: form.contract_size ? parseFloat(form.contract_size) : null,
      risk_amount: parseFloat(form.risk_amount),
      pnl: parseFloat(form.pnl),
      rr: parseFloat(form.rr),
      strategy: form.strategy || null,
      setup: form.setup || null,
      notes: form.notes || null,
      extra_data: {
        ...form.extraData,
        var1: form.var1 || null,
        var2: form.var2 || null,
        var3: form.var3 || null,
        var4: form.var4 || null,
        var5: form.var5 || null,
        var6: form.var6 || null,
        var7: form.var7 || null,
        var8: form.var8 || null,
        var9: form.var9 || null,
        var10: form.var10 || null,
      }
    };

    console.log("▶️ Saving trade, payload:", payload);

    // 2) Send POST or PUT
    const url = editingTrade
      ? `http://localhost:5000/api/journal/${editingTrade.id}`
      : `http://localhost:5000/api/journal/add`;
    const method = editingTrade ? "PUT" : "POST";

    let res, text, data;
    try {
      res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`⬅️ ${method} ${url} returned status`, res.status);

      // read raw text first, then try JSON
      text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
      console.log("⬅️ Response JSON:", data);

      if (res.ok) {
        // 3) On success, clear form and re‐fetch trades
        setForm({
          symbol: "",
          direction: "long",
          entry: "",
          exit: "",
          stop_loss: "",
          take_profit: "",
          quantity: "",
          pnl: "",
          rr: "",
          instrument_type: "crypto",
          contract_size: "",
          risk_amount: "",
          strategy: "",
          setup: "",
          notes: "",
          extraData: {},
        });
        setEditingTrade(null);
        setShowForm(false);
        await fetchTrades(); // ← repopulate the table
        setError("");
      } else {
        setError(data.error || `Server returned ${res.status}`);
      }
    } catch (err) {
      console.error("❌ handleSubmit threw:", err);
      setError(err.message || "Failed to save trade");
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter & Search ───────────────────────────────────────────────────────────
  const filteredTrades = trades.filter((trade) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "wins" && parseFloat(trade.pnl) > 0) ||
      (filter === "losses" && parseFloat(trade.pnl) < 0) ||
      (filter === "long" && trade.direction === "long") ||
      (filter === "short" && trade.direction === "short");

    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((trade.strategy || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())) ||
      ((trade.setup || "").toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // ─── Pagination Calculations ───────────────────────────────────────────────────
  const totalTrades = filteredTrades.length;
  const isAll = pageSize === "all";
  const effectivePageSize = isAll ? totalTrades : pageSize;
  const totalPages = isAll ? 1 : Math.ceil(totalTrades / effectivePageSize);
  const startIndex = isAll ? 0 : (currentPage - 1) * effectivePageSize;
  const endIndex = isAll ? totalTrades : startIndex + effectivePageSize;
  const displayedTrades = filteredTrades.slice(startIndex, endIndex);

  const changePageSize = (e) => {
    const value = e.target.value;
    if (value === "all") {
      setPageSize("all");
    } else {
      setPageSize(parseInt(value, 10));
    }
    setCurrentPage(1);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className={`p-8 max-w-7xl mx-auto ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
        {/* ─── Header ──────────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-2`}>
              Trading Journal
            </h1>
            <p className="text-slate-600">
              Track, analyze, and optimize your trading performance
            </p>
          </div>

          <div className="flex gap-4">
            {/* Import Input */}
            <label className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer">
              📂 Import
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    const file = e.target.files[0];
                    const formData = new FormData();
                    formData.append("file", file);
                    const token = localStorage.getItem("token");
                    fetch("http://localhost:5000/api/journal/import/excel", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.imported != null) {
                          fetchTrades();
                          fetchImportHistory();
                          setError("");
                        } else {
                          setError(data.error || "❌ Import failed");
                        }
                      })
                      .catch((err) => {
                        console.error("Import error:", err);
                        setError("❌ Import failed");
                      });
                  }
                }}
              />
            </label>

            {/* Export Button */}
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(
                    "http://localhost:5000/api/journal/export",
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                  if (!res.ok) {
                    throw new Error("Failed to export");
                  }
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "trading_journal.xlsx";
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error("Export error:", err);
                  setError("❌ Export failed");
                }
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              ⬇️ Export
            </button>

            {/* Toggle Form */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <span className="text-lg">+</span> Add Trade
            </button>
          </div>
        </div>

        {/* ─── Error Message ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ─── Statistics Dashboard ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total P&L</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
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
                <p className="text-2xl font-bold text-slate-800">
                  {formatPercent(stats.winRate)}
                </p>
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
                <p className="text-2xl font-bold text-slate-800">
                  {formatNumber(stats.avgRR)}
                </p>
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
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalTrades}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <span className="text-orange-600 text-xl font-bold">📅</span>
              </div>
            </div>
          </div>
        </div>

{/* ─── Import History ───────────────────────────────────────────────────────── */}
<div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
  <h2 className="text-2xl font-bold text-slate-800 mb-4">
    Import History
  </h2>

  {importHistory.length === 0 ? (
    <p className="text-slate-600">No import history available.</p>
  ) : (
    <table className="w-full mb-4">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="text-left p-3 font-semibold text-slate-700">
            Filename
          </th>
          <th className="text-left p-3 font-semibold text-slate-700">
            Imported At
          </th>
          <th className="text-left p-3 font-semibold text-slate-700">
            # Trades
          </th>
          <th className="text-left p-3 font-semibold text-slate-700">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {importHistory.map((batch, idx) => (
          <tr
            key={batch.id}
            className={`${
              idx % 2 === 0 ? "bg-white" : "bg-slate-25"
            } border-b border-slate-100`}
          >
            <td className="p-3 text-slate-700">{batch.filename}</td>
            <td className="p-3 text-slate-700">
              {new Date(batch.imported_at).toLocaleString()}
            </td>
            <td className="p-3 text-slate-700">{batch.trade_count}</td>
            <td className="p-3 text-right flex justify-end items-center gap-2">
              {/* ─── Download Button ─────────────────────────── */}
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    alert("You are not logged in. Please log in again.");
                    return;
                  }

                  try {
                    const res = await fetch(
                      `http://localhost:5000/api/journal/import/file/${batch.id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (!res.ok) {
                      // Read JSON body if possible to see backend error
                      let errMsg = `HTTP ${res.status}`;
                      try {
                        const body = await res.json();
                        if (body.error) {
                          errMsg = body.error;
                        }
                      } catch (_) {
                        // ignore if response isn’t JSON
                      }
                      throw new Error(errMsg);
                    }

                    // If backend responded with a file blob:
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = batch.filename;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("Download failed:", err);
                    alert(`Failed to download file:\n${err.message}`);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                Download
              </button>

              {/* ─── Delete Button ────────────────────────────── */}
              <button
                onClick={() => handleDeleteBatch(batch.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>


        {/* ─── Trade Form ───────────────────────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingTrade ? "Edit Trade" : "Add New Trade"}
            </h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Symbol */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Symbol*
                  </label>
                  <input
                    name="symbol"
                    value={form.symbol}
                    onChange={handleChange}
                    placeholder="e.g., AAPL"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Direction*
                  </label>
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

                {/* Instrument Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Instrument Type*
                  </label>
                  <select
                    name="instrument_type"
                    value={form.instrument_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                    <option value="forex">Forex</option>
                    <option value="future">Future</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quantity*
                  </label>
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

                {/* Contract Size (only for forex/future) */}
                {(form.instrument_type === "forex" ||
                  form.instrument_type === "future") && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {form.instrument_type === "forex"
                        ? "Lot Size (e.g., 100000)"
                        : "Contract Size"}
                    </label>
                    <input
                      name="contract_size"
                      value={form.contract_size}
                      onChange={handleChange}
                      placeholder={
                        form.instrument_type === "forex" ? "100000" : "1"
                      }
                      type="number"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Risk Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Risk Amount ($)*
                  </label>
                  <input
                    name="risk_amount"
                    value={form.risk_amount}
                    onChange={handleChange}
                    placeholder="e.g., 50"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Entry Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Entry Price*
                  </label>
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

                {/* Exit Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Exit Price*
                  </label>
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

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stop Loss
                  </label>
                  <input
                    name="stop_loss"
                    value={form.stop_loss}
                    onChange={handleChange}
                    placeholder="145.50"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Take Profit
                  </label>
                  <input
                    name="take_profit"
                    value={form.take_profit}
                    onChange={handleChange}
                    placeholder="165.00"
                    type="number"
                    step="0.01"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* P&L (read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    P&L
                  </label>
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

                {/* R:R */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Risk:Reward
                  </label>
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
              </div>

              {/* Strategy / Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Strategy
                  </label>
                  <input
                    name="strategy"
                    value={form.strategy}
                    onChange={handleChange}
                    placeholder="e.g., Breakout"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Setup
                  </label>
                  <input
                    name="setup"
                    value={form.setup}
                    onChange={handleChange}
                    placeholder="e.g., Bull Flag"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
{/* Optional Variables Section */}
// Inside your Journal.jsx form
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
  {/* Setup dropdown */}
  <div>
    <label className="block mb-1 font-medium text-sm text-gray-700">Setup</label>
    <select
      name="setup"
      value={form.variables.setup || ''}
      onChange={(e) => setForm({ ...form, variables: { ...form.variables, setup: e.target.value } })}
      className="w-full border border-gray-300 rounded-md p-2"
    >
      <option value="">-- Select --</option>
      <option value="Breakout">Breakout</option>
      <option value="Reversal">Reversal</option>
      <option value="Retest">Retest</option>
    </select>
  </div>

  {/* Emotion dropdown */}
  <div>
    <label className="block mb-1 font-medium text-sm text-gray-700">Emotion</label>
    <select
      name="emotion"
      value={form.variables.emotion || ''}
      onChange={(e) => setForm({ ...form, variables: { ...form.variables, emotion: e.target.value } })}
      className="w-full border border-gray-300 rounded-md p-2"
    >
      <option value="">-- Select --</option>
      <option value="Fear">Fear</option>
      <option value="Greed">Greed</option>
      <option value="Confidence">Confidence</option>
    </select>
  </div>

  {/* Mistake checkboxes */}
  <div className="md:col-span-2">
    <label className="block mb-1 font-medium text-sm text-gray-700">Mistakes</label>
    <div className="flex flex-wrap gap-4">
      {["Overtrade", "Late Entry", "No SL", "Exited Early"].map((tag) => (
        <label key={tag} className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.variables.mistake?.includes(tag)}
            onChange={(e) => {
              const mistakes = form.variables.mistake || [];
              const updated = e.target.checked
                ? [...mistakes, tag]
                : mistakes.filter((m) => m !== tag);
              setForm({ ...form, variables: { ...form.variables, mistake: updated } });
            }}
          />
          <span>{tag}</span>
        </label>
      ))}
    </div>
  </div>
</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {Array.from({ length: visibleVarCount }, (_, i) => {
                  const name = `var${i+1}`;
                  return (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Variable {i+1}
                        <span className="text-xs text-slate-400 ml-1">(optional)</span>
                      </label>
                      <input
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={`Var ${i+1}`}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
                {visibleVarCount < 10 && (
                  <button
                    type="button"
                    onClick={() => setVisibleVarCount(c => c + 1)}
                    className="flex items-center justify-center space-x-2 border-2 border-dashed border-slate-300 rounded-xl p-3 text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Add Variable</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes
                </label>
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
                  {loading
                    ? "Saving..."
                    : editingTrade
                    ? "Update Trade"
                    : "Save Trade"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTrade(null);
                    setForm({
                      symbol: "",
                      direction: "long",
                      entry: "",
                      exit: "",
                      stop_loss: "",
                      take_profit: "",
                      quantity: "",
                      pnl: "",
                      rr: "",
                      instrument_type: "crypto",
                      contract_size: "",
                      risk_amount: "",
                      strategy: "",
                      setup: "",
                      notes: "",
                      variables: {}
                    });
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Filters & Search ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {["all", "wins", "losses", "long", "short"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    filter === filterType
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                🔍
              </span>
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

        {/* ─── Page Size Selector ─────────────────────────────────────────────────────── */}
        <div className="flex items-center mb-4 space-x-2">
          <label className="text-sm font-medium text-slate-700">
            Rows per page:
          </label>
          <select
            value={pageSize}
            onChange={changePageSize}
            className="pl-3 pr-10 py-2 border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* ─── Trade History Table ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                Trade History
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Date
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Symbol
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Direction
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Entry
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Exit
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Qty
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    P&L
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    R:R
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Instrument
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedTrades.map((trade, index) => (
                  <tr
                    key={trade.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-25"
                    }`}
                  >
                    <td className="p-4 text-slate-600">
                      {new Date(trade.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">
                        {trade.symbol}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {trade.direction === "long" ? (
                          <span className="text-green-600 font-bold">↗</span>
                        ) : (
                          <span className="text-red-600 font-bold">↘</span>
                        )}
                        <span
                          className={`font-medium capitalize ${
                            trade.direction === "long"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {trade.direction}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      {formatCurrency(trade.entry_price)}
                    </td>
                    <td className="p-4 text-slate-700">
                      {formatCurrency(trade.exit_price)}
                    </td>
                    <td className="p-4 text-slate-700">
                      {trade.quantity || "N/A"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-bold ${
                          parseFloat(trade.pnl) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">
                      {formatNumber(trade.rr)}
                    </td>
                    <td className="p-4 text-slate-700 capitalize">
                      {trade.instrument_type}
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

              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="text-slate-400 mb-2">
                      <span className="text-6xl">📊</span>
                    </div>
                    <p className="text-slate-600 text-lg">No trades found</p>
                    <p className="text-slate-400">
                      Add your first trade to get started
                    </p>
                  </td>
                </tr>
              )}
            </table>
          </div>

          {/* ─── Pagination Controls ─────────────────────────────────────────────────── */}
          {!isAll && totalTrades > effectivePageSize && (
            <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 p-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Previous
              </button>

              <span className="text-slate-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
