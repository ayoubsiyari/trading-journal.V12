// RiskDashboard.jsx – shows risk distribution and KPIs
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
} from 'recharts';

const formatNumber = (val) => (val == null ? 'N/A' : parseFloat(val).toFixed(2));

export default function RiskDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/risk-summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();

        // Build histogram buckets of width 0.5R
        const buckets = {};
        json.r_multiples.forEach((r) => {
          const key = (Math.floor(r * 2) / 2).toFixed(1); // e.g. 0.0, 0.5, 1.0
          buckets[key] = (buckets[key] || 0) + 1;
        });
        const histogram = Object.keys(buckets)
          .map((k) => ({ bucket: k, count: buckets[k] }))
          .sort((a, b) => parseFloat(a.bucket) - parseFloat(b.bucket));

        setData({ kpi: json, histogram });
      } catch (err) {
        console.error('risk fetch error', err);
        setError('Failed to load risk metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-10">Loading…</div>
    );
  }
  if (error) {
    return <div className="text-red-600 p-10 text-center">{error}</div>;
  }
  const { kpi, histogram } = data;
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-black mb-8">Risk Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card title="Average Risk (R)" value={formatNumber(kpi.avg_risk)} accent="blue" />
        <Card title="Average R-multiple" value={formatNumber(kpi.avg_r_multiple)} accent="green" />
        <Card title="Max Risk" value={formatNumber(kpi.max_risk)} accent="purple" />
        <Card title="Over-Risk Trades" value={kpi.over_risk_count} accent={kpi.over_risk_count > 0 ? 'red' : 'gray'} />
      </div>

      {/* Histogram */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">R-Multiple Distribution</h2>
        {histogram.length === 0 ? (
          <p>No trades to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" label={{ value: 'R', position: 'insideBottom', dy: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count">
                {histogram.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={parseFloat(entry.bucket) >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, accent }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-600 bg-gray-100',
  };
  const classes = colorMap[accent] || 'text-gray-800 bg-gray-100';
  return (
    <div className={`p-6 rounded-2xl shadow border ${classes}`}>
      <p className="text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}
