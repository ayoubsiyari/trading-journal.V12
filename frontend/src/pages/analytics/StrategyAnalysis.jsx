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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Settings, TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (v) => (v == null ? 'N/A' : `$${v.toFixed(2)}`);
const formatPercent = (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`);
const formatRR = (v) => (v == null ? 'N/A' : v.toFixed(2));

export default function StrategyAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('pnl');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/strategy-analysis', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const sorted = [...data].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'strategy') return dir * a.strategy.localeCompare(b.strategy);
    return dir * (a[sortBy] - b[sortBy]);
  });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const totalStrategies = data.length;
  const best = data.reduce((p, c) => (c.pnl > p.pnl ? c : p), data[0] || {});
  const worst = data.reduce((p, c) => (c.pnl < p.pnl ? c : p), data[0] || {});

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Strategy Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xs p-6 rounded shadow-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Settings className="h-5 w-5"/>Strategies</h3>
          <p className="text-3xl font-bold">{totalStrategies}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xs p-6 rounded shadow-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600"/>Best</h3>
          <p className="text-lg font-bold">{best?.strategy}</p>
          <p className="text-sm">PnL {formatCurrency(best?.pnl||0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xs p-6 rounded shadow-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600"/>Worst</h3>
          <p className="text-lg font-bold">{worst?.strategy}</p>
          <p className="text-sm">PnL {formatCurrency(worst?.pnl||0)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              {['strategy','trades','win_rate','avg_rr','pnl'].map(col=> (
                <th key={col} className="py-2 px-4 cursor-pointer" onClick={()=>handleSort(col)}>{col.replace('_',' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row,i)=>(
              <tr key={i} className="border-t">
                <td className="py-2 px-4 font-medium">{row.strategy}</td>
                <td className="py-2 px-4">{row.trades}</td>
                <td className="py-2 px-4">{formatPercent(row.win_rate)}</td>
                <td className="py-2 px-4">{formatRR(row.avg_rr)}</td>
                <td className="py-2 px-4 text-right">{formatCurrency(row.pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded shadow-card">
          <h2 className="font-semibold mb-2">Win Rate vs Avg R:R</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="avg_rr" name="Avg R:R" />
              <YAxis dataKey="win_rate" name="Win %" />
              <Tooltip formatter={(v)=>v.toFixed(2)} />
              <Scatter data={data} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded shadow-card">
          <h2 className="font-semibold mb-2">PnL by Strategy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="strategy" />
              <YAxis />
              <Tooltip formatter={(v)=>formatCurrency(v)} />
              <Bar dataKey="pnl">
                {data.map((d,i)=>(<Cell key={i} fill={d.pnl>=0?'#10b981':'#ef4444'}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
