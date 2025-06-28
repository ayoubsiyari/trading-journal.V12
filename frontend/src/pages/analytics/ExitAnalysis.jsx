import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

const ExitAnalysis = () => {
  const navigate = useNavigate();
  const [tradesData, setTradesData] = useState([]);
  const [stats, setStats] = useState({
    winRate: 0,
    profitFactor: 0,
    avgWinPercentage: 0,
    avgLossPercentage: 0,
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    totalProfit: 0,
    totalLoss: 0,
    backendStats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch backend stats
  const fetchBackendStats = async () => {
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/journal/stats');
      return response;
    } catch (error) {
      console.error('Error fetching backend stats:', error);
      return null;
    }
  };

  // Enhanced fetch function with retry logic
  const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status >= 500 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  // Fetch data from API with better error handling and loading states
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Fetching trades list...');
      
      try {
        // Fetch trades with retry logic
        const response = await fetchWithRetry('http://localhost:5000/api/journal/list');
        
        // Check if response is an array or has a 'data' property
        const trades = Array.isArray(response) ? response : [];
        
        if (!Array.isArray(trades)) {
          throw new Error('Invalid response format: expected array of trades');
        }
        
        console.log(`Fetched ${trades.length} trades`);
        
        if (trades.length === 0) {
          setTradesData([]);
          setStats(prev => ({ ...prev, totalTrades: 0, winRate: 0 }));
          return;
        }
        
        // Transform the trades to match the expected format
        const validTrades = trades
          .filter(trade => 
            trade.id && 
            (trade.entry_price || trade.entryPrice) && 
            (trade.exit_price || trade.exitPrice) && 
            trade.symbol
          )
          .map(trade => ({
            id: trade.id,
            symbol: trade.symbol,
            direction: trade.direction || 'LONG',
            entry_price: trade.entry_price || trade.entryPrice,
            exit_price: trade.exit_price || trade.exitPrice,
            stop_loss: trade.stop_loss || trade.stopLoss,
            take_profit: trade.take_profit || trade.takeProfit,
            entry_date: trade.entry_date || trade.entryDate || trade.date,
            exit_date: trade.exit_date || trade.exitDate,
            pnl: trade.pnl || 0,
            notes: trade.notes,
            exit_reason: trade.exit_reason || trade.exitReason
          }));
        
        console.log(`Processing ${validTrades.length} valid trades for visualization`);
        
        if (validTrades.length === 0) {
          console.warn('No valid trades found after filtering');
          setTradesData([]);
          setStats(prev => ({ ...prev, totalTrades: 0, winRate: 0 }));
          return;
        }
        
        // Process the data for visualization and statistics
        const processedData = processTradesForExitAnalysis(validTrades);
        const exitStats = calculateExitAnalysisStats(validTrades);
        
        // Fetch backend stats for consistent metrics
        const backendStats = await fetchBackendStats();
        
        // Update state
        setTradesData(processedData);
        setStats(prev => ({
          ...prev,
          ...exitStats,
          totalTrades: validTrades.length,
          winRate: exitStats.winRate || 0,
          profitFactor: backendStats?.profit_factor || 0,
          backendStats
        }));
        setLastUpdated(new Date());
        
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to load trade data');
      }
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please log in again.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Manual refresh function
  const handleRefresh = () => {
    setError(null);
    fetchData();
  };

  // Process trades data to calculate updraw and drawdown for each trade
  const processTradesForExitAnalysis = (trades) => {
    console.log('Processing trades for exit analysis. Total trades:', trades.length);
    
    // Log all unique directions for debugging
    const directions = [...new Set(trades.map(t => t.direction))];
    console.log('Unique trade directions in data:', directions);
    
    const processed = trades.map((trade, index) => {
      try {
        console.log(`Processing trade ${index + 1}/${trades.length}:`, trade.id, trade.symbol);
        
        const entryPrice = parseFloat(trade.entry_price || trade.entryPrice);
        const exitPrice = parseFloat(trade.exit_price || trade.exitPrice);
        const stopLoss = trade.stop_loss || trade.stopLoss ? parseFloat(trade.stop_loss || trade.stopLoss) : null;
        const takeProfit = trade.take_profit || trade.takeProfit ? parseFloat(trade.take_profit || trade.takeProfit) : null;
        
        // Get direction using the same normalization as in the tooltip
        const direction = (trade.direction || 'LONG').toString().toUpperCase().trim();
        const isLong = ['LONG', 'BUY', 'B'].includes(direction);
        
        console.log(`Trade ${trade.id}: direction=${direction}, isLong=${isLong}`);

        console.log(`Trade ${trade.id}: entry=${entryPrice}, exit=${exitPrice}, SL=${stopLoss}, TP=${takeProfit}, isLong=${isLong}`);

        // Calculate the actual P&L percentage based on entry and exit
        const pnlPercent = isLong 
          ? ((exitPrice - entryPrice) / entryPrice) * 100
          : ((entryPrice - exitPrice) / entryPrice) * 100;

        // Calculate max favorable and adverse movements based on TP/SL
        let maxFavorable = 0;
        let maxAdverse = 0;
        let hitTP = false;
        let hitSL = false;
        
        // For LONG trades
        if (isLong) {
          // Check if TP was hit
          hitTP = takeProfit && exitPrice >= takeProfit;
          // Check if SL was hit
          hitSL = stopLoss && exitPrice <= stopLoss;
          
          // Max favorable is TP if it was set and hit, otherwise use exit price
          maxFavorable = hitTP 
            ? ((takeProfit - entryPrice) / entryPrice) * 100
            : ((exitPrice - entryPrice) / entryPrice) * 100;
            
          // Max adverse is SL if it was set and hit, otherwise use exit price
          maxAdverse = hitSL 
            ? ((entryPrice - stopLoss) / entryPrice) * 100
            : Math.max(0, ((entryPrice - exitPrice) / entryPrice) * 100);
        } 
        // For SHORT trades
        else {
          // Check if TP was hit
          hitTP = takeProfit && exitPrice <= takeProfit;
          // Check if SL was hit
          hitSL = stopLoss && exitPrice >= stopLoss;
          
          // Max favorable is TP if it was set and hit, otherwise use exit price
          maxFavorable = hitTP 
            ? ((entryPrice - takeProfit) / entryPrice) * 100
            : ((entryPrice - exitPrice) / entryPrice) * 100;
            
          // Max adverse is SL if it was set and hit, otherwise use exit price
          maxAdverse = hitSL 
            ? ((stopLoss - entryPrice) / entryPrice) * 100
            : Math.max(0, ((exitPrice - entryPrice) / entryPrice) * 100);
        }
        
        // Calculate exit updraw and drawdown based on exit price
        const exitUpdraw = Math.max(0, pnlPercent);
        const exitDrawdown = Math.max(0, -pnlPercent);
        
        // Log the calculated values for debugging
        console.log(`Trade ${trade.id} calculations:`, {
          maxFavorable,
          maxAdverse,
          exitUpdraw,
          exitDrawdown,
          pnlPercent,
          hitTP,
          hitSL,
          isLong
        });

        const result = {
          id: trade.id,
          symbol: trade.symbol,
          entryPrice,
          exitPrice,
          stopLoss,
          takeProfit,
          updraw: Math.max(0, maxFavorable),
          drawdown: -Math.max(0, maxAdverse), // Make negative for chart display
          pnlPercent,
          pnl: trade.pnl || 0,
          isWinner: pnlPercent > 0,
          hitTP: takeProfit !== null && 
            ((isLong && exitPrice >= takeProfit) || (!isLong && exitPrice <= takeProfit)),
          hitSL: stopLoss !== null && 
            ((isLong && exitPrice <= stopLoss) || (!isLong && exitPrice >= stopLoss))
        };
        
        console.log(`Processed trade ${trade.id}:`, result);
        return result;
        
      } catch (error) {
        console.error(`Error processing trade ${trade.id}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
    
    console.log(`Successfully processed ${processed.length} trades`);
    return processed;
  };

  // Calculate exit reasons (kept for potential future use)
  const calculateExitReasons = () => {
    return tradesData.reduce((acc, trade) => {
      const reason = trade.exit_reason || 'UNKNOWN';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
  };

  // Removed unused effect for exit reasons

  // Calculate exit analysis statistics
  const calculateExitAnalysisStats = (trades) => {
    if (!trades || trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        avgWinPercentage: 0,
        avgLossPercentage: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        totalProfit: 0,
        totalLoss: 0
      };
    }

    const validTrades = trades.filter(trade => {
      if (!trade) return false;
      
      // Handle both processed and unprocessed trade formats
      const entryPrice = trade.entryPrice || trade.entry_price;
      const exitPrice = trade.exitPrice || trade.exit_price;
      const positionSize = trade.positionSize || trade.position_size || 1;
      
      if (entryPrice === undefined || exitPrice === undefined) return false;
      
      const entryPriceNum = parseFloat(entryPrice);
      const exitPriceNum = parseFloat(exitPrice);
      const positionSizeNum = parseFloat(positionSize) || 1;
      
      return !isNaN(entryPriceNum) && !isNaN(exitPriceNum) && !isNaN(positionSizeNum) && positionSizeNum > 0;
    });

    if (validTrades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        avgWinPercentage: 0,
        avgLossPercentage: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        totalProfit: 0,
        totalLoss: 0
      };
    }

    const winningTrades = [];
    const losingTrades = [];
    
    validTrades.forEach(trade => {
      // Handle both processed and unprocessed trade formats
      const entryPrice = parseFloat(trade.entryPrice || trade.entry_price);
      const exitPrice = parseFloat(trade.exitPrice || trade.exit_price);
      const positionSize = parseFloat(trade.positionSize || trade.position_size || 1);
      const isLong = (trade.direction || '').toUpperCase() === 'LONG';
      
      // Calculate P&L based on trade direction
      const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      const pnl = priceDiff * positionSize;
      const returnPct = (priceDiff / entryPrice) * 100;
      
      if (pnl > 0) {
        winningTrades.push({ ...trade, pnl, returnPct });
      } else if (pnl < 0) {
        losingTrades.push({ ...trade, pnl: Math.abs(pnl), returnPct: Math.abs(returnPct) });
      }
    });

    const totalTrades = validTrades.length;
    const totalWins = winningTrades.length;
    const totalLosses = losingTrades.length;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    // Calculate total profit and loss
    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLoss = losingTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    
    // Calculate profit factor
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Number.POSITIVE_INFINITY : 0;

    // Calculate average win/loss percentages
    const avgWinPercentage = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + trade.returnPct, 0) / winningTrades.length
      : 0;

    const avgLossPercentage = losingTrades.length > 0 
      ? losingTrades.reduce((sum, trade) => sum + trade.returnPct, 0) / losingTrades.length
      : 0;

    return {
      winRate,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      avgWinPercentage: parseFloat(avgWinPercentage.toFixed(2)),
      avgLossPercentage: parseFloat(avgLossPercentage.toFixed(2)),
      totalTrades,
      totalWins,
      totalLosses,
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2))
    };
  };

  // Enhanced tooltip with more trade details
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Safely parse and format dates
      const formatDate = (dateStr, fallback = 'N/A') => {
        try {
          if (!dateStr) return fallback;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? fallback : format(date, 'MMM d, yyyy HH:mm');
        } catch (e) {
          return fallback;
        }
      };
      
      const entryDate = formatDate(data.entryDate || data.entry_date);
      const exitDate = formatDate(data.exitDate || data.exit_date);
      
      // Calculate PnL if not provided
      const pnl = data.pnl !== undefined ? data.pnl : 
        (data.pnlPercent !== undefined ? 
          (parseFloat(data.entryPrice || data.entry_price) * (parseFloat(data.pnlPercent) / 100)) || 0 : 0);
          
      const pnlPercent = data.pnlPercent !== undefined ? data.pnlPercent : 
        (data.pnl !== undefined && data.entryPrice ? 
          ((parseFloat(data.pnl) / parseFloat(data.entryPrice)) * 100) : 0);
      
      const isWin = data.isWinner !== undefined ? data.isWinner : pnl >= 0;
      
      // Get direction from data, checking multiple possible sources
      const getTradeDirection = () => {
        // Check all possible direction fields and normalize the value
        const direction = (data.direction || data.position_type || 'LONG').toString().toUpperCase().trim();
        
        // Handle different possible direction formats
        if (['SHORT', 'SELL', 'S'].includes(direction)) {
          return { direction: 'SHORT', isLong: false };
        }
        if (['LONG', 'BUY', 'B'].includes(direction)) {
          return { direction: 'LONG', isLong: true };
        }
        
        // Default to LONG if direction is not recognized
        return { direction: 'LONG', isLong: true };
      };
      
      const { direction, isLong } = getTradeDirection();
      
      // Format price with proper decimal places based on the value
      const formatPrice = (price) => {
        if (price === undefined || price === null) return 'N/A';
        const num = parseFloat(price);
        if (isNaN(num)) return 'N/A';
        return num.toFixed(num < 1 ? 6 : 2);
      };
      
      // Format PnL with proper sign and color
      const formatPnl = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 'N/A';
        const isPositive = num >= 0;
        const sign = isPositive ? '+' : '';
        const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
        return (
          <span className={`font-semibold ${colorClass}`}>
            {sign}{Math.abs(num).toFixed(2)}
          </span>
        );
      };
      
      // Format direction with icon and color
      const formatDirection = (dir) => {
        if (!dir) return null;
        
        // Normalize the direction string
        const dirStr = String(dir).toUpperCase().trim();
        const isShort = ['SHORT', 'SELL', 'S'].includes(dirStr);
        const displayText = isShort ? 'SHORT' : 'LONG';
        
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isShort
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {displayText}
          </span>
        );
      };
      
      // Format exit reason
      const formatExitReason = (reason) => {
        if (!reason) return 'Manual';
        return reason
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
      
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg">{data.symbol || 'Trade'}</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                #{data.id || 'N/A'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  isWin 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {isWin ? 'WIN' : 'LOSS'}
                </span>
                {formatDirection(direction)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="text-gray-500 dark:text-gray-400">Entry Price:</div>
            <div className="font-medium text-right">${formatPrice(data.entryPrice || data.entry_price)}</div>
            
            <div className="text-gray-500 dark:text-gray-400">Exit Price:</div>
            <div className="font-medium text-right">${formatPrice(data.exitPrice || data.exit_price)}</div>
            
            <div className="text-gray-500 dark:text-gray-400">P&L:</div>
            <div className="text-right">
              {formatPnl(pnl)} ({Math.abs(parseFloat(pnlPercent)).toFixed(2)}%)
            </div>
            
            {data.stop_loss !== undefined && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Stop Loss:</div>
                <div className="text-right">${formatPrice(data.stop_loss || data.stopLoss)}</div>
              </>
            )}
            
            {data.take_profit !== undefined && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Take Profit:</div>
                <div className="text-right">${formatPrice(data.take_profit || data.takeProfit)}</div>
              </>
            )}
            
            <div className="text-gray-500 dark:text-gray-400">Exit Reason:</div>
            <div className="text-right">
              {formatExitReason(data.exit_reason || data.exitReason)}
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Entry:</span>
                <span>{entryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Exit:</span>
                <span>{exitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">Max Updraw:</span>
                <span>+{(data.updraw || 0).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 dark:text-red-400">Max Drawdown:</span>
                <span>{Math.abs(data.drawdown || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          
          {data.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {data.notes}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Enhanced stat card with loading and error states
  const renderStatCard = (title, value, { isPercentage = false, isPositive = null, isLoading = false, error = null } = {}) => {
    let colorClass = 'text-gray-900 dark:text-white';
    let bgColorClass = 'bg-white dark:bg-gray-800';
    let borderColorClass = 'border-gray-100 dark:border-gray-700';
    
    if (isPositive !== null) {
      if (isPositive) {
        colorClass = 'text-green-700 dark:text-green-400';
        bgColorClass = 'bg-green-50 dark:bg-green-900/30';
        borderColorClass = 'border-green-200 dark:border-green-800';
      } else {
        colorClass = 'text-red-700 dark:text-red-400';
        bgColorClass = 'bg-red-50 dark:bg-red-900/30';
        borderColorClass = 'border-red-200 dark:border-red-800';
      }
    }
    
    return (
      <div className={`${bgColorClass} p-4 rounded-lg shadow-sm border ${borderColorClass} transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className={`mt-2 text-xl font-semibold ${colorClass} min-h-8 flex items-center`}>
          {isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
          ) : error ? (
            <span className="text-xs text-red-500">Error</span>
          ) : isPercentage ? (
            `${value}%`
          ) : (
            value
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Loading trade data...</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <RefreshCw className="inline mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-lg shadow">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading data</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40"
              >
                <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No trades state
  if (tradesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center p-6">
        <BarChart className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Trades Found</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          There are no trades available for analysis. Please add some trades to your journal first.
        </p>
        <button
          onClick={() => navigate('/journal')}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Journal
        </button>
      </div>
    );
  }

  // Format last updated time
  const formattedLastUpdated = lastUpdated 
    ? `Last updated: ${format(new Date(lastUpdated), 'MMM d, yyyy HH:mm:ss')}`
    : '';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-3 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exit Analysis</h1>
          {formattedLastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formattedLastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {tradesData.length} {tradesData.length === 1 ? 'trade' : 'trades'}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {renderStatCard('Win Rate', stats.winRate, { isPercentage: true, isPositive: stats.winRate >= 50 })}
          {renderStatCard('Profit Factor', stats.profitFactor.toFixed(2), { isPositive: stats.profitFactor >= 1 })}
          {renderStatCard('Avg Win %', stats.avgWinPercentage.toFixed(2), { isPercentage: true, isPositive: true })}
          {renderStatCard('Avg Loss %', stats.avgLossPercentage.toFixed(2), { isPercentage: true, isPositive: false })}
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trade Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tradesData.map((trade, index) => ({
                  ...trade,
                  tradeNumber: index + 1 // Add trade number to each data point
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="tradeNumber" 
                  label={{ value: 'Trade #', position: 'insideBottomRight', offset: -5 }}
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis />
                <Tooltip 
                  content={<CustomTooltip />} 
                  formatter={(value, name, props) => {
                    // Keep the original tooltip content but add trade number to the label
                    const originalContent = CustomTooltip(props);
                    if (originalContent && originalContent.props) {
                      const tradeNum = props.payload?.[0]?.payload?.tradeNumber;
                      if (tradeNum) {
                        return [
                          <div key="trade-num" className="font-bold mb-1">
                            Trade #{tradeNum}
                          </div>,
                          ...(Array.isArray(originalContent.props.children) 
                            ? originalContent.props.children 
                            : [originalContent.props.children])
                        ];
                      }
                    }
                    return originalContent;
                  }}
                />
                <Legend />
                <Bar dataKey="updraw" name="Updraw" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="drawdown" name="Drawdown" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitAnalysis;


