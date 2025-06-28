import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Tag,
  TrendingUp,
  TrendingDown,
  Download,
  Settings,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// Enhanced formatting functions
const formatCurrency = (val) =>
  val == null ? "—" : typeof val === "number" ? `$${parseFloat(val).toFixed(2)}` : val;

const formatPercent = (val) =>
  val == null ? "—" : typeof val === "number" ? `${parseFloat(val).toFixed(1)}%` : val;

const formatNumber = (val) =>
  val == null ? "—" : typeof val === "number" ? parseFloat(val).toFixed(2) : val;

export default function TagBreakdown() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [timeframe, setTimeframe] = useState("all");
  const [sortField, setSortField] = useState("win_rate");
  const [sortDirection, setSortDirection] = useState("desc");

  // Calculate overall statistics
  const calculateOverallStats = (items) => {
    if (!items || items.length === 0) return null;
    
    const totalTrades = items.reduce((sum, item) => sum + (item.trades || 0), 0);
    const totalWinRate = items.reduce((sum, item) => 
      sum + (item.win_rate ? parseFloat(item.win_rate) : 0), 0) / items.length;
    const totalAvgPnl = items.reduce((sum, item) => 
      sum + (item.avg_pnl ? parseFloat(item.avg_pnl) : 0), 0) / items.length;
    const totalAvgRr = items.reduce((sum, item) => 
      sum + (item.avg_rr ? parseFloat(item.avg_rr) : 0), 0) / items.length;

    return {
      totalTrades,
      totalWinRate: totalWinRate.toFixed(1),
      totalAvgPnl: totalAvgPnl.toFixed(2),
      totalAvgRr: totalAvgRr.toFixed(2)
    };
  };

  useEffect(() => {
    const fetchTagStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/journal/tag-breakdown", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to fetch tag stats");
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTagStats();
  }, []);

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span>❌ {error}</span>
      </div>
    </div>
  );

  const overallStats = calculateOverallStats(data);

  if (!data || data.length === 0) return (
    <div className="p-8">
      <div className="flex items-center space-x-2 text-gray-500">
        <AlertCircle className="h-5 w-5" />
        <span>No tag data available</span>
      </div>
    </div>
  );

  // Enhanced formatting functions
  const formatCurrency = (val) =>
    val == null ? "—" : typeof val === "number" ? `$${parseFloat(val).toFixed(2)}` : val;

  const formatPercent = (val) =>
    val == null ? "—" : typeof val === "number" ? `${parseFloat(val).toFixed(1)}%` : val;

  const formatNumber = (val) =>
    val == null ? "—" : typeof val === "number" ? parseFloat(val).toFixed(2) : val;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">🧠 Tag-Based Performance Analysis</h1>
      <p className="text-slate-600 mb-10">
        Analyze your performance across tags like setups, mistakes, and emotions.
      </p>

      <div className="mb-12">
    {overallStats && (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-2">Overall Performance</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-slate-500">Total Trades</div>
            <div className="text-xl font-semibold">{overallStats.totalTrades}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-slate-500">Avg Win Rate</div>
            <div className="text-xl font-semibold">{overallStats.totalWinRate}%</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-slate-500">Avg P&L</div>
            <div className="text-xl font-semibold">${overallStats.totalAvgPnl}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-slate-500">Avg R:R</div>
            <div className="text-xl font-semibold">{overallStats.totalAvgRr}</div>
          </div>
        </div>
      </div>
    )}

    <div className="overflow-x-auto rounded-lg shadow border border-slate-200">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="p-3">Tag</th>
            <th className="p-3">Trades</th>
            <th className="p-3">Win Rate</th>
            <th className="p-3">Avg P&L</th>
            <th className="p-3">Avg R:R</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-slate-100 ${
                i % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <td className="p-3 font-medium">{row.tag}</td>
              <td className="p-3">{row.trades}</td>
              <td className="p-3">{formatPercent(row.win_rate)}</td>
              <td className="p-3">{formatCurrency(row.avg_pnl)}</td>
              <td className="p-3">{formatNumber(row.avg_rr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
    {data.map((item, index) => (
          <div key={index} className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4 capitalize">
              {item.tag.replace(/_/g, " ")}
            </h2>
            <div className="overflow-x-auto rounded-lg shadow border border-slate-200">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Label</th>
                    <th className="p-3">Trades</th>
                    <th className="p-3">Win Rate</th>
                    <th className="p-3">Avg P&L</th>
                    <th className="p-3">Avg R:R</th>
                  </tr>
                </thead>
                <tbody>
                  {item.items.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="p-3 font-medium">{row.label}</td>
                      <td className="p-3">{row.trades}</td>
                      <td className="p-3">{formatPercent(row.win_rate)}</td>
                      <td className="p-3">{formatCurrency(row.avg_pnl)}</td>
                      <td className="p-3">{formatNumber(row.avg_rr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    
  );
}
