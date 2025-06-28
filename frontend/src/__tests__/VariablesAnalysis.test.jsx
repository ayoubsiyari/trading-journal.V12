import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VariablesAnalysis from '../pages/analytics/VariablesAnalysis';

// Mock the API call
jest.mock('../../utils/api', () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      variables: [
        { variable: 'strategy', value: 'mean_reversion', pnl: 1000, win_rate: 0.65, trades: 20 },
        { variable: 'strategy', value: 'breakout', pnl: -500, win_rate: 0.45, trades: 15 },
        { variable: 'timeframe', value: '1h', pnl: 750, win_rate: 0.6, trades: 30 }
      ],
      combinations: [
        { 
          variables: [
            { key: 'strategy', value: 'mean_reversion' },
            { key: 'timeframe', value: '1h' }
          ],
          pnl: 1200,
          win_rate: 0.7,
          trades: 25
        }
      ]
    }
  }))
}));

describe('VariablesAnalysis', () => {
  it('renders loading state initially', () => {
    render(<VariablesAnalysis />);
    expect(screen.getByText('Loading variables data...')).toBeInTheDocument();
  });

  it('displays variables data after loading', async () => {
    render(<VariablesAnalysis />);
    
    await waitFor(() => {
      expect(screen.getByText('mean_reversion')).toBeInTheDocument();
      expect(screen.getByText('breakout')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
    });
  });

  it('sorts variables by P&L when column header is clicked', async () => {
    render(<VariablesAnalysis />);
    
    await waitFor(() => {
      const pnlHeader = screen.getByText('P&L');
      fireEvent.click(pnlHeader);
      
      const variables = screen.getAllByRole('row');
      // First data row should be the one with highest P&L
      expect(variables[1]).toHaveTextContent('mean_reversion');
    });
  });

  it('filters variables when search term is entered', async () => {
    render(<VariablesAnalysis />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search variables...');
      fireEvent.change(searchInput, { target: { value: 'mean' } });
      
      expect(screen.getByText('mean_reversion')).toBeInTheDocument();
      expect(screen.queryByText('breakout')).not.toBeInTheDocument();
    });
  });
});
