/**
 * Financial metrics calculation utilities
 * 
 * Required Inputs:
 * - initialBalance: Starting account balance (required for accurate return calculations)
 * - trades: Array of trade objects with pnl, date, etc.
 */

/**
 * Calculate Sharpe Ratio
 * @param {Array} trades - Array of trade objects with pnl and date
 * @param {number} initialBalance - Initial account balance
 * @returns {Object} { value: number, missingInputs: string[] }
 */
export const calculateSharpeRatio = (trades, initialBalance) => {
    const missingInputs = [];
    if (!initialBalance || initialBalance <= 0) {
        missingInputs.push('Initial account balance');
    }
    if (!trades || trades.length === 0) {
        missingInputs.push('Trade history');
    }
    
    if (missingInputs.length > 0) {
        return { 
            value: null, 
            missingInputs,
            error: `Missing required inputs: ${missingInputs.join(', ')}`
        };
    }

    try {
        // Group trades by date
        const tradesByDate = {};
        trades.forEach(trade => {
            const date = trade.date ? new Date(trade.date).toISOString().split('T')[0] : 
                         trade.created_at ? new Date(trade.created_at).toISOString().split('T')[0] : 
                         'unknown';
            if (!tradesByDate[date]) {
                tradesByDate[date] = [];
            }
            tradesByDate[date].push(trade);
        });

        // Sort dates and calculate daily returns
        const sortedDates = Object.keys(tradesByDate).sort();
        const dailyReturns = [];
        let currentEquity = initialBalance;

        for (const date of sortedDates) {
            const dailyPnL = tradesByDate[date].reduce((sum, trade) => sum + (trade.pnl || 0), 0);
            const dailyReturn = dailyPnL / currentEquity;
            dailyReturns.push(dailyReturn);
            currentEquity += dailyPnL;
        }

        // Calculate Sharpe Ratio (annualized, assuming 252 trading days)
        if (dailyReturns.length < 2) {
            return { value: null, missingInputs: ['Sufficient trading history'] };
        }

        const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const stdDev = Math.sqrt(
            dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / 
            (dailyReturns.length - 1)
        );

        const sharpeRatio = (meanReturn / (stdDev || 1)) * Math.sqrt(252);
        return { 
            value: isFinite(sharpeRatio) ? sharpeRatio : 0,
            missingInputs: []
        };
    } catch (error) {
        console.error('Error calculating Sharpe ratio:', error);
        return { 
            value: null, 
            missingInputs: ['Valid trade data'],
            error: 'Error calculating Sharpe ratio'
        };
    }
};

/**
 * Check for missing required inputs for all metrics
 * @returns {Object} { hasMissingInputs: boolean, messages: string[] }
 */
export const validateMetricsInputs = (initialBalance, trades) => {
    const messages = [];
    
    if (!initialBalance || initialBalance <= 0) {
        messages.push('Initial account balance is required for accurate metrics calculation');
    }
    
    if (!trades || trades.length === 0) {
        messages.push('No trade history available');
    }
    
    return {
        hasMissingInputs: messages.length > 0,
        messages
    };
};
