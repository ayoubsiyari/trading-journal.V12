import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  subMonths,
  addMonths,
  parseISO,
} from 'date-fns';
import useAnalyticsData from '../../hooks/useAnalyticsData';
import {
  toDateKey,
  formatCurrency,
  formatPercent,
  exportToCSV,
} from '../../utils/dateUtils';
import CalendarDay from './CalendarDay';
import PerformanceList from './PerformanceList';
import DayTradeModal from './DayTradeModal';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEW_MODES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.DAILY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [theme, setTheme] = useState('dark');

  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('');
  const [filterDirection, setFilterDirection] = useState('');

  const { stats, loading, error } = useAnalyticsData();

  const uniqueSymbols = useMemo(() => {
    const trades = stats?.trades || [];
    return [...new Set(trades.map(t => t.symbol))];
  }, [stats]);

  const uniqueStrategies = useMemo(() => {
    const trades = stats?.trades || [];
    return [...new Set(trades.map(t => t.strategy))];
  }, [stats]);

  const calendarMatrix = useMemo(() => {
    if (loading || !stats?.pnl_by_date) return [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const pnlDataMap = new Map();
    const tradesByDateMap = new Map();

    const filteredTrades = (stats.trades || []).filter(trade => {
      const symbolMatch = filterSymbol ? trade.symbol === filterSymbol : true;
      const strategyMatch = filterStrategy ? trade.strategy === filterStrategy : true;
      const directionMatch = filterDirection ? trade.direction === filterDirection : true;
      return symbolMatch && strategyMatch && directionMatch;
    });

    filteredTrades.forEach(trade => {
      const dateKey = toDateKey(parseISO(trade.entry_date));
      const pnl = parseFloat(trade.pnl || 0);
      if (!pnlDataMap.has(dateKey)) {
        pnlDataMap.set(dateKey, 0);
        tradesByDateMap.set(dateKey, []);
      }
      pnlDataMap.set(dateKey, pnlDataMap.get(dateKey) + pnl);
      tradesByDateMap.get(dateKey).push(trade);
    });

    const calendarWeeks = [];
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    let currentDay = new Date(calendarStart);

    while (currentDay <= calendarEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const dateKey = toDateKey(currentDay);
        const pnl = pnlDataMap.get(dateKey) || 0;
        const trades = tradesByDateMap.get(dateKey) || [];

        week.push({
          day: currentDay.getDate(),
          date: new Date(currentDay),
          dateKey,
          pnl,
          trades: trades.length,
          isToday: isToday(currentDay),
          isCurrentMonth: isSameMonth(currentDay, currentDate),
          isSelected: selectedDate ? isSameDay(currentDay, selectedDate) : false,
          isFuture: currentDay > new Date(),
          isWin: pnl > 0,
          isLoss: pnl < 0
        });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      calendarWeeks.push(week);
    }

    return calendarWeeks;
  }, [currentDate, loading, selectedDate, stats, filterSymbol, filterStrategy, filterDirection]);

  const handleDateClick = useCallback(day => {
    if (!day || day.isFuture) return;
    setSelectedDate(day.date);
    setModalDate(day.date);
    setIsModalOpen(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      return newTheme;
    });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('calendar-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    return () => {
      localStorage.setItem('calendar-theme', theme);
    };
  }, [theme]);

  const navigateToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const navigateToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const navigateToNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const handleDataExport = useCallback(() => {
    if (!stats?.pnl_by_date) return;
    const exportData = Object.entries(stats.pnl_by_date).map(([date, pnl]) => ({
      date,
      pnl: formatCurrency(pnl),
      pnlPercent: formatPercent(pnl / Math.abs(pnl) || 0),
    }));
    exportToCSV(exportData, `trading-performance-${new Date().toISOString().split('T')[0]}.csv`);
  }, [stats]);

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-state">Loading trading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <div className="error-state">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h1 className="calendar-title">
            📊 Trading Performance Calendar
          </h1>
          <p className="calendar-subtitle">
            Track your daily trading performance with visual insights
          </p>
        </div>
        
        <div className="calendar-controls">
          {/* Navigation */}
          <div className="calendar-navigation">
            <button 
              className="nav-button" 
              onClick={navigateToPreviousMonth}
              aria-label="Previous month"
            >
              ←
            </button>
            <div className="current-month">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button 
              className="nav-button" 
              onClick={navigateToNextMonth}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* View Mode & Export */}
          <div className="filter-controls">
            <select 
              className="filter-select" 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="daily">📅 Daily View</option>
              <option value="weekly">📊 Weekly Summary</option>
              <option value="monthly">📈 Monthly Summary</option>
            </select>
            
            <button 
              onClick={handleDataExport} 
              className="export-button"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-controls" style={{ marginBottom: '2rem' }}>
        <select 
          value={filterSymbol} 
          onChange={e => setFilterSymbol(e.target.value)} 
          className="filter-select"
        >
          <option value=""> Symbols</option>
          {uniqueSymbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>

        <select 
          value={filterStrategy} 
          onChange={e => setFilterStrategy(e.target.value)} 
          className="filter-select"
        >
          <option value=""> Strategies</option>
          {uniqueStrategies.map(strategy => (
            <option key={strategy} value={strategy}>{strategy}</option>
          ))}
        </select>

        
      </div>

      {/* Calendar View */}
      {viewMode === VIEW_MODES.DAILY && (
        <div>
          {/* Weekday Headers */}
          <div className="calendar-weekdays">
            {WEEKDAYS.map(day => (
              <div key={day} className="weekday-header">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {calendarMatrix.map((week, i) => (
              <React.Fragment key={i}>
                {week.map((day, j) => (
                  <CalendarDay 
                    key={`${i}-${j}`} 
                    day={day} 
                    onClick={() => handleDateClick(day)} 
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Weekly View */}
      {viewMode === VIEW_MODES.WEEKLY && (
        <PerformanceList data={stats?.weekly_performance || []} />
      )}

      {/* Monthly View */}
      {viewMode === VIEW_MODES.MONTHLY && (
        <PerformanceList data={stats?.monthly_performance || []} />
      )}

      {/* Modal */}
      <DayTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={modalDate}
        trades={stats?.trades || []}
      />
    </div>
  );
};

export default Calendar;

