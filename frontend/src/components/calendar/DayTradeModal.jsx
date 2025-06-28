import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

const formatCurrency = (amount) => {
  if (amount === 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

const DayTradeModal = ({ isOpen, onClose, selectedDate, trades = [] }) => {
  const dayTrades = useMemo(() => {
    if (!selectedDate || !trades.length) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return trades.filter(trade => {
      const tradeDate = format(parseISO(trade.entry_date), 'yyyy-MM-dd');
      return tradeDate === dateStr;
    });
  }, [selectedDate, trades]);

  const dayStats = useMemo(() => {
    if (!dayTrades.length) return null;

    const totalPnL = dayTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
    const winningTrades = dayTrades.filter(trade => parseFloat(trade.pnl || 0) > 0);
    const losingTrades = dayTrades.filter(trade => parseFloat(trade.pnl || 0) < 0);
    const winRate = dayTrades.length > 0 ? (winningTrades.length / dayTrades.length) * 100 : 0;

    return {
      totalTrades: dayTrades.length,
      totalPnL,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0) / losingTrades.length : 0,
    };
  }, [dayTrades]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            📊 Trading Summary
          </h2>
          <div className="modal-date">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {dayTrades.length === 0 ? (
            <div className="no-trades">
              <div className="no-trades-icon">📭</div>
              <h3>No trades on this day</h3>
              <p>You didn't execute any trades on this date.</p>
            </div>
          ) : (
            <>
              {/* Day Statistics */}
              {dayStats && (
                <div className="day-stats">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total P&L</div>
                      <div className={`stat-value ${dayStats.totalPnL >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(dayStats.totalPnL)}
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-label">Total Trades</div>
                      <div className="stat-value neutral">
                        {dayStats.totalTrades}
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-label">Win Rate</div>
                      <div className="stat-value neutral">
                        {formatPercent(dayStats.winRate)}
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-label">Avg Win</div>
                      <div className="stat-value profit">
                        {formatCurrency(dayStats.avgWin)}
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-label">Avg Loss</div>
                      <div className="stat-value loss">
                        {formatCurrency(dayStats.avgLoss)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trades List */}
              <div className="trades-section">
                <h3 className="trades-title">Trade Details</h3>
                <div className="trades-list">
                  {dayTrades.map((trade, index) => (
                    <div key={index} className="trade-item">
                      <div className="trade-header">
                        <div className="trade-symbol">
                          <span className="symbol-text">{trade.symbol}</span>
                          <span className={`direction-badge ${trade.direction}`}>
                            {trade.direction === 'long' ? '📈' : '📉'} {trade.direction?.toUpperCase()}
                          </span>
                        </div>
                        <div className={`trade-pnl ${parseFloat(trade.pnl || 0) >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(parseFloat(trade.pnl || 0))}
                        </div>
                      </div>
                      
                      <div className="trade-details">
                        <div className="trade-detail">
                          <span className="detail-label">Strategy:</span>
                          <span className="detail-value">{trade.strategy || 'N/A'}</span>
                        </div>
                        
                        <div className="trade-detail">
                          <span className="detail-label">Entry:</span>
                          <span className="detail-value">{formatCurrency(parseFloat(trade.entry_price || 0))}</span>
                        </div>
                        
                        <div className="trade-detail">
                          <span className="detail-label">Exit:</span>
                          <span className="detail-value">{formatCurrency(parseFloat(trade.exit_price || 0))}</span>
                        </div>
                        
                        <div className="trade-detail">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value">{trade.quantity || 'N/A'}</span>
                        </div>
                        
                        {trade.notes && (
                          <div className="trade-detail full-width">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{trade.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Add the modal styles to the CSS
const modalStyles = `
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--secondary-bg);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.modal-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--primary-bg);
  color: var(--text-primary);
}

.modal-content {
  padding: 1.5rem;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.no-trades {
  text-align: center;
  padding: 3rem 1rem;
}

.no-trades-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-trades h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.no-trades p {
  color: var(--text-secondary);
  margin: 0;
}

.day-stats {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--primary-bg);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
}

.stat-value.profit {
  color: var(--success-green);
}

.stat-value.loss {
  color: var(--danger-red);
}

.stat-value.neutral {
  color: var(--text-primary);
}

.trades-section {
  margin-top: 2rem;
}

.trades-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.trades-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trade-item {
  background: var(--primary-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.trade-symbol {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.symbol-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.direction-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
}

.direction-badge.long {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-green);
}

.direction-badge.short {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-red);
}

.trade-pnl {
  font-size: 1.125rem;
  font-weight: 700;
}

.trade-pnl.profit {
  color: var(--success-green);
}

.trade-pnl.loss {
  color: var(--danger-red);
}

.trade-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.trade-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trade-detail.full-width {
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

@media (max-width: 640px) {
  .modal-container {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .trade-details {
    grid-template-columns: 1fr;
  }
  
  .trade-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'modal-styles';
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}

export default DayTradeModal;

