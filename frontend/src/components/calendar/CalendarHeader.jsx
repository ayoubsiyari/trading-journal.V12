import React from 'react';
import { format } from 'date-fns';

const CalendarHeader = ({ 
  currentDate, 
  onPreviousMonth, 
  onNextMonth, 
  onToday,
  viewMode,
  onViewModeChange,
  onExport,
  filters,
  onFilterChange,
  uniqueSymbols = [],
  uniqueStrategies = []
}) => {
  return (
    <div className="calendar-header">
      {/* Title Section */}
      <div className="calendar-title-section">
        <h1 className="calendar-title">
          📊 Trading Performance Calendar
        </h1>
        <p className="calendar-subtitle">
          Track your daily trading performance with visual insights
        </p>
      </div>
      
      {/* Main Controls */}
      <div className="calendar-controls">
        {/* Navigation */}
        <div className="calendar-navigation">
          <button 
            className="nav-button" 
            onClick={onPreviousMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            ←
          </button>
          
          <div className="current-month">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          
          <button 
            className="nav-button" 
            onClick={onNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            →
          </button>
          
          <button 
            className="nav-button" 
            onClick={onToday}
            aria-label="Go to today"
            title="Go to today"
            style={{ marginLeft: '0.5rem' }}
          >
            📅
          </button>
        </div>

        {/* View Mode & Export */}
        <div className="filter-controls">
          <select 
            className="filter-select" 
            value={viewMode} 
            onChange={(e) => onViewModeChange(e.target.value)}
            aria-label="View mode"
          >
            <option value="daily">📅 Daily View</option>
            <option value="weekly">📊 Weekly Summary</option>
            <option value="monthly">📈 Monthly Summary</option>
          </select>
          
          <button 
            onClick={onExport} 
            className="export-button"
            aria-label="Export data to CSV"
            title="Export data to CSV"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <select 
          value={filters.symbol} 
          onChange={e => onFilterChange('symbol', e.target.value)} 
          className="filter-select"
          aria-label="Filter by symbol"
        >
          <option value="">🎯 All Symbols</option>
          {uniqueSymbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>

        <select 
          value={filters.strategy} 
          onChange={e => onFilterChange('strategy', e.target.value)} 
          className="filter-select"
          aria-label="Filter by strategy"
        >
          <option value="">⚡ All Strategies</option>
          {uniqueStrategies.map(strategy => (
            <option key={strategy} value={strategy}>{strategy}</option>
          ))}
        </select>

        <select 
          value={filters.direction} 
          onChange={e => onFilterChange('direction', e.target.value)} 
          className="filter-select"
          aria-label="Filter by direction"
        >
          <option value="">📈 All Directions</option>
          <option value="long">📈 Long</option>
          <option value="short">📉 Short</option>
        </select>
      </div>
    </div>
  );
};

export default CalendarHeader;

