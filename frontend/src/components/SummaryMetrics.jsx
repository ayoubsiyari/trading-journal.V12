// src/components/SummaryMetrics.jsx

import React from "react";
import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const formatCurrency = (val) =>
  val == null ? "N/A" : `$${parseFloat(val).toFixed(2)}`;
const formatPercent = (val) =>
  val == null ? "N/A" : `${parseFloat(val).toFixed(1)}%`;

export default function SummaryMetrics({ stats }) {
  // Expects an object with:
  //   stats.total_trades
  //   stats.total_pnl
  //   stats.avg_pnl
  //   stats.win_rate
  //
  // Loss Rate is computed as 100 − win_rate (if win_rate exists).

  const lossRate =
    stats.win_rate != null ? Math.max(0, 100 - stats.win_rate) : null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Summary Metrics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Total Trades */}
        <div className="bg-white rounded-2xl shadow p-5 flex items-center space-x-4">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Trades
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_trades != null ? stats.total_trades : "N/A"}
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
                stats.total_pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.total_pnl != null
                ? formatCurrency(stats.total_pnl)
                : "N/A"}
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
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-gray-400"
              }`}
            >
              {stats.total_trades
                ? formatCurrency(stats.avg_pnl)
                : "N/A"}
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
              {stats.win_rate != null
                ? formatPercent(stats.win_rate)
                : "N/A"}
            </p>
            <p className="text-xs text-gray-400">
              Fraction of profitable trades
            </p>
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
              {lossRate != null ? formatPercent(lossRate) : "N/A"}
            </p>
            <p className="text-xs text-gray-400">Complement to Win Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
