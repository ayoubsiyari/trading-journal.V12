import React, { useState, useMemo } from 'react';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import { format, subDays, subMonths } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, ReferenceLine, LabelList
} from 'recharts';
import {
  Activity, AlertCircle, Award, BarChart3, Calendar as CalendarIcon,
  Clock as ClockIcon, DollarSign, Eye, EyeOff, LineChart as LineChartIcon,
  PieChart as PieChartIcon, Settings, Target, TrendingUp, TrendingDown, ChevronDown
} from 'lucide-react';

// Color palette
const COLORS = {
  primary: '#3b82f6',    // blue-500
  success: '#10b981',  // emerald-500
  danger: '#ef4444',   // red-500
  warning: '#f59e0b',  // amber-500
  info: '#06b6d4',    // cyan-500
  background: '#f9fafb', // gray-50
  border: '#e5e7eb',   // gray-200
  text: '#111827'      // gray-900
};

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, valueFormatter = (val) => val, labelFormatter = (val) => val }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">{labelFormatter(label, payload)}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{valueFormatter(entry.value, entry.name)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const renderCustomizedLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Empty state for charts
const EmptyChartMessage = () => (
  <div className="h-full flex items-center justify-center text-gray-400">
    <p>No data available</p>
  </div>
);

// PnL Chart Component
const PnLChart = ({ data, timeRange = 30 }) => {
  // Generate sample data if no data is provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    
    const today = new Date();
    return Array.from({ length: timeRange }, (_, i) => {
      const date = subDays(today, timeRange - 1 - i);
      return {
        date: format(date, 'MMM d'),
        pnl: Math.floor(Math.random() * 5000) - 1000, // Random P&L between -1000 and 4000
        trades: Math.floor(Math.random() * 15) + 1
      };
    });
  }, [data, timeRange]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">P&L Trend</h3>
        <div className="flex items-center text-sm text-gray-500">
          <LineChartIcon className="w-4 h-4 mr-1" />
          <span>Last {timeRange} days</span>
        </div>
      </div>
      <div className="h-64">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: COLORS.border }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    valueFormatter={(value) => `$${formatNumber(value)}`}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                } 
              />
              <Area 
                type="monotone" 
                dataKey="pnl" 
                name="P&L"
                stroke={COLORS.primary} 
                fillOpacity={1} 
                fill="url(#colorPnl)" 
                strokeWidth={2}
                activeDot={{ r: 6, strokeWidth: 2, fill: COLORS.primary, stroke: '#fff' }}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage />
        )}
      </div>
    </div>
  );
};

// Win/Loss Pie Chart Component
const WinLossPieChart = ({ wins = 0, losses = 0, totalTrades = 0 }) => {
  const data = [
    { name: 'Wins', value: wins, color: COLORS.success },
    { name: 'Losses', value: losses, color: COLORS.danger }
  ];

  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const lossRate = 100 - winRate;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Win/Loss Ratio</h3>
        <div className="flex items-center text-sm text-gray-500">
          <PieChartIcon className="w-4 h-4 mr-1" />
          <span>All Trades</span>
        </div>
      </div>
      <div className="h-64">
        {totalTrades > 0 ? (
          <div className="flex flex-col items-center h-full">
            <div className="relative w-48 h-48">
              <PieChart width={200} height={200}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="inside"
                    fill="#FFFFFF"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => value}
                  />
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} ${name}`, '']} 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  itemStyle={{ color: COLORS.text, fontSize: '12px' }}
                  labelStyle={{ color: COLORS.text, fontWeight: 'bold' }}
                />
                <Legend content={renderCustomizedLegend} />
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: winRate >= 50 ? COLORS.success : COLORS.danger }}>
                    {winRate}%
                  </p>
                  <p className="text-xs text-gray-500">Win Rate</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between w-full px-6 mt-2">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Trades</p>
                <p className="text-lg font-semibold">{totalTrades}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Win Rate</p>
                <p className="text-lg font-semibold" style={{ color: COLORS.success }}>{winRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Loss Rate</p>
                <p className="text-lg font-semibold" style={{ color: COLORS.danger }}>{lossRate}%</p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyChartMessage />
        )}
      </div>
    </div>
  );
};

export { PnLChart, WinLossPieChart };
