// src/pages/analytics/BenchmarkComparison.jsx
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

const formatCurrency = (val) =>
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;

export default function BenchmarkComparison() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('SPY');
  const [benchmarkData, setBenchmarkData] = useState([]);

  // pull stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/journal/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Stats fetch error', err);
        setError('Failed to load stats');
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // fetch benchmark when stats or symbol ready
  useEffect(() => {
    if (!stats || !stats.equity_curve || stats.equity_curve.length === 0) return;
    const start = stats.equity_curve[0].date;
    const end = stats.equity_curve[stats.equity_curve.length - 1].date;

    fetch(`/api/market/benchmark?symbol=${symbol}&start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((json) => {
        const first = json.prices[0]?.price || 1;
        const norm = json.prices.map((p) => ({
          date: p.date,
          bench: (p.price / first) * stats.equity_curve[0].cumulative_pnl,
        }));
        setBenchmarkData(norm);
      })
      .catch((e) => console.error('Benchmark fetch error', e));
  }, [stats, symbol]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return null;

  const equityCurveData = stats.equity_curve.map((pt) => ({
    date: pt.date,
    equity: pt.cumulative_pnl,
  }));

  // Merge equity and benchmark on date for single dataset (simpler for recharts)
  const merged = equityCurveData.map((row) => {
    const benchRow = benchmarkData.find((b) => b.date === row.date);
    return { ...row, bench: benchRow ? benchRow.bench : null };
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold mb-8">Portfolio vs Benchmark</h1>

      <div className="flex items-center space-x-4 mb-6">
        <label htmlFor="benchSymbol" className="font-semibold">
          Symbol:
        </label>
        <select
          id="benchSymbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="SPY">SPY (S&P 500)</option>
          <option value="QQQ">QQQ (Nasdaq)</option>
          <option value="BTC-USD">BTC</option>
          <option value="ETH-USD">ETH</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={merged} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(val) => `$${val.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name === 'equity' ? 'Equity' : 'Benchmark']}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            name="Equity"
          />
          <Line
            type="monotone"
            dataKey="bench"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name={symbol}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
