import React, { useState, useMemo, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Bar,
  BarChart,
  Area,
  AreaChart,
  Cell,
  Brush,
  ReferenceArea,
  Label
} from 'recharts';
import { 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon,
  Zap,
  TrendingUp,
  Percent,
  Hash,
  RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';

// Chart type options with icons
const CHART_TYPES = [
  { value: 'line', label: 'Line', icon: <LineChartIcon size={16} /> },
  { value: 'area', label: 'Area', icon: <AreaChartIcon size={16} /> },
  { value: 'bar', label: 'Bar', icon: <BarChartIcon size={16} /> },
  { value: 'combo', label: 'Combo', icon: <TrendingUp size={16} /> }
];

// Time range options
const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

// Metric options with icons
const METRICS = [
  { value: 'pnl', label: 'P&L', icon: <Zap size={16} /> },
  { value: 'winRate', label: 'Win Rate', icon: <Percent size={16} /> },
  { value: 'trades', label: 'Trades', icon: <Hash size={16} /> },
];

/**
 * Custom tooltip component for the chart
 */
const ChartTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="font-medium text-gray-900 dark:text-white">
        {data.formatted_range || format(new Date(label), 'MMM d, yyyy')}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.name}:{' '}
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {metric === 'winRate' 
                  ? `${entry.value}%` 
                  : metric === 'pnl' 
                    ? `$${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : entry.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Custom legend component for the chart
 */
const ChartLegend = ({ payload, onClick, activeMetric }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
    {payload.map((entry, index) => (
      <div 
        key={`legend-${index}`}
        onClick={() => onClick(entry.dataKey)}
        className={`flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
          activeMetric === entry.dataKey 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
      >
        <div 
          className="w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: entry.color }}
        />
        {entry.value}
      </div>
    ))}
  </div>
);

/**
 * Calculate moving average for smoother trend lines
 */
const calculateMovingAverage = (data, key, window = 7) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  return data.map((entry, index) => {
    try {
      const start = Math.max(0, index - window + 1);
      const end = index + 1;
      const slice = data.slice(start, end);
      
      // Filter out invalid values
      const validValues = slice
        .map(item => item[key])
        .filter(value => typeof value === 'number' && !isNaN(value));
      
      // If no valid values, use 0 or previous MA
      if (validValues.length === 0) {
        return {
          ...entry,
          [`${key}MA`]: index > 0 ? (data[index - 1][`${key}MA`] || 0) : 0
        };
      }
      
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      const avg = sum / validValues.length;
      
      return {
        ...entry,
        [`${key}MA`]: avg
      };
    } catch (error) {
      console.error('Error calculating moving average:', error, { entry, index });
      return {
        ...entry,
        [`${key}MA`]: 0
      };
    }
  });
};

/**
 * Calculate cumulative P&L
 */
const calculateCumulativePnl = (data) => {
  if (!data || !Array.isArray(data)) return [];
  
  let cumulativePnl = 0;
  return data.map(entry => {
    try {
      const pnl = typeof entry.pnl === 'number' ? entry.pnl : 0;
      cumulativePnl += pnl;
      
      return {
        ...entry,
        pnl, // Ensure pnl is a number
        cumulativePnl
      };
    } catch (error) {
      console.error('Error calculating cumulative P&L:', error, { entry });
      return {
        ...entry,
        pnl: 0,
        cumulativePnl
      };
    }
  });
};

/**
 * Interactive performance chart component that allows users to visualize trading performance
 * with different chart types, time ranges, and metrics.
 */
const InteractivePerformanceChart = ({
  data: initialData = [],
  loading = false,
  height = 400,
  title = 'Performance Over Time',
  description = 'Track your trading performance over time',
  defaultTimeRange = '90',
  defaultChartType = 'area',
  defaultMetric = 'pnl',
  showControls = true,
  showLegend = true,
  showBrush = true,
  showCumulative = true,
}) => {
  // State for chart configuration
  const [chartType, setChartType] = useState(defaultChartType);
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [activeMetric, setActiveMetric] = useState(defaultMetric);
  const [showMovingAverage, setShowMovingAverage] = useState(defaultChartType !== 'combo');
  const [isCumulativeView, setIsCumulativeView] = useState(showCumulative);
  const [dataError, setDataError] = useState(null);

  // Process and filter data based on selected time range
  const processedData = useMemo(() => {
    try {
      setDataError(null);
      
      if (!initialData || !Array.isArray(initialData)) {
        throw new Error('Invalid data format');
      }
      
      if (initialData.length === 0) {
        return [];
      }
      
      // Create a deep copy to avoid mutating the original data
      let filteredData = JSON.parse(JSON.stringify(initialData));
      
      // Filter by time range if needed
      if (timeRange !== 'all') {
        const days = parseInt(timeRange, 10);
        const cutoffDate = subDays(new Date(), days);
        
        filteredData = filteredData.filter(entry => {
          try {
            const entryDate = entry.timestamp 
              ? new Date(entry.timestamp) 
              : entry.date 
                ? new Date(entry.date)
                : null;
                
            if (!entryDate || isNaN(entryDate.getTime())) {
              console.warn('Invalid date in entry:', entry);
              return false;
            }
            
            return entryDate >= cutoffDate;
          } catch (e) {
            console.error('Error processing entry date:', e, entry);
            return false;
          }
        });
      }
      
      // Process and validate the data
      const processed = filteredData.map((item, index) => {
        if (!item.date && !item.timestamp) {
          console.warn(`Item at index ${index} has no date or timestamp:`, item);
          return null;
        }
        
        const dateStr = item.date || item.timestamp;
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date at index ${index}:`, dateStr);
          return null;
        }
        
        return {
          ...item,
          date: date.toISOString().split('T')[0],
          pnl: Number(item.pnl) || 0,
          winRate: Number(item.winRate) || 0,
          trades: Number(item.trades) || 0
        };
      }).filter(Boolean);
      
      // Apply moving average if needed
      if (showMovingAverage) {
        return calculateMovingAverage(processed, activeMetric);
      }
      
      // Apply cumulative P&L if needed
      if (isCumulativeView && activeMetric === 'pnl') {
        return calculateCumulativePnl(processed);
      }
      
      return processed;
      
    } catch (error) {
      console.error('Error processing data:', error);
      setDataError('Failed to process chart data');
      return [];
    }
  }, [initialData, timeRange, activeMetric, showMovingAverage, isCumulativeView]);

  // Calculate Y-axis domain for the active metric
  const yDomain = useMemo(() => {
    if (!processedData || processedData.length === 0) return [0, 100];
    
    const values = processedData.map(item => {
      const value = item[activeMetric];
      return typeof value === 'number' ? value : 0;
    });
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(Math.abs(max - min) * 0.1, 1);
    
    return [
      Math.min(min - padding, 0),
      max + padding
    ];
  }, [processedData, activeMetric]);
  
  // Toggle chart type
  const toggleChartType = useCallback(() => {
    const types = Object.values(CHART_TYPES);
    const currentIndex = types.findIndex(type => type.value === chartType);
    const nextIndex = (currentIndex + 1) % types.length;
    setChartType(types[nextIndex].value);
  }, [chartType]);

  // Toggle metric visibility
  const toggleMetric = useCallback((metric) => {
    setActiveMetric(metric);
  }, []);

  // Toggle cumulative view
  const toggleCumulativeView = useCallback(() => {
    setIsCumulativeView(prev => !prev);
  }, []);

  // Toggle moving average
  const toggleMovingAverage = useCallback(() => {
    setShowMovingAverage(prev => !prev);
  }, []);
  
  // Format Y-axis tick based on metric
  const formatYTick = (value) => {
    if (activeMetric === 'winRate') return `${value}%`;
    if (activeMetric === 'pnl') return `$${value.toLocaleString()}`;
    return value.toLocaleString();
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="text-red-500 text-lg font-medium mb-2">Error</div>
      <div className="text-gray-600 dark:text-gray-400">
        {dataError || 'Failed to load chart data'}
      </div>
    </div>
  );

  // Render the appropriate chart based on selected type
  const renderChart = () => {
    if (loading) return renderLoading();
    if (dataError) return renderError();
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No data available</div>
        </div>
      );
    }

    const chartProps = {
      data: processedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const xAxisProps = {
      dataKey: 'date',
      tick: { fontSize: 12 },
      tickFormatter: (value) => format(new Date(value), 'MMM d'),
    };

    const yAxisProps = {
      domain: yDomain,
      tickFormatter: formatYTick,
      tick: { fontSize: 12 },
    };

    const tooltipContent = (
      <ChartTooltip 
        activeMetric={activeMetric}
      />
    );

    const legendContent = showLegend ? (
      <ChartLegend 
        payload={[
          { value: activeMetric, type: 'line', color: '#3b82f6' },
          ...(showMovingAverage ? [{ value: 'Moving Average', type: 'line', color: '#ef4444' }] : []),
        ]}
        onClick={toggleMetric}
        activeMetric={activeMetric}
      />
    ) : null;

    const brush = showBrush ? (
      <Brush 
        dataKey="date" 
        height={30} 
        stroke="#8884d8"
        tickFormatter={(value) => format(new Date(value), 'MMM d')}
      />
    ) : null;

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} />
            {legendContent}
            {brush}
            <Line 
              type="monotone" 
              dataKey={activeMetric} 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            {showMovingAverage && (
              <Line 
                type="monotone" 
                dataKey={`${activeMetric}MA`} 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} />
            {legendContent}
            {brush}
            <Area 
              type="monotone" 
              dataKey={activeMetric} 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorPnl)" 
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} />
            {legendContent}
            {brush}
            <Bar 
              dataKey={activeMetric} 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            >
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry[activeMetric] >= 0 
                      ? '#10b981' // green for positive
                      : '#ef4444' // red for negative
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        );

      default:
        return null;
    }
  };

  // Get current chart type icon
  const getChartTypeIcon = () => {
    const type = CHART_TYPES.find(t => t.value === chartType);
    return type ? type.icon : <LineChartIcon size={16} />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleChartType}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Change chart type"
              >
                {getChartTypeIcon()}
              </button>
              
              {activeMetric === 'pnl' && (
                <button
                  onClick={toggleCumulativeView}
                  className={`p-2 rounded-full ${
                    isCumulativeView 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  title={isCumulativeView ? 'Show individual P&L' : 'Show cumulative P&L'}
                >
                  <TrendingUp size={16} />
                </button>
              )}
              
              <button
                onClick={toggleMovingAverage}
                className={`p-2 rounded-full ${
                  showMovingAverage 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title={showMovingAverage ? 'Hide moving average' : 'Show moving average'}
              >
                <LineChartIcon size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Chart */}
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Time range selector */}
        {showControls && (
          <div className="flex justify-center mt-4 space-x-2">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm rounded-full ${
                  timeRange === range.value
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractivePerformanceChart;
