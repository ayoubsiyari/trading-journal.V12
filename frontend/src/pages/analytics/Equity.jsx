import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { subDays, isAfter, format } from 'date-fns';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import { fetchWithAuth } from '../../utils/fetchUtils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Brush,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  AlertCircle,
  ChevronDown,
  GitCompare,
  Check,
  X,
  DollarSign,
  Activity,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { calculateSharpeRatio, validateMetricsInputs } from '../../utils/metrics';

// Professional color palette
const colors = {
  primary: '#1e40af',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
};

// Helper functions
const formatCurrency = (val) =>
  val == null ? 'N/A' : new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);

const formatPercent = (val) =>
  val == null ? 'N/A' : new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(val / 100);

const formatNumber = (val) =>
  val == null ? 'N/A' : new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(val);

// Get color based on Sharpe Ratio value
const getSharpeRatioColor = (value) => {
  if (value === null || value === undefined) return 'gray';
  if (value >= 2) return 'green';  // Excellent
  if (value >= 1.5) return 'teal';  // Very Good
  if (value >= 1) return 'blue';    // Good
  if (value >= 0.5) return 'yellow'; // Fair
  return 'red';                      // Poor
};

// Timeframes for filtering
const timeframes = [
  { value: 'week', label: 'Last Week', days: 7 },
  { value: 'month', label: 'Last Month', days: 30 },
  { value: 'quarter', label: 'Last Quarter', days: 90 },
  { value: 'year', label: 'Last Year', days: 365 },
  { value: 'all', label: 'All Time', days: null },
];

// Chart types
const chartTypes = [
  { value: 'area', label: 'Area Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: Activity },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
];

// Benchmark options
const benchmarkOptions = [
  { value: 'sp500', label: 'S&P 500', color: colors.success },
  { value: 'nasdaq', label: 'NASDAQ', color: colors.info },
  { value: 'dowjones', label: 'Dow Jones', color: colors.purple },
  { value: 'crypto', label: 'Crypto Index', color: colors.warning },
];

// Enhanced Performance Metric Card Component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  subtitle,
  trend,
  tooltip,
  isLoading = false 
}) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      red: 'text-red-600 bg-red-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50',
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {tooltip && (
                  <div className="group relative">
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="absolute z-10 hidden group-hover:block w-64 p-3 -left-32 -top-2 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-600">
                      {tooltip}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {change >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(change).toFixed(1)}% vs last period
                  </span>
                </div>
              )}
            </div>
          </div>
          {trend && (
            <div className="ml-4">
              <div className="w-16 h-8 bg-gray-50 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">Trend</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100 min-w-[220px]">
      <p className="text-sm font-semibold text-gray-800 mb-3">
        {format(new Date(label), 'MMM d, yyyy')}
      </p>
      
      {payload.map((entry, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
          {entry.payload?.dailyReturn !== undefined && (
            <div className="text-xs text-gray-500 mt-1 ml-5">
              Daily: {entry.payload.dailyReturn > 0 ? '+' : ''}
              {entry.payload.dailyReturn.toFixed(2)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
      
      <div className="h-96 bg-gray-100 rounded-xl"></div>
    </div>
  </div>
);

// Error Component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="p-8">
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Equity Data
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default function Equitys() {
  const { stats, loading, error, refetch, trades } = useAnalyticsData();
  
  // Chart and display state
  const [chartType, setChartType] = useState('area');
  const [timeframe, setTimeframe] = useState('month');
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [expandedView, setExpandedView] = useState(true);
  const [returnsPeriod, setReturnsPeriod] = useState(30); // Default to showing last 30 days
  
  // Symbol and equity data state
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [symbolEquityData, setSymbolEquityData] = useState([]);

  // Initial balance state
  const [initialBalance, setInitialBalance] = useState(() => {
    return localStorage.getItem('initialBalance') || '';
  });
  const [showBalanceInput, setShowBalanceInput] = useState(() => {
    const balance = localStorage.getItem('initialBalance');
    return !balance || balance === '0' || isNaN(parseFloat(balance));
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });

  // Fetch symbols for comparison
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const data = await fetchWithAuth('/api/journal/symbol-analysis');
        const symbolList = data.map(item => item.symbol);
        setSymbols(symbolList);
      } catch (err) {
        console.error('Error fetching symbols:', err);
      }
    };
    
    fetchSymbols();
  }, []);

  // Fetch symbol equity data
  useEffect(() => {
    const fetchSymbolEquity = async () => {
      if (!selectedSymbol) return;
      
      try {
        const trades = await fetchWithAuth(`/api/journal/entries?symbol=${selectedSymbol}`);
        
        if (!trades || !Array.isArray(trades)) {
          setSymbolEquityData([]);
          return;
        }
        
        const sortedTrades = [...trades].sort((a, b) => 
          new Date(a.entry_time || a.date || a.created_at) - 
          new Date(b.entry_time || b.date || b.created_at)
        );
        
        let cumulativePnl = 0;
        const equityData = sortedTrades.map(trade => {
          cumulativePnl += trade.pnl || 0;
          return {
            date: trade.entry_time || trade.date || trade.created_at,
            cumulative_pnl: parseFloat(cumulativePnl.toFixed(2))
          };
        });
        
        setSymbolEquityData(equityData);
      } catch (err) {
        console.error('Error fetching symbol equity:', err);
        setSymbolEquityData([]);
      }
    };
    
    fetchSymbolEquity();
  }, [selectedSymbol]);

  // Handle initial balance change
  const handleBalanceChange = (e) => {
    const value = e.target.value;
    setInitialBalance(value);
    // Clear any previous save status when user types
    if (saveStatus.message) {
      setSaveStatus({ success: false, message: '' });
    }
  };

  // Save initial balance
  const saveInitialBalance = () => {
    const balance = parseFloat(initialBalance);
    if (isNaN(balance) || balance <= 0) {
      setSaveStatus({ 
        success: false, 
        message: 'Please enter a valid positive number' 
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('initialBalance', balance.toString());
      setSaveStatus({ 
        success: true, 
        message: 'Balance saved successfully!' 
      });
      setIsSaving(false);
      
      // Hide the input after successful save
      setTimeout(() => {
        setShowBalanceInput(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus({ success: false, message: '' }), 3000);
      }, 500);
    }, 500);
  };

  // Handle key press (Enter key) in balance input
  const handleBalanceKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveInitialBalance();
    }
  };

  // Calculate metrics from stats and equity curve data
  const metrics = useMemo(() => {
    if (!stats) return {};

    // Use equity metrics if available, otherwise fall back to stats
    const equityMetrics = stats.equity_metrics || {};
    
    // Calculate metrics from equity curve data if available
    let bestDay = 0;
    let bestDayDate = '';
    let worstDay = 0;
    let worstDayDate = '';
    let totalTrades = 0;
    let totalTradeSize = 0;
    let totalLoss = 0;
    let maxDrawdown = 0;
    let peak = 0;
    
    if (stats.equity_curve && stats.equity_curve.length > 1) {
      // Calculate daily returns and find best/worst days
      const dailyReturns = [];
      
      for (let i = 1; i < stats.equity_curve.length; i++) {
        const prevEquity = stats.equity_curve[i-1].cumulative_pnl;
        const currentEquity = stats.equity_curve[i].cumulative_pnl;
        const dailyReturn = currentEquity - prevEquity;
        
        dailyReturns.push(dailyReturn);
        
        // Track best and worst days
        if (dailyReturn > bestDay) {
          bestDay = dailyReturn;
          bestDayDate = stats.equity_curve[i].date;
        }
        if (dailyReturn < worstDay) {
          worstDay = dailyReturn;
          worstDayDate = stats.equity_curve[i].date;
        }
        
        // Track drawdown
        if (currentEquity > peak) peak = currentEquity;
        const drawdown = peak - currentEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        // Track trade metrics
        if (dailyReturn !== 0) {
          totalTrades++;
          totalTradeSize += Math.abs(dailyReturn);
          if (dailyReturn < 0) totalLoss += Math.abs(dailyReturn);
        }
      }
    }
    
    // Calculate derived metrics
    const avgTradeSize = totalTrades > 0 ? totalTradeSize / totalTrades : 0;
    const recoveryFactor = totalLoss > 0 ? (stats.total_pnl || 0) / totalLoss : 0;
    
    // Use the same profit factor calculation as Dashboard for consistency
    // This matches the backend calculation: gross_profit / gross_loss
    const profitFactor = (() => {
      if (!stats) return 0;
      
      // Use the backend-calculated profit factor if available
      if (stats.profit_factor !== undefined) {
        return stats.profit_factor === Infinity ? 100 : stats.profit_factor;
      }
      
      // Fallback calculation if not provided by backend
      if (stats.gross_profit !== undefined && stats.gross_loss !== undefined) {
        return stats.gross_loss > 0 
          ? stats.gross_profit / stats.gross_loss 
          : (stats.gross_profit > 0 ? 100 : 0);
      }
      
      return 0;
    })();
    
    // Calculate average daily return from annual return if not available
    const avgDailyReturn = equityMetrics.total_return !== undefined 
      ? equityMetrics.total_return / 252 // Annual return / 252 trading days
      : stats.avg_daily_return || 0;

    // Calculate volatility using daily returns
    let volatility = 0;
    if (stats.equity_curve?.length > 1) {
      const returns = [];
      let currentEquity = parseFloat(initialBalance) || 0;
      
      // Calculate daily returns
      for (let i = 1; i < stats.equity_curve.length; i++) {
        const prevEquity = i === 1 ? currentEquity : (stats.equity_curve[i-1].cumulative_pnl + currentEquity);
        const currentEquityValue = stats.equity_curve[i].cumulative_pnl + currentEquity;
        const dailyReturn = (currentEquityValue - prevEquity) / prevEquity;
        returns.push(dailyReturn);
      }
      
      // Calculate standard deviation of returns (volatility)
      if (returns.length > 0) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
        volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualize volatility
      }
    }

    // Calculate Sharpe Ratio using the shared utility function
    const { value: sharpeRatio, missingInputs } = calculateSharpeRatio(
      stats.trades || [],
      parseFloat(initialBalance) || 0
    );
    
    // Show balance input if required inputs are missing
    if (missingInputs?.length > 0 && !showBalanceInput) {
      setShowBalanceInput(true);
    }
    
    // Show warning if inputs are missing or invalid
    if ((!initialBalance || parseFloat(initialBalance) <= 0) && !showBalanceInput) {
      setShowBalanceInput(true);
    }

    return {
      // Basic metrics from stats
      totalPnl: stats.total_pnl || 0,
      totalReturn: equityMetrics.total_return || stats.total_return || 0,
      totalTrades: stats.total_trades || 0,
      winningTrades: stats.winning_trades || 0,
      winRate: stats.win_rate || 0,
profitFactor: profitFactor,
      
      // Calculated metrics from equity curve
      bestDay,
      bestDayDate,
      worstDay,
      worstDayDate,
      avgTradeSize,
      recoveryFactor,
      
      // Advanced metrics from equity metrics with fallbacks
      avgDailyReturn,
      volatility: parseFloat(initialBalance) > 0 ? volatility : null,
      maxDrawdown: maxDrawdown || equityMetrics.max_drawdown || stats.max_drawdown || 0,
      maxDrawdownPct: equityMetrics.max_drawdown_pct || 0,
      sharpeRatio: parseFloat(initialBalance) > 0 ? sharpeRatio : null,
      
      // Additional trade metrics from stats (fallbacks)
      avgTradePnl: stats.avg_trade_pnl || 0,
      bestTrade: stats.best_trade || 0,
      worstTrade: stats.worst_trade || 0,
      expectancy: stats.expectancy || 0,
      avgWin: stats.avg_win || 0,
      avgLoss: stats.avg_loss || 0
    };
  }, [stats, initialBalance, trades]);

  // Process equity curve data with improved daily returns calculation
  const processedEquityCurve = useMemo(() => {
    if (!stats?.equity_curve?.length) return [];
    
    // Sort by date to ensure correct calculation
    const sortedCurve = [...stats.equity_curve].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return sortedCurve.map((pt, i, arr) => {
      // Calculate daily return as percentage change from previous day's equity
      let dailyReturn = 0;
      if (i > 0) {
        const prevEquity = arr[i-1].cumulative_pnl;
        const currentEquity = pt.cumulative_pnl;
        
        // Calculate return based on previous day's equity
        // If previous equity was zero, we can't calculate a meaningful percentage
        if (Math.abs(prevEquity) > 0.0001) { // Small threshold to avoid division by near-zero
          dailyReturn = ((currentEquity - prevEquity) / Math.abs(prevEquity)) * 100;
        }
      }
      
      return {
        ...pt,
        date: new Date(pt.date),
        dailyReturn: parseFloat(dailyReturn.toFixed(4)), // Round to 4 decimal places
        absoluteReturn: i > 0 ? (pt.cumulative_pnl - arr[i-1].cumulative_pnl) : 0
      };
    });
  }, [stats?.equity_curve]);

  // Filter data by timeframe
  const filterDataByTimeframe = useCallback((data) => {
    if (!data || !data.length) return [];

    const timeframeConfig = timeframes.find(tf => tf.value === timeframe);
    if (!timeframeConfig || !timeframeConfig.days) return data;

    const cutoffDate = subDays(new Date(), timeframeConfig.days);
    return data.filter(item => isAfter(new Date(item.date), cutoffDate));
  }, [timeframe]);

  const filteredEquityCurve = useMemo(
    () => filterDataByTimeframe(processedEquityCurve),
    [processedEquityCurve, filterDataByTimeframe]
  );

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!filteredEquityCurve || filteredEquityCurve.length === 0) return [];
    
    return filteredEquityCurve.map((point, index) => ({
      ...point,
      date: point.date.toISOString(),
      // Add benchmark data if available
      ...(showBenchmark && stats?.benchmark_data?.sp500 && {
        benchmark: stats.benchmark_data.sp500[index]?.value || 0
      })
    }));
  }, [filteredEquityCurve, showBenchmark, stats]);

  // Chart rendering function
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <BarChart3 className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Try adjusting your time range or check your trading data</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    const chartComponents = {
      xAxis: (
        <XAxis 
          dataKey="date" 
          tick={{ fill: colors.gray[500], fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(date) => format(new Date(date), 'MMM d')}
        />
      ),
      yAxis: (
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fill: colors.gray[500], fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
      ),
      tooltip: (
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: colors.gray[200], strokeWidth: 1 }}
        />
      ),
      referenceLine: <ReferenceLine y={0} stroke={colors.gray[300]} strokeDasharray="2 2" />,
      cartesianGrid: <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gray[100]} />
    };

    switch(chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.success} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.success} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            {chartComponents.cartesianGrid}
            {chartComponents.xAxis}
            {chartComponents.yAxis}
            {chartComponents.tooltip}
            <Area 
              type="monotone" 
              dataKey="cumulative_pnl" 
              name="Your Equity"
              stroke={colors.primary}
              fillOpacity={1} 
              fill="url(#equityGradient)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: 'white', stroke: colors.primary }}
            />
            {showBenchmark && (
              <Area 
                type="monotone" 
                dataKey="benchmark" 
                name="Benchmark"
                stroke={colors.success}
                fillOpacity={1} 
                fill="url(#benchmarkGradient)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: colors.success }}
              />
            )}
            {chartComponents.referenceLine}
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {chartComponents.cartesianGrid}
            {chartComponents.xAxis}
            {chartComponents.yAxis}
            {chartComponents.tooltip}
            <Line 
              type="monotone" 
              dataKey="cumulative_pnl" 
              name="Your Equity"
              stroke={colors.primary}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: 'white', stroke: colors.primary }}
            />
            {showBenchmark && (
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                name="Benchmark"
                stroke={colors.success}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: colors.success }}
              />
            )}
            {chartComponents.referenceLine}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            {chartComponents.cartesianGrid}
            {chartComponents.xAxis}
            {chartComponents.yAxis}
            {chartComponents.tooltip}
            <Bar 
              dataKey="cumulative_pnl" 
              name="Equity"
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
            />
            {chartComponents.referenceLine}
          </BarChart>
        );

      default:
        return renderChart();
    }
  };

  // Automatic data refresh effect
  useEffect(() => {
    // Initial data fetch
    const fetchData = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    // Set up interval to refresh data every 30 seconds
    const refreshInterval = setInterval(fetchData, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [refetch]);

  // Balance input component
  const renderBalanceInput = () => (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            Initial Balance Required
          </h3>
        </div>
        <button 
          onClick={() => setShowBalanceInput(false)}
          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
        For accurate metrics like Sharpe Ratio and Volatility, please enter your initial account balance.
      </p>
      <div className="flex items-start space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Input
              id="initialBalance"
              type="number"
              min="0"
              step="0.01"
              value={initialBalance}
              onChange={handleBalanceChange}
              onKeyPress={handleBalanceKeyPress}
              placeholder="Enter initial account balance"
              className={`bg-white dark:bg-gray-800 pr-10 ${saveStatus.message ? (saveStatus.success ? 'border-green-500' : 'border-red-500') : ''}`}
              disabled={isSaving}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              $
            </div>
          </div>
          {saveStatus.message && (
            <p className={`mt-1 text-sm flex items-center ${saveStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {saveStatus.success ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <X className="w-4 h-4 mr-1" />
              )}
              {saveStatus.message}
            </p>
          )}
        </div>
        <button 
          type="button" 
          onClick={saveInitialBalance}
          disabled={!initialBalance || isNaN(parseFloat(initialBalance)) || isSaving}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save'}
        </button>
      </div>
    </div>
  );

  // Show loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              Portfolio Performance
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of your trading performance and equity curve
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <RefreshCw className="h-3 w-3 mr-1" />
              Auto-updating every 30s
            </div>
          </div>
        </div>

        {/* Balance Input */}
        {showBalanceInput && renderBalanceInput()}
      
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total P&L"
            value={formatCurrency(metrics.totalPnl || 0)}
            change={metrics.totalReturn}
            icon={DollarSign}
            color={metrics.totalPnl >= 0 ? 'green' : 'red'}
            subtitle={`${formatPercent(metrics.totalReturn || 0)} return`}
          />
          
          <MetricCard
            title="Win Rate"
            value={formatPercent(metrics.winRate || 0)}
            icon={Target}
            color="blue"
            subtitle={`${metrics.winningTrades || 0} of ${metrics.totalTrades || 0} trades`}
          />
          
          <MetricCard
            title="Profit Factor"
            value={formatNumber(metrics.profitFactor || 0)}
            icon={Activity}
            color={metrics.profitFactor >= 1 ? 'green' : 'red'}
            subtitle="Gross profit / Gross loss"
          />
          
          <MetricCard
            title="Max Drawdown"
            value={formatCurrency(metrics.maxDrawdown || 0)}
            icon={TrendingDown}
            color="red"
            subtitle="Maximum peak-to-trough decline"
          />
        </div>

        {/* Advanced Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <MetricCard
              title={
                <div className="flex items-center">
                  <span>Sharpe Ratio</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Risk-adjusted return (higher is better). Annualized with 252 trading days.</p>
                        {!initialBalance && (
                          <p className="mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
                            <AlertCircle className="inline w-3 h-3 mr-1" />
                            Initial balance required for accurate calculation
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
              value={metrics.sharpeRatio !== null ? metrics.sharpeRatio.toFixed(2) : 'N/A'}
              color={metrics.sharpeRatio !== null ? getSharpeRatioColor(metrics.sharpeRatio) : 'gray'}
              icon={Activity}
              tooltip={
                <>
                  <p className="font-semibold mb-1">Sharpe Ratio: {metrics.sharpeRatio !== null ? metrics.sharpeRatio.toFixed(2) : 'N/A'}</p>
                  <p className="mb-1">Measures risk-adjusted returns (annualized). Higher is better.</p>
                  {!initialBalance ? (
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                      <AlertCircle className="inline w-4 h-4 mr-1" />
                      Initial balance required for accurate calculation
                    </p>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      <li>≥ 2.0: Excellent</li>
                      <li>1.5-1.99: Very Good</li>
                      <li>1.0-1.49: Good</li>
                      <li>0.5-0.99: Needs Improvement</li>
                      <li>{'<'} 0.5: High Risk</li>
                    </ul>
                  )}
                  <p className="text-xs mt-2 text-gray-500">Based on daily returns, annualized for 252 trading days.</p>
                </>
              }
              subtitle={
                metrics.sharpeRatio !== null ? (
                  metrics.sharpeRatio >= 2 ? "Excellent" :
                  metrics.sharpeRatio >= 1.5 ? "Very Good" :
                  metrics.sharpeRatio >= 1 ? "Good" :
                  metrics.sharpeRatio >= 0.5 ? "Needs Improvement" : "High Risk"
                ) : "Enter initial balance"
              }
            />
            {!initialBalance && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                <button 
                  onClick={() => setShowBalanceInput(true)}
                  className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
                >
                  Add initial balance
                </button>
              </p>
            )}
          </div>
            
          <div>
            <MetricCard
              title={
                <div className="flex items-center">
                  <span>Volatility</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Annualized volatility of returns. Lower is generally better.</p>
                        {!initialBalance && (
                          <p className="mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
                            <AlertCircle className="inline w-3 h-3 mr-1" />
                            Initial balance required for calculation
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
              value={metrics.volatility !== null ? formatPercent(metrics.volatility) : 'N/A'}
              color={metrics.volatility !== null ? "purple" : "gray"}
              icon={Activity}
              subtitle={!initialBalance ? "Enter initial balance" : "Annualized volatility"}
            />
            {!initialBalance && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                <button 
                  onClick={() => setShowBalanceInput(true)}
                  className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
                >
                  Add initial balance
                </button>
              </p>
            )}
          </div>
            
          <MetricCard
            title="Avg Daily Return"
            value={formatPercent(metrics.avgDailyReturn || 0)}
            icon={Calendar}
            color={metrics.avgDailyReturn >= 0 ? 'green' : 'red'}
            subtitle="Average daily performance"
          />
            
            <MetricCard
              title="Total Trades"
              value={formatNumber(metrics.totalTrades || 0)}
              icon={GitCompare}
              color="blue"
              subtitle="Number of completed trades"
            />
          </div>
        

        {/* Equity Curve Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Equity Curve
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Track your portfolio performance over time
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                
                {/* Chart Type Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {chartTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setChartType(type.value)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        chartType === type.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <type.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                
                
                

              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="w-full h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Additional Charts Section (if expanded) */}
        {expandedView && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Returns Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Daily Returns Distribution
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Show last</span>
                    <select 
                      value={returnsPeriod} 
                      onChange={(e) => setReturnsPeriod(Number(e.target.value))}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={180}>6 months</option>
                      <option value={365}>1 year</option>
                      <option value={0}>All time</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={returnsPeriod > 0 
                        ? chartData.slice(-returnsPeriod) 
                        : chartData
                      }
                      barSize={8}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke={colors.gray[100]} 
                      />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: colors.gray[500], fontSize: 10 }}
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        minTickGap={20}
                      />
                      <YAxis 
                        tick={{ fill: colors.gray[500], fontSize: 10 }}
                        tickFormatter={(value) => `${value}%`}
                        width={40}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const absolute = props.payload.absoluteReturn;
                          const percentage = parseFloat(value).toFixed(2);
                          return [
                            `${formatCurrency(absolute)} (${percentage}%)`,
                            'Daily Return'
                          ];
                        }}
                        labelFormatter={(date) => format(new Date(date), 'EEEE, MMM d, yyyy')}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          padding: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="dailyReturn" 
                        fill={colors.info}
                        radius={[2, 2, 0, 0]}
                        name="Return"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.dailyReturn >= 0 ? colors.success : colors.danger}
                          />
                        ))}
                      </Bar>
                      <ReferenceLine y={0} stroke={colors.gray[400]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Earliest: {chartData[0] ? format(new Date(chartData[0].date), 'MMM d, yyyy') : 'N/A'}</span>
                  <span>Latest: {chartData.length > 0 ? format(new Date(chartData[chartData.length - 1].date), 'MMM d, yyyy') : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Best Day</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(metrics.bestDay || metrics.bestTrade || 0)}
                      </span>
                    </div>
                    {metrics.bestDayDate && (
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {format(new Date(metrics.bestDayDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Worst Day</span>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(metrics.worstDay || metrics.worstTrade || 0)}
                      </span>
                    </div>
                    {metrics.worstDayDate && (
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {format(new Date(metrics.worstDayDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Avg Trade Size</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(metrics.avgTradeSize || metrics.avgTradePnl || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Recovery Factor</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatNumber(metrics.recoveryFactor || 0)}
                      {metrics.recoveryFactor > 1 ? ' (Good)' : metrics.recoveryFactor > 0 ? ' (Needs Improvement)' : ' (High Risk)'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

