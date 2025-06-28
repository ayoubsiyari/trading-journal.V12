import React from 'react';
import { formatCurrency, formatPercent } from '../../utils/dateUtils';

const StatCard = ({ title, value, change, isCurrency = false, isPositive = null }) => {
  const getColorClass = () => {
    if (isPositive === null) return 'text-gray-800 dark:text-gray-200';
    return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <div className="flex items-baseline justify-between">
        <p className={`text-xl font-semibold ${getColorClass()}`}>
          {isCurrency ? formatCurrency(value) : value}
        </p>
        {change !== undefined && (
          <span className={`text-xs px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
};

const PerformanceCard = ({ stats = {} }) => {
  const { 
    total_pnl = 0, 
    win_rate = 0, 
    total_trades = 0, 
    profit_factor = 0,
    avg_win = 0,
    avg_loss = 0,
    pnl_change_percentage = 0,
    win_rate_change = 0
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Total P&L" 
        value={total_pnl} 
        change={pnl_change_percentage}
        isCurrency 
        isPositive={total_pnl >= 0}
      />
      <StatCard 
        title="Win Rate" 
        value={`${(win_rate * 100).toFixed(1)}%`} 
        change={win_rate_change}
        isPositive={win_rate_change >= 0}
      />
      <StatCard 
        title="Total Trades" 
        value={total_trades} 
      />
      <StatCard 
        title="Profit Factor" 
        value={profit_factor.toFixed(2)} 
        isPositive={profit_factor >= 1.5}
      />
    </div>
  );
};

export default PerformanceCard;
