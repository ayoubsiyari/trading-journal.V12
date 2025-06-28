import React, { useMemo } from 'react';

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

const PerformanceList = ({ data = [] }) => {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.period) - new Date(a.period));
  }, [data]);

  if (!data.length) {
    return (
      <div className="performance-list-empty">
        <div className="empty-icon">📊</div>
        <h3>No performance data available</h3>
        <p>Performance data will appear here once you have trading history.</p>
      </div>
    );
  }

  return (
    <div className="performance-list">
      <div className="performance-header">
        <h2 className="performance-title">📈 Performance Summary</h2>
        <p className="performance-subtitle">
          Detailed breakdown of your trading performance over time
        </p>
      </div>

      <div className="performance-grid">
        {sortedData.map((item, index) => (
          <div key={index} className="performance-card">
            <div className="card-header">
              <div className="period-info">
                <h3 className="period-title">{item.period}</h3>
                <div className="period-meta">
                  {item.trades_count && (
                    <span className="trade-count">
                      {item.trades_count} trade{item.trades_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className={`pnl-badge ${item.total_pnl >= 0 ? 'profit' : 'loss'}`}>
                {item.total_pnl >= 0 ? '📈' : '📉'}
              </div>
            </div>

            <div className="card-content">
              <div className="main-metric">
                <div className="metric-label">Total P&L</div>
                <div className={`metric-value ${item.total_pnl >= 0 ? 'profit' : 'loss'}`}>
                  {formatCurrency(item.total_pnl || 0)}
                </div>
              </div>

              <div className="metrics-grid">
                {item.win_rate !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Win Rate</div>
                    <div className="metric-value neutral">
                      {formatPercent(item.win_rate)}
                    </div>
                  </div>
                )}

                {item.avg_win !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Avg Win</div>
                    <div className="metric-value profit">
                      {formatCurrency(item.avg_win)}
                    </div>
                  </div>
                )}

                {item.avg_loss !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Avg Loss</div>
                    <div className="metric-value loss">
                      {formatCurrency(item.avg_loss)}
                    </div>
                  </div>
                )}

                {item.profit_factor !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Profit Factor</div>
                    <div className="metric-value neutral">
                      {item.profit_factor.toFixed(2)}
                    </div>
                  </div>
                )}

                {item.max_drawdown !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Max Drawdown</div>
                    <div className="metric-value loss">
                      {formatCurrency(item.max_drawdown)}
                    </div>
                  </div>
                )}

                {item.sharpe_ratio !== undefined && (
                  <div className="metric-item">
                    <div className="metric-label">Sharpe Ratio</div>
                    <div className="metric-value neutral">
                      {item.sharpe_ratio.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add the performance list styles
const performanceStyles = `
/* Performance List Styles */
.performance-list {
  padding: 1rem 0;
}

.performance-list-empty {
  text-align: center;
  padding: 4rem 1rem;
  background: var(--secondary-bg);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.performance-list-empty h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.performance-list-empty p {
  color: var(--text-secondary);
  margin: 0;
}

.performance-header {
  margin-bottom: 2rem;
}

.performance-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.performance-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.performance-card {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.performance-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.period-info {
  flex: 1;
}

.period-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.period-meta {
  display: flex;
  gap: 0.75rem;
}

.trade-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--primary-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pnl-badge {
  font-size: 1.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: var(--primary-bg);
}

.pnl-badge.profit {
  background: rgba(16, 185, 129, 0.1);
}

.pnl-badge.loss {
  background: rgba(239, 68, 68, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.main-metric {
  text-align: center;
  padding: 1rem;
  background: var(--primary-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.main-metric .metric-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.main-metric .metric-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.metric-item {
  text-align: center;
  padding: 0.75rem;
  background: var(--primary-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.metric-item .metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.metric-item .metric-value {
  font-size: 1rem;
  font-weight: 700;
}

.metric-value.profit {
  color: var(--success-green);
}

.metric-value.loss {
  color: var(--danger-red);
}

.metric-value.neutral {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .performance-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pnl-badge {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .performance-card {
    padding: 1rem;
  }
  
  .main-metric .metric-value {
    font-size: 1.5rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('performance-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'performance-styles';
  styleSheet.textContent = performanceStyles;
  document.head.appendChild(styleSheet);
}

export default PerformanceList;

