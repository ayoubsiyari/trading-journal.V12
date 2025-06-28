// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Award, AlertCircle, Info, Check, X } from 'lucide-react';
import AISummary from '../components/AISummary';
import CalendarDaysView from '../components/calendar/CalendarDaysView';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { calculateSharpeRatio, validateMetricsInputs } from '../utils/metrics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
} from 'recharts';
import CalendarDay from '../components/calendar/CalendarDay';
import DayTradeModal from '../components/calendar/DayTradeModal';

const colorClasses = {
  profit: 'text-green-600 dark:text-green-400',
  loss: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-500 dark:text-gray-400',
};

// Utility formatters
const formatCurrency = (val) => {
  if (val == null) return 'N/A';
  
  const num = parseFloat(val);
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(2)}`;
};
const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;
const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [error, setError] = useState('');
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [language, setLanguage] = useState('en');
  const [timePeriod, setTimePeriod] = useState('daily'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [showCumulative, setShowCumulative] = useState(true);
  const [equityCurveData, setEquityCurveData] = useState([]);
  
  // Initial balance state
  const [initialBalance, setInitialBalance] = useState('');
  const [showBalanceInput, setShowBalanceInput] = useState(true);
  
  // Load initial balance from localStorage on component mount
  useEffect(() => {
    console.log('Component mounted, checking localStorage for balance');
    try {
      const savedBalance = localStorage.getItem('initialBalance');
      console.log('Found saved balance in localStorage:', savedBalance);
      
      if (savedBalance) {
        const balance = parseFloat(savedBalance).toFixed(2);
        console.log('Setting initial balance from localStorage:', balance);
        setInitialBalance(balance);
        setShowBalanceInput(false);
      } else {
        console.log('No saved balance found, showing input');
        setShowBalanceInput(true);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      setShowBalanceInput(true);
    }
  }, []);
  
  const pnlData = useMemo(() => {
    if (!stats?.pnl_by_date) return [];
    return Array.isArray(stats.pnl_by_date) && stats.pnl_by_date.length > 0
      ? stats.pnl_by_date.map(([dateStr, pnlValue]) => ({
          date: new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          pnl: pnlValue,
        }))
      : [];
  }, [stats?.pnl_by_date]);

  // Handle initial balance save
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: null, message: '' });

  const handleSaveBalance = () => {
    console.log('Save button clicked');
    console.log('Current initialBalance:', initialBalance);
    
    const balance = parseFloat(initialBalance);
    console.log('Parsed balance:', balance);
    
    if (!isNaN(balance) && balance > 0) {
      setIsSaving(true);
      setSaveStatus({ success: null, message: 'Saving...' });
      
      // Simulate API call with timeout for better UX
      setTimeout(() => {
        try {
          const formattedBalance = balance.toFixed(2);
          console.log('Saving balance to localStorage:', formattedBalance);
          
          localStorage.setItem('initialBalance', formattedBalance);
          console.log('Successfully saved to localStorage');
          
          setInitialBalance(formattedBalance);
          setShowBalanceInput(false);
          setSaveStatus({ 
            success: true, 
            message: 'Balance saved successfully!' 
          });
          
          console.log('State updated, showBalanceInput set to false');
          
          // Force a re-render of metrics
          if (stats) {
            console.log('Stats exists, forcing re-render');
            setStats({...stats});
          } else {
            console.log('Stats is null, cannot force re-render');
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSaveStatus({ success: null, message: '' });
          }, 3000);
          
        } catch (error) {
          console.error('Error saving balance:', error);
          setSaveStatus({ 
            success: false, 
            message: 'Failed to save balance. Please try again.' 
          });
        } finally {
          setIsSaving(false);
        }
      }, 500); // Simulate network delay
    } else {
      console.error('Invalid balance value:', initialBalance, 'Parsed as:', balance);
      setSaveStatus({ 
        success: false, 
        message: 'Please enter a valid balance greater than 0' 
      });
    }
  };

  // Handle initial balance change
  const handleBalanceChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid number
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInitialBalance(value);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveBalance();
    }
  };

  // Render balance input component - Compact version for header
  const renderBalanceInput = () => (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
        <Label htmlFor="initialBalance" className="text-xs font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap">
          Initial Balance:
        </Label>
      </div>
      <div className="relative flex items-center space-x-2">
        <Input
          id="initialBalance"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="1000.00"
          value={initialBalance}
          onChange={handleBalanceChange}
          onKeyDown={handleKeyDown}
          className="w-28 h-8 text-sm border-blue-300 dark:border-blue-700 bg-white/50 dark:bg-slate-800/50 focus-visible:ring-blue-500"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">$</span>
        <div className="relative">
          <Button 
            type="button"
            size="sm"
            onClick={handleSaveBalance}
            disabled={isSaving || !initialBalance || isNaN(parseFloat(initialBalance)) || parseFloat(initialBalance) <= 0}
            className={`h-8 px-2 text-xs text-white transition-all duration-200 ${
              isSaving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : saveStatus.success === true 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : saveStatus.success === false 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : saveStatus.success === true ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Saved!
              </>
            ) : saveStatus.success === false ? (
              <>
                <X className="h-3 w-3 mr-1" />
                Error
              </>
            ) : (
              'Save'
            )}
          </Button>
          {saveStatus.message && (
            <div className={`absolute left-0 right-0 mt-1 text-xs text-center ${
              saveStatus.success === true ? 'text-green-600' : 
              saveStatus.success === false ? 'text-red-600' : 'text-blue-600'
            }`}>
              {saveStatus.message}
            </div>
          )}
        </div>
        {initialBalance && (
          <Button 
            type="button"
            variant="ghost" 
            size="icon"
            onClick={() => setShowBalanceInput(false)}
            className="h-6 w-6 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );

  // Process equity curve data for different time periods
  const processEquityCurveData = useMemo(() => {
    if (!stats?.equity_curve || !Array.isArray(stats.equity_curve) || stats.equity_curve.length === 0) return [];
    
    // Process daily data
    const dailyData = stats.equity_curve.map((pt, index, array) => {
      const prevPnl = index > 0 ? array[index - 1].cumulative_pnl : 0;
      const dailyPnl = index > 0 ? pt.cumulative_pnl - prevPnl : pt.cumulative_pnl;
      
      return {
        date: pt.date,
        cumulative_pnl: pt.cumulative_pnl,
        period_pnl: dailyPnl,
        period_return: (dailyPnl / (prevPnl || 1)) * 100,
        type: 'daily'
      };
    });

    // Process weekly data
    const weeklyData = [];
    const weeklyMap = new Map();
    
    dailyData.forEach(item => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const weekNum = getWeekNumber(date);
      const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: getFirstDayOfWeek(date),
          cumulative_pnl: 0,
          period_pnl: 0,
          week: weekNum,
          year: year,
          type: 'weekly'
        });
      }
      
      const weekData = weeklyMap.get(weekKey);
      weekData.period_pnl += item.period_pnl;
      weekData.cumulative_pnl = item.cumulative_pnl; // Use the last day's cumulative pnl for the week
    });
    
    // Process monthly data
    const monthlyData = [];
    const monthlyMap = new Map();
    
    dailyData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          date: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
          cumulative_pnl: 0,
          period_pnl: 0,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          type: 'monthly'
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      monthData.period_pnl += item.period_pnl;
      monthData.cumulative_pnl = item.cumulative_pnl; // Use the last day's cumulative pnl for the month
    });
    
    // Process yearly data
    const yearlyData = [];
    const yearlyMap = new Map();
    
    dailyData.forEach(item => {
      const date = new Date(item.date);
      const yearKey = date.getFullYear().toString();
      
      if (!yearlyMap.has(yearKey)) {
        yearlyMap.set(yearKey, {
          date: new Date(date.getFullYear(), 0, 1).toISOString(),
          cumulative_pnl: 0,
          period_pnl: 0,
          year: date.getFullYear(),
          type: 'yearly'
        });
      }
      
      const yearData = yearlyMap.get(yearKey);
      yearData.period_pnl += item.period_pnl;
      yearData.cumulative_pnl = item.cumulative_pnl; // Use the last day's cumulative pnl for the year
    });
    
    return {
      daily: dailyData,
      weekly: Array.from(weeklyMap.values()),
      monthly: Array.from(monthlyMap.values()),
      yearly: Array.from(yearlyMap.values())
    };
  }, [stats?.equity_curve]);
  
  // Helper function to get week number
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }
  
  // Helper function to get first day of week
  function getFirstDayOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff)).toISOString();
  }
  
  // Get data for the selected time period
  const chartData = useMemo(() => {
    if (!processEquityCurveData) return [];
    return processEquityCurveData[timePeriod] || [];
  }, [processEquityCurveData, timePeriod]);
  
  // Update equityCurveData when chartData changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setEquityCurveData(chartData);
    }
  }, [chartData]);
  
  // Calculate metrics that require initial balance
  const calculatedMetrics = useMemo(() => {
    if (!stats) return { sharpeRatio: null };
    
    // Use the processed daily data for Sharpe ratio calculation
    const dailyData = processEquityCurveData?.daily || [];
    
    // Transform data to match expected format for calculateSharpeRatio
    const tradesForSharpe = dailyData.map(day => ({
      pnl: day.period_pnl,
      date: day.date
    }));
    
    console.log('Trades for Sharpe calculation:', {
      initialBalance: parseFloat(initialBalance),
      tradesCount: tradesForSharpe.length,
      firstTrade: tradesForSharpe[0],
      lastTrade: tradesForSharpe[tradesForSharpe.length - 1]
    });
    
    // Calculate Sharpe Ratio using our utility
    const { value: sharpeRatio, error, missingInputs } = calculateSharpeRatio(
      tradesForSharpe,
      parseFloat(initialBalance)
    );
    
    // Log debug information
    console.log('Sharpe Ratio Calculation:', {
      hasInitialBalance: !!initialBalance,
      initialBalanceValue: parseFloat(initialBalance),
      dailyDataLength: dailyData.length,
      sharpeRatio,
      error,
      missingInputs
    });
    
    // Ensure input is shown if initial balance is missing
    if ((!initialBalance || isNaN(parseFloat(initialBalance))) && !showBalanceInput) {
      setShowBalanceInput(true);
    } else if (initialBalance && parseFloat(initialBalance) > 0 && missingInputs?.length > 0) {
      console.warn('Missing inputs for Sharpe ratio calculation:', missingInputs);
    }
    
    return { 
      sharpeRatio: sharpeRatio !== null ? sharpeRatio : 0,
      error: error || (missingInputs?.length > 0 ? missingInputs.join(', ') : null)
    };
  }, [stats, initialBalance, showBalanceInput, processEquityCurveData]);

  // Calculate performance rating based on win rate and profit factor
  const performanceRating = useMemo(() => {
    if (!stats) return 'beginner';
    
    const pnl = parseFloat(stats.total_pnl || 0);
    const winRate = parseFloat(stats.win_rate || 0);
    
    if (pnl > 10000 && winRate > 70) return 'elite';
    if (pnl > 5000 && winRate > 60) return 'expert';
    if (pnl > 1000 && winRate > 50) return 'advanced';
    if (pnl > 0 && winRate > 40) return 'intermediate';
    return 'beginner';
  }, [stats]);

  // Get rating configuration
  const ratingConfig = useMemo(() => {
    const configs = {
      elite: {
        bgColor: 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-600 dark:text-purple-400',
      },
      expert: {
        bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-600 dark:text-blue-400',
      },
      advanced: {
        bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-600 dark:text-green-400',
      },
      intermediate: {
        bgColor: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-600 dark:text-yellow-400',
      },
      beginner: {
        bgColor: 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20',
        borderColor: 'border-slate-200 dark:border-slate-800',
        textColor: 'text-slate-600 dark:text-slate-400',
      },
    };
    
    return configs[performanceRating] || configs.beginner;
  }, [performanceRating]);

  useEffect(() => {
    // Add dark mode class to body element
    const body = document.querySelector('body');
    if (body && body.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }

    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  const fetchAiSummary = async () => {
    setLoadingAiSummary(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/journal/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats, language }),
      });
      if (!res.ok) throw new Error('Failed to fetch AI summary');
      const data = await res.json();
      setAiSummary(data.summary);
      setShowAiSummary(true);
    } catch (err) {
      console.error('Error fetching AI summary:', err);
      setAiSummary('Failed to generate AI summary. Please try again.');
      setShowAiSummary(true);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-2 border-indigo-300 dark:border-indigo-600 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Loading Analytics</h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Preparing your trading dashboard...</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-75"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce animation-delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/30 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Connection Error</h2>
          <p className="text-lg text-red-600 dark:text-red-400 font-medium mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no stats or no trades, show placeholder
  if (!stats || stats.total_trades === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="w-32 h-32 mx-auto mb-12 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 rounded-3xl flex items-center justify-center shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Welcome to Trading Analytics</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">Start by adding your first trade to unlock comprehensive performance insights and advanced analytics.</p>
          <div className="flex items-center justify-center space-x-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg"></div>
              <span className="font-medium">Performance Tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
              <span className="font-medium">AI Insights</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg"></div>
              <span className="font-medium">Risk Analysis</span>
            </div>
          </div>
        </div>
      </div>
    );
  }



  const winLossData = [
    { name: 'Wins', value: stats.win_loss?.wins || 0, color: '#059669' },
    { name: 'Losses', value: stats.win_loss?.losses || 0, color: '#dc2626' },
  ];

  const directionData = [
    { name: 'Long Trades', pnl: stats.buy_pnl || 0, trades: Math.floor(stats.total_trades * 0.6) },
    { name: 'Short Trades', pnl: stats.sell_pnl || 0, trades: Math.floor(stats.total_trades * 0.4) },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* PROFESSIONAL HEADER */}
      <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-full mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Enhanced Brand Section */}
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent">
                  Trading Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Professional Performance Dashboard</p>
              </div>
            </div>
            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Status and Balance Input Container */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-6 px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200/50 dark:border-slate-600/50 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Data</span>
                  </div>
                </div>
                
                {/* Initial Balance Input */}
                {console.log('Rendering check - initialBalance:', initialBalance, 'showBalanceInput:', showBalanceInput, 'shouldShow:', (!initialBalance || showBalanceInput))}
                <div className="inline-flex items-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm">
                  
                  {renderBalanceInput()}
                </div>
              </div>
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
              {/* Language Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-600/50">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    language === 'en'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md transform scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    language === 'ar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md transform scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  AR
                </button>
              </div>
              {/* AI Insights Button */}
              <button
                onClick={fetchAiSummary}
                disabled={loadingAiSummary}
                className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {loadingAiSummary ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Insights
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAiSummary && (
        <AISummary summary={aiSummary} language={language} onClose={() => setShowAiSummary(false)} />
      )}



      {/* MAIN DASHBOARD CONTENT */}
      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CALENDAR DAYS VIEW */}
          <div className="h-full">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 h-full">
              <CalendarDaysView stats={stats} equityCurveData={equityCurveData} />

            </div>
          </div>

          {/* RIGHT COLUMN - ALL METRICS */}
          <div className="space-y-6">
              {/* Performance Rating Banner */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <div className={`${ratingConfig.bgColor} ${ratingConfig.borderColor} border rounded-2xl p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className={`p-3 rounded-full ${ratingConfig.bgColor} mr-4`}>
                  <Award className={`h-6 w-6 ${ratingConfig.textColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    Performance Rating: {performanceRating.charAt(0).toUpperCase() + performanceRating.slice(1)}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Based on profitability (${formatNumber(stats?.total_pnl || 0)}) and win rate ({formatPercent(stats?.win_rate || 0)})
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${ratingConfig.bgColor} ${ratingConfig.textColor} font-medium text-sm border ${ratingConfig.borderColor}`}>
                {performanceRating.charAt(0).toUpperCase() + performanceRating.slice(1)}
              </div>
            </div>
          </div>
        </div>
            {/* PORTFOLIO VALUE CARD */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Portfolio Growth</h2>
                  </div>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-sm">
                    
                  </div>
                </div>
                  <p className={`text-6xl font-black mb-6 ${stats.total_pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(stats.total_pnl)}
                  </p>
                  <div className="flex items-center space-x-6 text-sm">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                      stats.total_pnl >= 0 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400' 
                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400'
                    }`}>
                      {stats.total_pnl >= 0 ? '↗ Profitable Portfolio' : '↘ Loss Position'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                      {stats.total_trades} trades executed
                    </span>
                  </div>
                </div>
                
                <div className="lg:w-[28rem] h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={equityCurveData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0.3} />
                          <stop offset="50%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0.1} />
                          <stop offset="100%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          if (timePeriod === 'weekly') {
                            return `W${getWeekNumber(date)}`;
                          } else if (timePeriod === 'monthly') {
                            return date.toLocaleDateString('en-US', { month: 'short' });
                          } else if (timePeriod === 'yearly') {
                            return date.getFullYear();
                          }
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${Math.abs(value).toLocaleString()}`}
                        domain={!showCumulative ? [(dataMin) => Math.min(0, dataMin), 'dataMax + 1'] : ['auto', 'auto']}
                        width={50}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                        formatter={(value, name, props) => {
                          const periodType = props.payload?.type || 'daily';
                          const periodLabel = periodType === 'daily' ? 'Daily' : 
                                            periodType === 'weekly' ? 'Weekly' :
                                            periodType === 'monthly' ? 'Monthly' : 'Yearly';
                                            
                          return [
                            `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                            showCumulative ? 'Portfolio Value' : `${periodLabel} P&L`
                          ];
                        }}
                        labelFormatter={(label, props) => {
                          const date = new Date(label);
                          const periodType = props?.[0]?.payload?.type || 'daily';
                          
                          if (periodType === 'weekly') {
                            const endDate = new Date(date);
                            endDate.setDate(endDate.getDate() + 6);
                            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                          } else if (periodType === 'monthly') {
                            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                          } else if (periodType === 'yearly') {
                            return date.getFullYear().toString();
                          }
                          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={showCumulative ? 'cumulative_pnl' : 'period_pnl'}
                        stroke={stats.total_pnl >= 0 ? '#059669' : '#dc2626'}
                        fill="url(#heroGradient)"
                        strokeWidth={2}
                        dot={timePeriod === 'daily' && !showCumulative}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* QUICK STATS ROW */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Win Rate</h4>
                    <div className="w-8 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: stats.win_rate || 0, fill: '#6366f1' },
                              { value: 100 - (stats.win_rate || 0), fill: '#e2e8f0' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={8}
                            outerRadius={16}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatPercent(stats.win_rate)}</p>
                </div>
                
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Total Trades</h4>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {stats.total_trades || 0}
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Profit Factor</h4>
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    {stats.profit_factor === Infinity ? '∞' : stats.profit_factor?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                
                {/* Sharpe Ratio */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mr-2">
                        Sharpe Ratio
                      </h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
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
                  </div>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {calculatedMetrics.sharpeRatio !== null ? calculatedMetrics.sharpeRatio.toFixed(2) : 'N/A'}
                  </p>
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
              </div>
              
              {/* TRADE HIGHLIGHTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Best Trade */}
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                      <span className="text-lg mr-2">🏆</span>
                      Best Trade
                    </h4>
                    <span className="text-xs bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-800 dark:to-green-800 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-lg font-bold shadow-sm">
                      R:R {stats.best_trade?.rr != null ? stats.best_trade.rr : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                    {stats.best_trade?.pnl != null ? formatCurrency(stats.best_trade.pnl) : 'N/A'}
                  </p>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-bold">{stats.best_trade?.symbol || 'N/A'}</p>
                    <p className="text-2xs opacity-80">{stats.best_trade?.date || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Worst Trade */}
                <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center">
                      <span className="text-lg mr-2">📉</span>
                      Worst Trade
                    </h4>
                    <span className="text-xs bg-gradient-to-r from-red-200 to-rose-200 dark:from-red-800 dark:to-rose-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-lg font-bold shadow-sm">
                      R:R {stats.worst_trade?.rr != null ? stats.worst_trade.rr : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xl font-black text-red-600 dark:text-red-400 mb-2">
                    {stats.worst_trade?.pnl != null ? formatCurrency(stats.worst_trade.pnl) : 'N/A'}
                  </p>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-bold">{stats.worst_trade?.symbol || 'N/A'}</p>
                    <p className="text-2xs opacity-80">{stats.worst_trade?.date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SUMMARY STATISTICS CARD */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Summary Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Total Trades</h4>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {stats.total_trades || 0}
                </p>
              </div>
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Sharpe Ratio</h4>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {stats.sharpe_ratio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Avg. Win</h4>
                <p className={`text-2xl font-black ${stats.avg_win == null ? 'text-slate-400' : stats.avg_win >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.avg_win != null ? formatCurrency(stats.avg_win) : 'N/A'}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Avg. Loss</h4>
                <p className={`text-2xl font-black ${stats.avg_loss == null ? 'text-slate-400' : stats.avg_loss < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.avg_loss == null ? 'N/A' : formatCurrency(stats.avg_loss)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Expectancy</h4>
                <p className={`text-2xl font-black ${stats.expectancy == null ? 'text-slate-400' : stats.expectancy >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.expectancy == null ? 'N/A' : formatCurrency(stats.expectancy)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">Max Drawdown</h4>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">
                  {stats.max_drawdown == null ? 'N/A' : formatCurrency(stats.max_drawdown)}
                </p>
              </div>
              
              </div>
              
            </div>
          
          </div>
        </div>

        

        {/* TRADES TABLE SECTION - Keep this at the bottom */}
        <div className="mt-8">
          
          
        </div>
        
        {/* ENHANCED CHARTS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          {/* Portfolio Equity Curve */}
          <div className="xl:col-span-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio Growth</h3>
              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                        <button 
                          onClick={() => setShowCumulative(true)}
                          className={`px-3 py-1 rounded-md transition-colors ${showCumulative ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Cumulative
                        </button>
                        <button 
                          onClick={() => setShowCumulative(false)}
                          className={`px-3 py-1 rounded-md transition-colors ${!showCumulative ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          {timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : timePeriod === 'monthly' ? 'Monthly' : 'Yearly'}
                        </button>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                        <button 
                          onClick={() => setTimePeriod('daily')}
                          className={`px-3 py-1 rounded-md transition-colors ${timePeriod === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          D
                        </button>
                        <button 
                          onClick={() => setTimePeriod('weekly')}
                          className={`px-3 py-1 rounded-md transition-colors ${timePeriod === 'weekly' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          W
                        </button>
                        <button 
                          onClick={() => setTimePeriod('monthly')}
                          className={`px-3 py-1 rounded-md transition-colors ${timePeriod === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          M
                        </button>
                        <button 
                          onClick={() => setTimePeriod('yearly')}
                          className={`px-3 py-1 rounded-md transition-colors ${timePeriod === 'yearly' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Y
                        </button>
                      </div>
                    </div>
            </div>
            <ResponsiveContainer width="100%" height={380}>
             <AreaChart
                      data={equityCurveData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0.3} />
                          <stop offset="50%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0.1} />
                          <stop offset="100%" stopColor={stats.total_pnl >= 0 ? '#059669' : '#dc2626'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          if (timePeriod === 'weekly') {
                            return `W${getWeekNumber(date)}`;
                          } else if (timePeriod === 'monthly') {
                            return date.toLocaleDateString('en-US', { month: 'short' });
                          } else if (timePeriod === 'yearly') {
                            return date.getFullYear();
                          }
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${Math.abs(value).toLocaleString()}`}
                        domain={!showCumulative ? [(dataMin) => Math.min(0, dataMin), 'dataMax + 1'] : ['auto', 'auto']}
                        width={50}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                        labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                        formatter={(value, name, props) => {
                          const periodType = props.payload?.type || 'daily';
                          const periodLabel = periodType === 'daily' ? 'Daily' : 
                                            periodType === 'weekly' ? 'Weekly' :
                                            periodType === 'monthly' ? 'Monthly' : 'Yearly';
                                            
                          return [
                            `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                            showCumulative ? 'Portfolio Value' : `${periodLabel} P&L`
                          ];
                        }}
                        labelFormatter={(label, props) => {
                          const date = new Date(label);
                          const periodType = props?.[0]?.payload?.type || 'daily';
                          
                          if (periodType === 'weekly') {
                            const endDate = new Date(date);
                            endDate.setDate(endDate.getDate() + 6);
                            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                          } else if (periodType === 'monthly') {
                            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                          } else if (periodType === 'yearly') {
                            return date.getFullYear().toString();
                          }
                          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={showCumulative ? 'cumulative_pnl' : 'period_pnl'}
                        stroke={stats.total_pnl >= 0 ? '#059669' : '#dc2626'}
                        fill="url(#heroGradient)"
                        strokeWidth={2}
                        dot={timePeriod === 'daily' && !showCumulative}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  
                
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Win/Loss Breakdown */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Trade Outcomes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                  fontSize={12}
                  fontWeight="600"
                >
                  {winLossData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-600 rounded-full shadow-lg"></div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Winning Trades</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                  {stats.win_loss?.wins || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-600 rounded-full shadow-lg"></div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Losing Trades</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                  {stats.win_loss?.losses || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ENHANCED PERFORMANCE METRICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Daily P&L Chart */}
          
          
          
          
        </div>
        
        {/* ENHANCED TRADE ACTIVITY */}
        <div className="grid grid-cols-1 gap-8">
          {/* Recent Trades Table */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Symbol</th>
                    <th className="text-left py-4 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left py-4 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-right py-4 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">P&L</th>
                    <th className="text-right py-4 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recent_trades?.slice(0, 8).map((trade, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                      <td className="py-4 px-3 font-bold text-slate-900 dark:text-slate-100">{trade.symbol || 'N/A'}</td>
                      <td className="py-4 px-3">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          trade.direction === 'buy' 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400' 
                            : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400'
                        }`}>
                          {trade.direction === 'buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">{trade.date || 'N/A'}</td>
                      <td className="py-4 px-3 text-right">
                        <span className={`font-bold text-lg ${trade.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {trade.rr != null ? trade.rr : 'N/A'}
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

