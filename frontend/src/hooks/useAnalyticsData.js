
import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchWithAuth } from '../utils/fetchUtils';

// Helper formatters
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function useAnalyticsData() {
  const [stats, setStats] = useState(null);
  const [equityMetrics, setEquityMetrics] = useState(null);
  const [equityMetricsLoading, setEquityMetricsLoading] = useState(true);
  const [equityMetricsError, setEquityMetricsError] = useState('');
  const [performanceData, setPerformanceData] = useState({
    best_setup: null,
    best_instrument: null,
    best_time_of_day: null,
    best_week: null,
    hourly_performance: [],
    weekly_performance: [],
    monthly_performance: []
  });
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [error, setError] = useState('');
  const [performanceError, setPerformanceError] = useState('');
  const [importHistory, setImportHistory] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [referenceDate, setReferenceDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWithAuth('http://localhost:5000/api/journal/import/history');
        setImportHistory(data || []);
      } catch (err) {
        console.error('❌ Failed to load import history:', err);
      }
    })();
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    setPerformanceLoading(true);
    setPerformanceError('');
    try {
      const data = await fetchWithAuth('http://localhost:5000/api/journal/performance-highlights');
      setPerformanceData({
        best_setup: data.best_setup || { name: 'No data', pnl: 0, win_rate: 0, trades: 0 },
        best_instrument: data.best_instrument || { symbol: 'No data', pnl: 0, win_rate: 0, trades: 0 },
        best_time_of_day: data.best_time_of_day || { hour: 0, formatted_time: 'No data', pnl: 0, win_rate: 0, trades: 0 },
        best_week: data.best_week || { week: 'No data', formatted_range: 'No data', pnl: 0, win_rate: 0, trades: 0 },
        monthly_performance: data.monthly_performance || [],
        hourly_performance: data.hourly_performance || Array(24).fill(0).map((_, i) => ({
          hour: i,
          formatted_time: `${i.toString().padStart(2, '0')}:00`,
          pnl: 0,
          win_rate: 0,
          trades: 0
        })),
        weekly_performance: data.weekly_performance || []
      });
    } catch (err) {
      console.error('❌ Failed to load performance data:', err);
      setPerformanceError('Failed to load performance data. Please try again later.');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token from localStorage:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const url = new URL('http://localhost:5000/api/journal/stats');
      if (selectedBatch) url.searchParams.set('batch_id', selectedBatch);
      
      console.log('📊 Fetching stats from:', url.toString());
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token.replace(/^"|"$/g, '')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for session-based auth if needed
      });
      
      if (response.status === 401) {
        console.error('❌ Authentication failed. Token might be invalid or expired.');
        // Redirect to login or refresh token here if needed
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Raw API response:', data);
      
      // Convert pnl_by_date from array of arrays to object if needed
      let pnlByDate = {};
      if (Array.isArray(data?.pnl_by_date)) {
        console.log('Converting pnl_by_date from array to object format');
        data.pnl_by_date.forEach(([date, pnl]) => {
          if (date) {
            pnlByDate[date] = pnl;
          }
        });
      } else if (data?.pnl_by_date && typeof data.pnl_by_date === 'object') {
        pnlByDate = data.pnl_by_date;
      }
      
      const processedData = {
        ...data,
        pnl_by_date: pnlByDate
      };
      
      console.log('📥 Processed stats data:', {
        hasTrades: !!processedData?.trades,
        tradesCount: processedData?.trades?.length || 0,
        pnlByDateType: Array.isArray(data.pnl_by_date) ? 'array' : 
                       (data.pnl_by_date ? 'object' : 'none'),
        pnlByDateCount: Object.keys(pnlByDate).length,
        samplePnlByDate: Object.entries(pnlByDate).slice(0, 3)
      });
      
      // Log a few sample trades for debugging
      if (processedData?.trades?.length > 0) {
        console.log('🔍 Sample trades:', processedData.trades.slice(0, 3).map(t => ({
          id: t.id,
          symbol: t.symbol,
          pnl: t.pnl,
          date: t.date || t.entry_date || t.timestamp || 'no-date',
          direction: t.direction
        })));
      }
      
      setStats(processedData);
      
      if (selectedBatch) {
        await fetchPerformanceData();
      }
    } catch (err) {
      console.error('❌ fetchStats error:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, fetchPerformanceData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const calendarStats = useMemo(() => {
    console.log('Calculating calendar stats...');
    console.log('Stats:', stats);
    console.log('Performance Data:', performanceData);
    const dailyMap = new Map();
    const trades = [];

    // Get current date in local timezone for comparison
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`📅 Current local date key: ${todayKey}`);

    if (stats?.trades?.length) {
      console.log(`Found ${stats.trades.length} trades to process`);
      
      // Log sample of trades for debugging
      const sampleTrades = stats.trades.slice(0, 3);
      console.log('🔍 Sample trades:', sampleTrades);
      
      stats.trades.forEach(trade => {
        try {
          // Skip weekly/monthly summary data
          if (trade.is_week || trade.is_month) {
            console.log('Skipping weekly/monthly summary trade:', trade);
            return;
          }
          
          // Get the trade date from the most likely fields
          let tradeDate = trade.date || trade.entry_date || trade.timestamp || trade.created_at;
          let dateObj;
          let dateKey;
          
          // If no date is found, use current date
          if (!tradeDate) {
            console.warn('⚠️ Trade missing date field, using current date:', trade);
            dateObj = new Date();
            dateKey = dateObj.toISOString().split('T')[0];
          } else {
            // Parse the date
            dateObj = new Date(tradeDate);
            
            // Validate the date
            if (isNaN(dateObj.getTime())) {
              console.warn('⚠️ Invalid date in trade, using current date:', tradeDate, trade);
              dateObj = new Date();
              dateKey = dateObj.toISOString().split('T')[0];
            } else {
              // Format as YYYY-MM-DD using local timezone
              dateKey = dateObj.toLocaleDateString('en-CA');
            }
          }
          
          // Get PnL value, ensuring it's a number
          const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl || 0) || 0;
          
          // Log date conversion for debugging
          console.log('Trade date conversion:', {
            originalDate: tradeDate,
            parsedDate: dateObj.toISOString(),
            localDate: dateKey,
            tradeId: trade.id || 'unknown'
          });
          
          // Initialize day in map if it doesn't exist
          if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, { 
              pnl: 0, 
              trades: 0, 
              date: dateKey,
              dateObj: new Date(dateKey) // Store Date object for sorting
            });
          }
          
          // Update day stats
          const dayStats = dailyMap.get(dateKey);
          dayStats.pnl += pnl;
          dayStats.trades += 1;
          
          // Add trade to trades array with consistent date format
          trades.push({
            ...trade,
            id: trade.id || `trade-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: dateObj.toISOString(),
            date: dateKey,
            entry_date: dateKey,
            pnl: pnl,
            direction: trade.direction || 'long' // Ensure direction has a default value
          });
          
          console.log(`✅ Processed trade ${trade.id || 'unknown'}:`, {
            originalDate: tradeDate,
            processedDate: dateKey,
            pnl: pnl,
            symbol: trade.symbol || 'unknown'
          });
        } catch (error) {
          console.error('Error processing trade:', error, trade);
        }
      });
    }

    // Don't include weekly performance in the main trades array
    // This prevents them from showing up in the calendar
    // Weekly summaries are handled separately in the performance components
    if (performanceData.weekly_performance?.length) {
      console.log('Skipping weekly performance data for calendar view');
    }

    if (performanceData.monthly_performance?.length) {
      performanceData.monthly_performance.forEach(month => {
        if (!month.month) return;
        trades.push({
          id: `month-${month.month}-${month.year || new Date().getFullYear()}`,
          timestamp: month.start_date || `${month.year}-${String(month.month).padStart(2, '0')}-01`,
          pnl: parseFloat(month.pnl || 0) || 0,
          win_rate: parseFloat(month.win_rate) || 0,
          trades_count: parseInt(month.trades) || 0,
          is_month: true,
          month: month.month,
          year: month.year,
          label: month.label || `${month.year}-${String(month.month).padStart(2, '0')}`
        });
      });
    }

    const pnlByDate = Object.fromEntries(
      Array.from(dailyMap.entries()).map(([date, stats]) => [date, stats.pnl])
    );

    return {
      pnl_by_date: pnlByDate,
      trades: trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
  }, [stats, performanceData]);

  // Function to fetch equity metrics
  const fetchEquityMetrics = useCallback(async () => {
    const endpoint = 'http://localhost:5000/api/journal/equities';
    console.log(`[Equity] Fetching equity metrics from ${endpoint}`);
    
    try {
      setEquityMetricsLoading(true);
      setEquityMetricsError('');
      
      const startTime = Date.now();
      const data = await fetchWithAuth(endpoint);
      const duration = Date.now() - startTime;
      
      console.log(`[Equity] Successfully fetched equity metrics in ${duration}ms`, data);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      setEquityMetrics(data.metrics || {});
    } catch (err) {
      console.error('❌ Failed to load equity metrics:', {
        error: err,
        message: err.message,
        stack: err.stack,
        endpoint
      });
      
      // Provide more specific error message
      let errorMessage = 'Failed to load equity metrics. Some statistics may be unavailable.';
      if (err.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message.includes('401')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Equity metrics endpoint not found. Please check the backend service.';
      }
      
      setEquityMetricsError(errorMessage);
      setEquityMetrics({});
    } finally {
      setEquityMetricsLoading(false);
    }
  }, []);

  // Fetch equity metrics on mount and set up auto-refresh
  useEffect(() => {
    fetchEquityMetrics();
    
    const interval = setInterval(fetchEquityMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchEquityMetrics]);

  return {
    stats: {
      ...stats,
      ...calendarStats,
      equity_metrics: equityMetrics
    },
    equityMetrics,
    equityMetricsLoading,
    equityMetricsError,
    performanceData,
    loading: loading || equityMetricsLoading,
    performanceLoading,
    error: error || equityMetricsError,
    performanceError,
    importHistory,
    selectedBatch,
    setSelectedBatch,
    referenceDate,
    setReferenceDate,
    refreshPerformanceData: fetchPerformanceData,
    refreshStats: fetchStats,
    refreshEquityMetrics: fetchEquityMetrics
  };
}
