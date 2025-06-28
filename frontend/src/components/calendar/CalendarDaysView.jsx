import React, { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isToday, 
  isFuture, 
  subDays,
  isSameDay
} from 'date-fns';
import CalendarDay from './CalendarDay';
import './Calendar.css';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MockCalendarDay = ({ day, onClick }) => {
  const { day: dayNumber, pnl, trades, isCurrentMonth } = day;
  
  return (
    <div className="day-content" onClick={onClick}>
      <div className="day-number">{dayNumber}</div>
      {isCurrentMonth && trades > 0 && (
        <div className="trades-indicator">
          <span className="trades-count">{trades}</span>
        </div>
      )}
      {isCurrentMonth && pnl !== 0 && (
        <div className={`pnl-value ${pnl > 0 ? 'profit' : 'loss'}`}>
          {pnl > 0 ? '+' : ''}{Math.abs(pnl) >= 1000 ? `${(pnl/1000).toFixed(1)}k` : pnl.toFixed(0)}
        </div>
      )}
    </div>
  );
};

const CalendarDaysView = ({ stats }) => {
  const currentDate = new Date();
  const yesterday = subDays(currentDate, 1);
  
  const calendarMatrix = useMemo(() => {
    if (!stats?.pnl_by_date) return [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const pnlDataMap = new Map();
    
    // Process P&L data
    if (Array.isArray(stats.pnl_by_date)) {
      stats.pnl_by_date.forEach(([date, pnl]) => {
        if (date && pnl !== undefined) {
          pnlDataMap.set(date, pnl);
        }
      });
    }
    
    // Create a map of trade counts per day
    const tradeCounts = new Map();
    if (stats.trades && Array.isArray(stats.trades)) {
      stats.trades.forEach(trade => {
        try {
          let dateKey;
          if (trade.entry_date) {
            if (typeof trade.entry_date === 'string') {
              dateKey = trade.entry_date.includes('T') 
                ? trade.entry_date.split('T')[0]
                : trade.entry_date;
            } else if (trade.entry_date instanceof Date) {
              dateKey = format(trade.entry_date, 'yyyy-MM-dd');
            }
            
            if (dateKey) {
              tradeCounts.set(dateKey, (tradeCounts.get(dateKey) || 0) + 1);
            }
          }
        } catch (error) {
          console.error('Error processing trade date:', trade.entry_date, error);
        }
      });
    }
    
    const calendarWeeks = [];
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    // Create a fixed date for comparison to avoid modifying the original
    const fixedCurrentDate = new Date(currentDate);
    
    // Iterate through each week
    let currentWeekStart = new Date(calendarStart);
    
    while (currentWeekStart <= calendarEnd) {
      const week = [];
      // For each day in the week
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentDay.getDate() + i);
        
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const pnl = pnlDataMap.get(dateKey) || 0;
        const tradesCount = tradeCounts.get(dateKey) || 0;
        
        week.push({
          day: currentDay.getDate(),
          date: new Date(currentDay),
          dateKey,
          pnl: Number(pnl) || 0,
          trades: tradesCount,
          isCurrentMonth: isSameMonth(currentDay, fixedCurrentDate),
          isToday: isToday(currentDay),
          isFuture: isFuture(currentDay),
          isPreviousDay: isSameDay(currentDay, yesterday)
        });
      }
      
      calendarWeeks.push(week);
      // Move to the start of the next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return calendarWeeks;
  }, [stats, currentDate, yesterday]);

  // Generate empty matrix if no data
  if (calendarMatrix.length === 0) {
    // Create empty weeks for the current month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    let currentDate = new Date(startDate);
    const weeks = [];
    
    while (currentDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentDate);
        const dateKey = format(dayDate, 'yyyy-MM-dd');
        
        week.push({
          day: dayDate.getDate(),
          date: dayDate,
          dateKey,
          pnl: 0,
          trades: 0,
          isCurrentMonth: isSameMonth(dayDate, currentDate),
          isToday: isToday(dayDate),
          isFuture: isFuture(dayDate),
          isPreviousDay: isSameDay(dayDate, yesterday)
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = new Date(currentDate); // Create new date object to avoid reference issues
      }
      weeks.push(week);
    }
    
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h2 className="month-title">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-dot profit"></div>
              <span>Profit</span>
              
            </div>
            <div className="legend-item">
              <div className="legend-dot loss"></div>
              <span>Loss</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot trades"></div>
              <span>Trades</span>
            </div>
          </div>
        </div>
        <div className="calendar-days-container">
          <div className="weekday-headers">
            {WEEKDAYS.map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
          <div className="calendar-days-grid">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <div 
                    key={dayIndex}
                    className={`calendar-day-wrapper ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isPreviousDay ? 'yesterday' : ''} ${day.isFuture ? 'future' : ''}`}
                  >
                    <MockCalendarDay day={day} onClick={() => {}} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="month-title">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot profit"></div>
            <span>Profit</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot loss"></div>
            <span>Loss</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot trades"></div>
            <span>Trades</span>
          </div>
        </div>
      </div>

      <div className="calendar-days-container">
        {/* Weekday headers */}
        <div className="weekday-headers">
          {WEEKDAYS.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="calendar-days-grid">
          {calendarMatrix.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className={`calendar-day-wrapper ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isPreviousDay ? 'yesterday' : ''} ${day.isFuture ? 'future' : ''}`}
                >
                  <MockCalendarDay 
                    day={day} 
                    onClick={() => {}} 
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .calendar-container {
          background: linear-gradient(135deg,rgb(10, 77, 83) 0%,rgb(35, 123, 107) 100%);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .calendar-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .month-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: white;
          margin: 0;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.5px;
        }

        .calendar-legend {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(23, 4, 4, 0.9);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .legend-dot.profit {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .legend-dot.loss {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .legend-dot.trades {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .calendar-days-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }
        
        .weekday-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 700;
          color: #6366f1;
          margin-bottom: 16px;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .weekday-header {
          padding: 12px 0;
          position: relative;
        }

        .weekday-header::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 1px;
        }
        
        .calendar-days-grid {
          display: grid;
          grid-template-rows: repeat(6, 1fr);
          gap: 8px;
        }
        
        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        
        .calendar-day-wrapper {
          aspect-ratio: 1;
          min-height: 80px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px solid #e2e8f0;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
        }

        .calendar-day-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .calendar-day-wrapper:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 
            0 20px 40px rgba(99, 102, 241, 0.2),
            0 0 0 1px rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
        }

        .calendar-day-wrapper:hover::before {
          opacity: 1;
        }

        .calendar-day-wrapper.other-month {
          opacity: 0.3;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        }

        .calendar-day-wrapper.other-month:hover {
          opacity: 0.5;
          transform: none;
          box-shadow: none;
        }
        
        .calendar-day-wrapper.today {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-color: #1d4ed8;
          box-shadow: 
            0 8px 32px rgba(59, 130, 246, 0.4),
            0 0 0 1px rgba(59, 130, 246, 0.2);
        }

        .calendar-day-wrapper.today::before {
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          opacity: 1;
        }
        
        .calendar-day-wrapper.yesterday {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-color: #0ea5e9;
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2);
        }

        .calendar-day-wrapper.future {
          background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
          border-color: #e4e4e7;
        }

        .day-content {
          width: 100%;
          height: 100%;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .day-number {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          line-height: 1;
        }

        .today .day-number {
          color: white;
          font-size: 1.25rem;
        }

        .trades-indicator {
          position: absolute;
          top: 6px;
          right: 6px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .today .trades-indicator {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1f2937;
        }

        .trades-count {
          font-size: 0.625rem;
        }

        .pnl-value {
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          padding: 2px 6px;
          border-radius: 8px;
          line-height: 1.2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pnl-value.profit {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #059669;
          border: 1px solid #10b981;
        }

        .pnl-value.loss {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #dc2626;
          border: 1px solid #ef4444;
        }

        .today .pnl-value {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .calendar-container {
            padding: 20px;
            margin: 16px;
          }

          .calendar-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .month-title {
            font-size: 1.875rem;
          }

          .calendar-legend {
            gap: 12px;
          }

          .calendar-days-container {
            padding: 16px;
          }

          .calendar-day-wrapper {
            min-height: 60px;
          }

          .weekday-header {
            padding: 8px 0;
          }

          .day-content {
            padding: 8px 4px;
          }

          .day-number {
            font-size: 1rem;
          }

          .pnl-value {
            font-size: 0.625rem;
            padding: 1px 4px;
          }

          .trades-indicator {
            width: 16px;
            height: 16px;
            top: 4px;
            right: 4px;
          }

          .trades-count {
            font-size: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .calendar-container {
            padding: 16px;
            border-radius: 16px;
          }

          .month-title {
            font-size: 1.5rem;
          }

          .calendar-days-container {
            padding: 12px;
          }

          .calendar-day-wrapper {
            min-height: 50px;
            border-radius: 12px;
          }

          .weekday-headers {
            font-size: 0.75rem;
            margin-bottom: 12px;
          }

          .calendar-legend {
            flex-wrap: wrap;
            gap: 8px;
          }

          .legend-item {
            font-size: 0.75rem;
          }

          .legend-dot {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarDaysView;