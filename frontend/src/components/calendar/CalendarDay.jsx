import React, { useMemo } from 'react';
import { FaCheck } from 'react-icons/fa';

const formatCurrency = (amount) => {
  if (amount === 0) return '-';
  const absAmount = Math.abs(amount);
  return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(2)}`;
};

const CalendarDay = React.memo(({ day, onClick = () => {} }) => {
  if (!day) return <div className="calendar-day empty" />;

  const isProfit = day.pnl > 0;
  const isLoss = day.pnl < 0;
  const hasTrades = day.trades > 0;
  const pnlFormatted = formatCurrency(day.pnl);
  
  const dayClasses = [
    'calendar-day',
    !day.isCurrentMonth ? 'other-month' : '',
    day.isToday ? 'today' : '',
    day.isPreviousDay ? 'yesterday' : '',
    isProfit ? 'profit' : '',
    isLoss ? 'loss' : '',
  ].filter(Boolean).join(' ');

  const pnlClasses = [
    'pnl-amount',
    isProfit ? 'profit' : '',
    isLoss ? 'loss' : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={dayClasses}
      onClick={() => !day.isFuture && onClick(day)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !day.isFuture && onClick(day)}
    >
      <div className="day-header">
        <span className="day-number">{day.day}</span>
        {hasTrades && (
          <span className="trade-count">
            {day.trades}
          </span>
        )}
      </div>
      
      <div className="day-content">
        <span className={pnlClasses}>
          {pnlFormatted}
        </span>
        {hasTrades && (
          <span className="trades-indicator">
            <FaCheck size={10} />
          </span>
        )}
      </div>
      
      <style jsx>{`
        .calendar-day {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: white;
          border: 1px solid #e5e7eb;
        }
        
        .calendar-day.today {
          background-color: #3b82f6;
          color: white;
          border-color: #2563eb;
        }
        
        .calendar-day.yesterday {
          background-color: #e0f2fe;
          border-color: #7dd3fc;
        }
        
        .calendar-day.other-month {
          opacity: 0.4;
        }
        
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        
        .day-number {
          font-size: 13px;
          font-weight: 500;
        }
        
        .trade-count {
          background-color: #e5e7eb;
          color: #4b5563;
          font-size: 11px;
          font-weight: 500;
          padding: 0 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 16px;
          height: 16px;
        }
        
        .today .trade-count {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .day-content {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          flex-grow: 1;
          position: relative;
        }
        
        .pnl-amount {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          margin-top: auto;
        }
        
        .profit {
          color: #10b981;
        }
        
        .loss {
          color: #ef4444;
        }
        
        .today .pnl-amount,
        .yesterday .pnl-amount {
          color: inherit;
        }
        
        .trades-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
        }
        
        .today .trades-indicator,
        .yesterday .trades-indicator {
          color: inherit;
        }
      `}</style>
    </div>
  );
});

CalendarDay.displayName = 'CalendarDay';
export default CalendarDay;

