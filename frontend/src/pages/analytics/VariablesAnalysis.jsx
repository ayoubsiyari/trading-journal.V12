import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  AreaChart,
  ReferenceLine,
  Label,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  BarChart3, 
  X, 
  Filter,
  Calendar,
  Search,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Layers,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  DollarSign,
  Percent,
  Zap,
  Shield,
  Clock,
  Users,
  Gauge,
  Compass,
  Flame,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Minus,
  Plus,
  MoreHorizontal
} from 'lucide-react';

// ─── Format helpers ─────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  if (val == null) return 'N/A';
  
  const num = parseFloat(val);
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(2)}`;
};
const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;
const formatRiskReward = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(2)}:1`;
const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#A28EFF", "#FF6D91", "#82ca9d", "#8884d8",
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#FF9F43", "#10AC84", "#5F27CD", "#00D2D3",
  "#FF3838", "#FF6B35", "#F8B500", "#6C5CE7"
];

// Enhanced Summary Card Component with more visual options
function SummaryCard({ title, value, icon: Icon, trend, color = "blue", subtitle, size = "normal", sparkline }) {
  const sizeClasses = size === "large" ? "p-8" : "p-6";
  const titleSize = size === "large" ? "text-lg" : "text-sm";
  const valueSize = size === "large" ? "text-3xl" : "text-2xl";
  
  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-xl ${sizeClasses} border border-${color}-200 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden`}>
      {sparkline && (
        <div className="absolute top-0 right-0 w-24 h-12 opacity-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="value" stroke={`var(--${color}-600)`} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className={`h-5 w-5 text-${color}-600`} />
            <p className={`${titleSize} font-medium text-${color}-800`}>{title}</p>
          </div>
          <p className={`${valueSize} font-bold text-${color}-900 mb-1`}>{value}</p>
          {subtitle && (
            <p className={`text-xs text-${color}-700 opacity-75`}>{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : 
             trend < 0 ? <TrendingDown className="h-4 w-4" /> : 
             <Minus className="h-4 w-4" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Performance Distribution Chart Component
function PerformanceDistribution({ data, title }) {
  const distributionData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const ranges = [
      { label: 'Loss > -10%', min: -Infinity, max: -10, color: '#EF4444' },
      { label: '-10% to -5%', min: -10, max: -5, color: '#F97316' },
      { label: '-5% to 0%', min: -5, max: 0, color: '#EAB308' },
      { label: '0% to 5%', min: 0, max: 5, color: '#84CC16' },
      { label: '5% to 10%', min: 5, max: 10, color: '#22C55E' },
      { label: 'Gain > 10%', min: 10, max: Infinity, color: '#10B981' }
    ];
    
    return ranges.map(range => {
      const count = data.filter(item => {
        const pnl = item.pnl || 0;
        const pnlPercent = (pnl / Math.abs(pnl)) * 100; // Simplified percentage calculation
        return pnlPercent > range.min && pnlPercent <= range.max;
      }).length;
      
      return {
        name: range.label,
        count,
        percentage: data.length > 0 ? (count / data.length) * 100 : 0,
        fill: range.color
      };
    });
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'count' ? `${value} variables` : `${value.toFixed(1)}%`,
                name === 'count' ? 'Count' : 'Percentage'
              ]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Risk-Return Bubble Chart Component
function RiskReturnBubble({ data, title }) {
  const bubbleData = useMemo(() => {
    return data.map(item => ({
      x: item.avg_rr || 0,
      y: item.win_rate || 0,
      z: item.trades || 1,
      name: item.variable ? item.variable.split(':').pop().trim() : 'Unknown',
      pnl: item.pnl || 0,
      profitFactor: item.profit_factor || 0
    }));
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Activity className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Risk/Reward Ratio"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Win Rate %"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Trades" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'x' ? `${value.toFixed(2)}:1` :
                name === 'y' ? `${value.toFixed(1)}%` :
                name === 'z' ? `${value} trades` : value,
                name === 'x' ? 'Risk/Reward' :
                name === 'y' ? 'Win Rate' :
                name === 'z' ? 'Trade Count' : name
              ]}
              labelFormatter={(label) => `Variable: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Scatter name="Variables" data={bubbleData} fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Performance Radar Chart Component
function PerformanceRadar({ data, title }) {
  const radarData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const topVariables = data
      .filter(v => v.trades >= 3) // Only include variables with sufficient data
      .sort((a, b) => (b.pnl || 0) - (a.pnl || 0))
      .slice(0, 5);
    
    return topVariables.map(variable => {
      // Get variable name (last part after colon if it exists)
      const varName = variable.variable ? 
        variable.variable.split(':').pop().trim() : 'Unknown';
      
      // Calculate metrics with proper scaling
      const winRate = parseFloat(variable.win_rate || 0);
      const avgRR = parseFloat(variable.avg_rr || 0);
      const profitFactor = parseFloat(variable.profit_factor || 0);
      const trades = parseInt(variable.trades || 0);
      const expectancy = parseFloat(variable.expectancy || 0);
      
      return {
        variable: varName,
        'Win Rate %': winRate,
        'Avg R:R': avgRR,
        'Profit Factor': profitFactor,
        'Trades': trades,
        'Expectancy': expectancy,
        // Store original values for tooltip
        _original: {
          winRate,
          avgRR,
          profitFactor,
          trades,
          expectancy
        }
      };
    });
  }, [data]);
  
  // Custom tooltip formatter
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const original = data._original || {};
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <div className="font-semibold text-gray-900 mb-2">{data.variable}</div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Win Rate:</span>
            <span className="font-medium">{original.winRate ? original.winRate.toFixed(1) + '%' : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg R:R:</span>
            <span className="font-medium">{original.avgRR ? original.avgRR.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Profit Factor:</span>
            <span className="font-medium">{original.profitFactor ? original.profitFactor.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Trades:</span>
            <span className="font-medium">{original.trades || '0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expectancy:</span>
            <span className="font-medium">${original.expectancy ? original.expectancy.toFixed(2) : '0.00'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Compass className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            data={radarData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <PolarGrid stroke="#f0f0f0" />
            <PolarAngleAxis 
              dataKey="variable" 
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => 
                value.length > 15 ? `${value.substring(0, 15)}...` : value
              }
            />
            <PolarRadiusAxis 
              angle={90} 
              tick={false}
              axisLine={false}
            />
            <Tooltip content={renderTooltip} />
            {radarData.length > 0 && [
              { key: 'Win Rate %', domain: [0, 100], formatter: (v) => `${v}%` },
              { key: 'Avg R:R', domain: [0, 5], formatter: (v) => v.toFixed(2) },
              { key: 'Profit Factor', domain: [0, 10], formatter: (v) => v.toFixed(2) },
              { key: 'Trades', domain: [0, Math.max(10, ...radarData.map(d => d['Trades']))], formatter: (v) => v },
              { key: 'Expectancy', domain: [
                Math.min(0, ...radarData.map(d => d['Expectancy'])),
                Math.max(0, ...radarData.map(d => d['Expectancy']))
              ], formatter: (v) => `$${v.toFixed(2)}` }
            ].map((metric, index) => (
              <Radar
                key={metric.key}
                name={metric.key}
                dataKey={metric.key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.1}
                strokeWidth={2}
                // Scale each metric to 0-100 for better visualization
                scale={(value) => {
                  const [min, max] = metric.domain;
                  if (min === max) return 50; // Avoid division by zero
                  return ((value - min) / (max - min)) * 100;
                }}
                data={radarData.map(d => ({
                  ...d,
                  [metric.key]: Math.min(100, Math.max(0, 
                    ((d[metric.key] - metric.domain[0]) / 
                     (metric.domain[1] - metric.domain[0])) * 100
                  ))
                }))}
              />
            ))}
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const metric = value.replace(' %', '');
                return (
                  <span className="text-xs text-gray-600">
                    {metric}
                  </span>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Treemap Chart Component for Variable Hierarchy
function VariableTreemap({ data, title }) {
  const treemapData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calculate the absolute max P&L for scaling purposes
    const maxPnl = Math.max(...data.map(item => Math.abs(item.pnl || 0)), 1);
    const minSize = 10; // Minimum size for visibility
    
    return data
      .filter(item => item.trades > 0 && item.pnl !== undefined)
      .map(item => {
        const pnl = parseFloat(item.pnl) || 0;
        const winRate = parseFloat(item.win_rate) || 0;
        const trades = parseInt(item.trades) || 0;
        
        // Calculate size based on P&L relative to max P&L, with a minimum size
        const size = Math.max(minSize, (Math.abs(pnl) / maxPnl) * 100);
        
        // Extract the actual variable name from the _var_mapping if it exists
        let displayName = 'Unknown';
        if (item.variable) {
          if (item.variable.startsWith('var') && item.extra_data?._var_mapping?.[item.variable]) {
            // Use the original CSV header name from _var_mapping
            displayName = item.extra_data._var_mapping[item.variable].name;
          } else {
            // Fall back to the variable name
            displayName = item.variable.split(':').pop().trim();
          }
        }
        
        return {
          name: displayName,
          size: size,
          pnl: pnl,
          trades: trades,
          winRate: winRate,
          fill: pnl >= 0 ? '#10B981' : '#EF4444',
          // Store original values for tooltip
          originalPnl: pnl,
          originalWinRate: winRate,
          // Store the original variable name for reference
          originalVariable: item.variable
        };
      })
      .sort((a, b) => Math.abs(b.originalPnl) - Math.abs(a.originalPnl))
      .slice(0, 15); // Limit to top 15 for better visualization
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Layers className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4/3}
            stroke="#fff"
            fill="#8884d8"
            animationDuration={500}
            isAnimationActive={true}
          >
            {treemapData.map((entry, index) => (
              <Rectangle
                key={`rectangle-${index}`}
                name={entry.name}
                fill={entry.fill}
                stroke="#fff"
                style={{
                  strokeWidth: 1,
                }}
              >
                <text
                  x={0}
                  y={18}
                  textAnchor="start"
                  fill="#000"
                  fontSize={12}
                  style={{
                    pointerEvents: 'none',
                    fontWeight: 500,
                    padding: '0 4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    display: 'inline-block'
                  }}
                >
                  {entry.name}
                </text>
              </Rectangle>
            ))}
            <Tooltip 
              formatter={(value, name, props) => {
                if (name === 'P&L') return formatCurrency(props.payload.originalPnl);
                if (name === 'Win Rate') return `${props.payload.originalWinRate.toFixed(1)}%`;
                if (name === 'Trades') return props.payload.trades;
                return value;
              }}
              labelFormatter={(label) => `Variable: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              itemStyle={{
                margin: '4px 0',
                color: '#1f2937',
                fontSize: '13px',
                fontWeight: 500
              }}
              labelStyle={{
                color: '#111827',
                fontWeight: 600,
                marginBottom: '8px',
                fontSize: '14px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '6px'
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Enhanced Filter Sidebar Component
function FilterSidebar({ 
  showFilters, 
  setShowFilters, 
  availableVariables, 
  combinationFilters, 
  setCombinationFilters,
  activeFilterCount 
}) {
  return (
    <>
      {/* Backdrop */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setShowFilters(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
        showFilters ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Combinations</h3>
            </div>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </div>
          )}
        </div>
        
        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {Object.entries(availableVariables).map(([varName, values]) => (
            <div key={varName} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">{varName}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {values.length} options
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {values.map(value => (
                  <label key={value} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md transition-colors duration-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={combinationFilters[varName]?.includes(value) || false}
                      onChange={() => {
                        setCombinationFilters(prev => {
                          const currentValues = prev[varName] || [];
                          const newValues = currentValues.includes(value)
                            ? currentValues.filter(v => v !== value)
                            : [...currentValues, value];
                          
                          return {
                            ...prev,
                            [varName]: newValues.length ? newValues : undefined
                          };
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 flex-1">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={() => setCombinationFilters({})}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              disabled={activeFilterCount === 0}
            >
              Reset All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VariablesAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');
  const [variableFilter, setVariableFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCols, setShowCols] = useState({ 
    trades: true, 
    win_rate: true, 
    avg_rr: true 
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [apiResponse, setApiResponse] = useState(null);
  const [combinationFilters, setCombinationFilters] = useState({});
  const [availableVariables, setAvailableVariables] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // ─── Combination analysis state ─────────────────────────────────────────────
  const [combinationsData, setCombinationsData] = useState([]);
  const [combinationsLoading, setCombinationsLoading] = useState(false);
  const [combinationLevel, setCombinationLevel] = useState(2);
  const [minTrades, setMinTrades] = useState(3);
  const [combinationStats, setCombinationStats] = useState(null);

  // ─── Fetch variables analysis data ──────────────────────────────────────────
  useEffect(() => {
    const fetchVariablesData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        let url = 'http://localhost:5000/api/journal/variables-analysis';
        
        // Add filters if provided
        const params = new URLSearchParams();
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        if (selectedTimeframe !== 'all') params.append('timeframe', selectedTimeframe);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        console.log('Fetching variables data from:', url);
        
        const res = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('Response status:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', errorText);
          throw new Error(`API Error: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        const json = await res.json();
        console.log('API Response:', json);
        
        // Store full response for debugging
        setApiResponse(json);
        
        // Handle the data structure from API
        if (json && json.variables && Array.isArray(json.variables)) {
          console.log(`Found ${json.variables.length} variables`);
          setData(json.variables);
        } else {
          console.warn('No variables data found in API response');
          setData([]);
        }
        
        setError('');
      } catch (err) {
        console.error('❌ Error in fetchVariablesData:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(`Error: ${err.message}. Please check the console for more details.`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVariablesData();
  }, [fromDate, toDate, selectedTimeframe]);

  // ─── Fetch combinations analysis data ───────────────────────────────────────
  useEffect(() => {
    const fetchCombinationsData = async () => {
      if (activeTab !== 'combinations') return;
      
      try {
        setCombinationsLoading(true);
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/journal/variables-analysis';
        
        // Add filters if provided
        const params = new URLSearchParams();
        params.append('combine_vars', 'true');
        params.append('combination_level', combinationLevel.toString());
        params.append('min_trades', minTrades.toString());
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
        if (selectedTimeframe !== 'all') params.append('timeframe', selectedTimeframe);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch combinations data: ${res.status} ${errorText}`);
        }
        
        const json = await res.json();
        console.log('Combinations API Response:', json);
        
        if (json && Array.isArray(json.combinations)) {
          setCombinationsData(json.combinations);
          setCombinationStats(json.stats_summary);
        } else {
          console.warn('No combinations data found in API response');
          setCombinationsData(json.combinations || []);
          setCombinationStats(json.stats_summary || null);
        }
        
        setError('');
      } catch (err) {
        console.error('❌ Error loading combinations data:', err);
        setError(err.message || 'Error loading combinations data');
        setCombinationsData([]);
        setCombinationStats(null);
      } finally {
        setCombinationsLoading(false);
      }
    };
    
    fetchCombinationsData();
  }, [activeTab, combinationLevel, minTrades, fromDate, toDate, selectedTimeframe]);

  useEffect(() => {
    if (!combinationsData || combinationsData.length === 0) {
      setAvailableVariables({});
      return;
    }
  
    const vars = {};
  
    combinationsData.forEach(combo => {
      const parts = combo.combination.split(' & ');
      parts.forEach(part => {
        const [varName, varValue] = part.split(':').map(s => s.trim());
        if (!vars[varName]) {
          vars[varName] = new Set();
        }
        if (varValue) {
          vars[varName].add(varValue);
        }
      });
    });
  
    // Convert Sets to arrays for rendering
    const processedVars = {};
    Object.keys(vars).forEach(key => {
      processedVars[key] = Array.from(vars[key]);
    });
  
    setAvailableVariables(processedVars);
  }, [combinationsData]);

  // ─── Sorting and filtering helpers ─────────────────────────────────────────
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  const sortIcon = (column) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }
    return null;
  };
  
  // Sort and filter data
  const sortedAndFilteredData = Array.isArray(data) 
    ? [...data]
        .filter(item => 
          item.variable && item.variable.toLowerCase().includes(variableFilter.toLowerCase())
        )
        .sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          
          if (aValue === bValue) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;
          
          const direction = sortDirection === 'asc' ? 1 : -1;
          return aValue > bValue ? direction : -direction;
        })
    : [];

  const filterCombinations = useMemo(() => {
    if (!combinationsData) return [];
    if (Object.keys(combinationFilters).length === 0) {
      return combinationsData;
    }
  
    return combinationsData.filter(combo => {
      const parts = combo.combination.split(' & ');
      const comboVars = {};
      
      parts.forEach(part => {
        const [varName, varValue] = part.split(':').map(s => s.trim());
        if (varName && varValue) {
          comboVars[varName] = varValue;
        }
      });
  
      return Object.entries(combinationFilters).every(([varName, values]) => {
        if (!values || values.length === 0) return true;
        return values.some(value => comboVars[varName] === value);
      });
    });
  }, [combinationsData, combinationFilters]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(combinationFilters).reduce(
      (count, values) => count + (values ? values.length : 0),
      0
    );
  }, [combinationFilters]);
  
  // Helper to render filter pills
  const renderActiveFilters = () => {
    const filters = [];
    
    Object.entries(combinationFilters).forEach(([varName, values]) => {
      if (!values || !values.length) return;
      
      values.forEach(value => {
        filters.push({
          varName,
          value,
          key: `${varName}:${value}`
        });
      });
    });
    
    if (filters.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {filters.map(filter => (
          <span 
            key={filter.key}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
          >
            <span className="font-semibold">{filter.varName}:</span>
            <span className="ml-1">{filter.value}</span>
            <button
              onClick={() => {
                setCombinationFilters(prev => {
                  const currentValues = prev[filter.varName] || [];
                  const newValues = currentValues.filter(v => v !== filter.value);
                  
                  return {
                    ...prev,
                    [filter.varName]: newValues.length ? newValues : undefined
                  };
                });
              }}
              className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-600 hover:text-blue-900 focus:outline-none transition-colors duration-150"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
    );
  };

  // Enhanced summary stats with additional metrics
  const summaryStats = useMemo(() => {
    // Find best combination
    const bestCombination = combinationsData.length > 0
      ? combinationsData.reduce((best, current) => 
          (current.pnl || 0) > (best.pnl || 0) ? current : best, 
          { pnl: 0 }
        )
      : null;

    // If we have combinations data, use the best combination for metrics
    if (bestCombination && bestCombination.pnl !== 0) {
      const drawdown = bestCombination.max_drawdown || 0;
      const avgWinRate = bestCombination.win_rate || 0;
      const profitFactor = bestCombination.profit_factor || 0;
      const expectancy = bestCombination.expectancy || 0;
      
      // Calculate realistic returns for the best combination
      let returns = [];
      
      if (bestCombination.returns?.length > 0) {
        // Use actual returns if available, but cap extreme values
        returns = bestCombination.returns.map(r => {
          // Cap daily returns at ±5% to prevent extreme values
          const capped = Math.max(-0.05, Math.min(0.05, r));
          // Add small random noise to prevent zero std dev
          return capped + (Math.random() * 0.0001 - 0.00005);
        });
      } else if (bestCombination.trades > 0) {
        // Estimate returns based on P&L, but scale down to be more realistic
        const avgReturnPerTrade = (bestCombination.pnl || 0) / bestCombination.trades;
        // Scale down to a more realistic daily return (0.1% to 1% per trade)
        const scaledReturn = Math.sign(avgReturnPerTrade) * 
          Math.min(0.01, Math.max(0.001, Math.abs(avgReturnPerTrade) / 100));
        returns = Array(bestCombination.trades).fill(scaledReturn);
      }
      
      // Calculate average return and standard deviation with bounds
      const avgReturn = returns.length > 0 
        ? returns.reduce((a, b) => a + b, 0) / returns.length 
        : 0;
        
      // Calculate standard deviation with minimum threshold
      let stdDev = 0.01; // Default minimum 1% std dev
      if (returns.length > 1) {
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        stdDev = Math.sqrt(variance);
        // Ensure std dev is never zero and has a reasonable minimum
        stdDev = Math.max(0.005, stdDev);
      }
      
      // Calculate annualized metrics with realistic bounds
      const tradingDaysPerYear = 252;
      const annualRiskFreeRate = 0.05; // 5% annual risk-free rate
      const dailyRiskFreeRate = Math.pow(1 + annualRiskFreeRate, 1/252) - 1; // Convert to daily
      
      // Calculate Sharpe ratio with realistic bounds
      let sharpeRatio = 0;
      if (stdDev > 0) {
        const excessReturn = (avgReturn - dailyRiskFreeRate) * tradingDaysPerYear;
        sharpeRatio = excessReturn / (stdDev * Math.sqrt(tradingDaysPerYear));
        // Cap Sharpe ratio at 5.0 to prevent unrealistic values
        sharpeRatio = Math.min(Math.max(-5, sharpeRatio), 5);
      }

      // Calculate annualized volatility with realistic bounds
      let returnVolatility = stdDev * Math.sqrt(252); // Annualized volatility (daily std dev * sqrt(252))
      // Cap volatility at 200% (2.0) to prevent unrealistic values
      returnVolatility = Math.min(returnVolatility, 2.0);
      const metrics = {
        total_trades: bestCombination.trades || 0,
        total_pnl: bestCombination.pnl || 0,
        avg_win_rate: avgWinRate,
        avg_profit_factor: profitFactor,
        profitableVariables: 1, // Since it's the best single combination
        totalVariables: 1,
        profitablePercentage: avgWinRate,
        bestVariable: {
          variable: bestCombination.combination || 'Best Combination',
          pnl: bestCombination.pnl || 0,
          win_rate: avgWinRate,
          trades: bestCombination.trades || 0
        },
        worstVariable: {
          variable: bestCombination.combination || 'Best Combination',
          pnl: bestCombination.pnl || 0,
          win_rate: avgWinRate,
          trades: bestCombination.trades || 0
        },
        avgExpectancy: expectancy,
        avgMaxDrawdown: drawdown < 0 ? drawdown : -Math.abs(drawdown),
        sharpeRatio,
        returnVolatility,
        consistencyScore: avgWinRate * (profitFactor / 100),
        // Add raw values for debugging
        _metrics: {
          avgReturn,
          stdDev,
          returnsCount: returns.length,
          annualizedVolatility: returnVolatility,
          hasReturns: Array.isArray(bestCombination.returns),
          returnsSample: bestCombination.returns ? bestCombination.returns.slice(0, 3) : 'no returns',
          pnlPerTrade: bestCombination.trades ? (bestCombination.pnl || 0) / bestCombination.trades : 0
        }
      };
      
      // Debug log
      console.log('Best Combination Metrics:', {
        combination: bestCombination.combination,
        trades: bestCombination.trades,
        pnl: bestCombination.pnl,
        returns: {
          hasReturns: Array.isArray(bestCombination.returns),
          count: bestCombination.returns?.length || 0,
          sample: bestCombination.returns?.slice(0, 3) || 'none'
        },
        calculated: {
          avgReturn,
          stdDev,
          returnVolatility,
          isReasonable: returnVolatility < 10
        }
      });
      
      return metrics;
    }

    // Fallback to variable-based metrics if no combinations data
    const baseStats = apiResponse?.stats_summary || {
      total_trades: data.reduce((sum, item) => sum + (item.trades || 0), 0),
      total_pnl: data.reduce((sum, item) => sum + (item.pnl || 0), 0),
      avg_win_rate: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.win_rate || 0), 0) / data.length 
        : 0,
      avg_profit_factor: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.profit_factor || 0), 0) / data.length 
        : 0
    };

    const profitableVariables = data.filter(item => (item.pnl || 0) > 0).length;
    const totalVariables = data.length;
    const profitablePercentage = totalVariables > 0 ? (profitableVariables / totalVariables) * 100 : 0;
    
    const bestVariable = data.reduce((best, current) => 
      (current.pnl || 0) > (best.pnl || 0) ? current : best, 
      { pnl: 0 }
    );
    
    const worstVariable = data.length > 0 
      ? data.reduce((worst, current) => 
          (current.pnl || 0) < (worst.pnl || 0) ? current : worst,
          data[0]
        )
      : { pnl: 0, variable: 'N/A' };

    const avgExpectancy = data.length > 0 
      ? data.reduce((sum, item) => sum + (item.expectancy || 0), 0) / data.length 
      : 0;

    const avgMaxDrawdown = data.length > 0 
      ? data.reduce((sum, item) => {
          const drawdown = item.max_drawdown || 0;
          return sum + (drawdown < 0 ? drawdown : -Math.abs(drawdown));
        }, 0) / data.length 
      : 0;

    const returns = data.map(item => (item.pnl || 0) / (item.risk_amount || 1));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 1 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
      : 0;
    
    const riskFreeRate = 0.02;
    const sharpeRatio = stdDev !== 0 
      ? ((avgReturn - (riskFreeRate / 252)) / stdDev) * Math.sqrt(252)
      : 0;

    return {
      ...baseStats,
      profitableVariables,
      totalVariables,
      profitablePercentage,
      bestVariable,
      worstVariable,
      avgExpectancy,
      avgMaxDrawdown,
      sharpeRatio,
      returnVolatility: stdDev * Math.sqrt(252),
      consistencyScore: profitablePercentage * (baseStats.avg_win_rate / 100)
    };
  }, [data, apiResponse, combinationsData]);
  
  // Chart data preparation
  const chartData = sortedAndFilteredData
    .slice(0, 10) // Limit to top 10 for better visualization
    .map(item => ({
      name: item.variable ? item.variable.split(':').pop().trim() : 'Unknown',
      pnl: item.pnl || 0,
      winRate: item.win_rate || 0,
      trades: item.trades || 0,
      avgRR: item.avg_rr || 0,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading variables analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no data available
  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Variables Analysis</h1>
                <p className="text-gray-600">Analyze performance by trading variables and patterns</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Variables Data Found</h3>
                <div className="text-sm text-yellow-700">
                  <p className="mb-3">No trading variables found in your imported data. To see analysis results:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Import trades with variable columns mapped (Setup, Strategy, etc.)</li>
                    <li>Make sure your CSV contains variable data in the mapped columns</li>
                    <li>Check that trades were imported successfully</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug information */}
          {apiResponse && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h4>
              <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Filter Sidebar */}
      <FilterSidebar 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        availableVariables={availableVariables}
        combinationFilters={combinationFilters}
        setCombinationFilters={setCombinationFilters}
        activeFilterCount={activeFilterCount}
      />

      <div className="p-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Variables Analysis</h1>
                <p className="text-gray-600 mt-1">Comprehensive analysis of trading variables and performance patterns</p>
              </div>
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-0 focus:ring-0 text-sm"
                  placeholder="From"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-0 focus:ring-0 text-sm"
                  placeholder="To"
                />
              </div>
              
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 shadow-sm"
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
              
              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter variables..."
                  value={variableFilter}
                  onChange={(e) => setVariableFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 pr-4 py-2 w-48 shadow-sm"
                />
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-200 shadow-sm transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <SummaryCard
            title="Total Trades"
            value={summaryStats.total_trades?.toLocaleString() || '0'}
            icon={Activity}
            color="blue"
            subtitle={`${summaryStats.totalVariables} variables`}
          />
          <SummaryCard
            title="Total P&L"
            value={formatCurrency(summaryStats.total_pnl)}
            icon={DollarSign}
            color={summaryStats.total_pnl >= 0 ? "green" : "red"}
            subtitle="Net performance"
          />
          <SummaryCard
            title="Win Rate"
            value={formatPercent(summaryStats.avg_win_rate)}
            icon={Target}
            color="purple"
            subtitle="Average across variables"
          />
          <SummaryCard
            title="Profit Factor"
            value={formatNumber(summaryStats.avg_profit_factor)}
            icon={Award}
            color="amber"
            subtitle="Risk-adjusted returns"
          />
          <SummaryCard
            title="Profitable Variables"
            value={`${summaryStats.profitableVariables}/${summaryStats.totalVariables}`}
            icon={CheckCircle}
            color="green"
            subtitle={formatPercent(summaryStats.profitablePercentage)}
          />
          <SummaryCard
            title="Consistency Score"
            value={formatNumber(summaryStats.consistencyScore)}
            icon={Gauge}
            color="indigo"
            subtitle="Performance reliability"
          />
        </div>

        {/* Enhanced Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${activeTab === 'overview' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <Gauge className="h-4 w-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`${activeTab === 'table' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <BarChart2 className="h-4 w-4" />
                <span>Data Table</span>
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`${activeTab === 'charts' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <PieChartIcon className="h-4 w-4" />
                <span>Charts</span>
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`${activeTab === 'advanced' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <Compass className="h-4 w-4" />
                <span>Advanced Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('combinations')}
                className={`${activeTab === 'combinations' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <Target className="h-4 w-4" />
                <span>Combinations</span>
                {combinationsData.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    {combinationsData.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          /* New Overview Tab with Key Insights */
          <div className="space-y-8">
            {/* Top Performers Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Best Performer</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-green-700 font-medium">
                    {summaryStats.bestVariable.variable || 'N/A'}
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(summaryStats.bestVariable.pnl)}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-green-700">
                    <span>Win Rate: {formatPercent(summaryStats.bestVariable.win_rate)}</span>
                    <span>Trades: {summaryStats.bestVariable.trades || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-500 bg-opacity-20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900">Worst Performer</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-red-700 font-medium">
                    {summaryStats.worstVariable.variable || 'N/A'}
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(summaryStats.worstVariable.pnl)}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-red-700">
                    <span>Win Rate: {formatPercent(summaryStats.worstVariable.win_rate)}</span>
                    <span>Trades: {summaryStats.worstVariable.trades || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Best Combination Metrics</h3>
                      {summaryStats.bestVariable && summaryStats.bestVariable.variable && (
                        <div className="text-xs text-blue-600 mt-1">
                          {summaryStats.bestVariable.variable}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Top Performer
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="group relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-blue-700">Avg Expectancy</span>
                        <div className="ml-1 text-blue-400 group-hover:text-blue-600 cursor-help">
                          <Info className="h-3.5 w-3.5" />
                          <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 -ml-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg">
                            Average profit per trade relative to risk. Higher values indicate better risk-adjusted returns.
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {formatCurrency(summaryStats.avgExpectancy)}
                      </span>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm text-blue-700">Avg Drawdown</span>
                        <div className="ml-1 text-blue-400 group-hover:text-blue-600 cursor-help">
                          <Info className="h-3.5 w-3.5" />
                          <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 -ml-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg">
                            Average peak-to-trough decline. Lower (more negative) values indicate larger losses from peak values.
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        summaryStats.avgMaxDrawdown < 0 ? 'text-red-600' : 'text-blue-900'
                      }`}>
                        {formatCurrency(summaryStats.avgMaxDrawdown)}
                      </span>
                    </div>
                  </div>

                  

                  <div className="group relative pt-1 border-t border-blue-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-blue-600">Ann. Volatility</span>
                        <div className="ml-1 text-blue-400 group-hover:text-blue-600 cursor-help">
                          <Info className="h-3 w-3" />
                          <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 -ml-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg">
                            Annualized standard deviation of returns. Measures the dispersion of returns.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-blue-900">
                          {summaryStats.returnVolatility < 10 
                            ? (summaryStats.returnVolatility * 100).toFixed(1) + '%' 
                            : 'N/A'}
                        </span>
                        {summaryStats._metrics && (
                          <div className="text-xs text-gray-500">
                            <div>Based on {summaryStats._metrics.returnsCount} trades</div>
                            {summaryStats.returnVolatility >= 10 && (
                              <div className="text-amber-600">
                                High volatility detected
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Top 10 Variables by P&L</h3>
                  <BarChart2 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'P&L']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="pnl" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Distribution</h3>
                  <PieChartIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Profitable', value: summaryStats.profitableVariables, fill: '#10B981' },
                          { name: 'Unprofitable', value: summaryStats.totalVariables - summaryStats.profitableVariables, fill: '#EF4444' }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        <LabelList dataKey="value" position="center" />
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} variables`, name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'table' ? (
          /* Enhanced Data Table */
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('variable')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Variable</span>
                        {sortIcon('variable')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('trades')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Trades</span>
                        {sortIcon('trades')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('win_rate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Win Rate</span>
                        {sortIcon('win_rate')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('avg_rr')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Avg. R:R</span>
                        {sortIcon('avg_rr')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('pnl')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>P&L</span>
                        {sortIcon('pnl')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('profit_factor')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Profit Factor</span>
                        {sortIcon('profit_factor')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('max_drawdown')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Max Drawdown</span>
                        {sortIcon('max_drawdown')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('expectancy')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Expectancy</span>
                        {sortIcon('expectancy')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.variable || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {item.trades || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatPercent(item.win_rate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatRiskReward(item.avg_rr)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${(item.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.pnl)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {item.profit_factor ? item.profit_factor.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.max_drawdown)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.expectancy)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'charts' ? (
          /* Enhanced Charts */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Variables by P&L</h3>
                <BarChart2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'pnl' ? formatCurrency(value) : value,
                        name === 'pnl' ? 'P&L' : name
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="pnl" fill="#3B82F6" name="P&L" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Win Rate vs Risk/Reward</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid stroke="#f0f0f0" />
                    <XAxis 
                      type="number" 
                      dataKey="avgRR" 
                      name="Avg. Risk/Reward"
                      domain={[0, 'dataMax + 0.5']}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="winRate" 
                      name="Win Rate %"
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'winRate' ? `${value}%` : value,
                        name === 'winRate' ? 'Win Rate' : 'Avg. R:R'
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Scatter name="Variables" data={chartData} fill="#10B981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : activeTab === 'advanced' ? (
          /* New Advanced Analytics Tab */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PerformanceDistribution data={data} title="Performance Distribution" />
              <RiskReturnBubble data={data} title="Risk-Return Analysis" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PerformanceRadar data={data} title="Top 5 Variables Radar" />
              <VariableTreemap data={data} title="Variable Impact Treemap" />
            </div>
          </div>
        ) : (
          /* Enhanced Combinations Analysis */
          <div className="space-y-8">
            {/* Combination Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Combination Settings</h3>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Combination Level
                  </label>
                  <select
                    value={combinationLevel}
                    onChange={(e) => setCombinationLevel(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm"
                  >
                    <option value={2}>Pairs (2 variables)</option>
                    <option value={3}>Trios (3 variables)</option>
                    <option value={4}>Quads (4 variables)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Trades
                  </label>
                  <select
                    value={minTrades}
                    onChange={(e) => setMinTrades(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm"
                  >
                    <option value={1}>1+ trades</option>
                    <option value={3}>3+ trades</option>
                    <option value={5}>5+ trades</option>
                    <option value={10}>10+ trades</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex items-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 shadow-sm w-full justify-center"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter Combinations</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      const event = new Event('refresh-combinations');
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-200 shadow-sm hover:shadow-md w-full justify-center"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Analysis</span>
                  </button>
                </div>
              </div>
            </div>

            {combinationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                  <span className="text-gray-600 font-medium">Analyzing combinations...</span>
                </div>
              </div>
            ) : combinationsData.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">No Combinations Found</h3>
                    <div className="text-sm text-yellow-700">
                      <p className="mb-3">No variable combinations found with the current filters. Try:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Reducing the minimum trades requirement</li>
                        <li>Changing the combination level</li>
                        <li>Adjusting the date range</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Active Filters */}
                {activeFilterCount > 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H4a1 1 0 01-.8-1.6L5.75 8 3.2 4.6A1 1 0 013 3zm4 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-blue-700 font-medium">
                          Showing {filterCombinations.length} of {combinationsData.length} combinations matching {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                        </p>
                        {renderActiveFilters()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Best Combinations Summary */}
                {combinationStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {combinationStats.best_by_pnl && (
                      <SummaryCard
                        title="Best by P&L"
                        value={formatCurrency(combinationStats.best_by_pnl.pnl)}
                        icon={Award}
                        color="green"
                        subtitle={combinationStats.best_by_pnl.combination}
                        size="large"
                      />
                    )}
                    
                    {combinationStats.best_by_win_rate && (
                      <SummaryCard
                        title="Best Win Rate"
                        value={formatPercent(combinationStats.best_by_win_rate.win_rate)}
                        icon={TrendingUp}
                        color="blue"
                        subtitle={combinationStats.best_by_win_rate.combination}
                        size="large"
                      />
                    )}
                    
                    {combinationStats.best_by_profit_factor && (
                      <SummaryCard
                        title="Best Profit Factor"
                        value={combinationStats.best_by_profit_factor.profit_factor?.toFixed(2) || 'N/A'}
                        icon={BarChart3}
                        color="purple"
                        subtitle={combinationStats.best_by_profit_factor.combination}
                        size="large"
                      />
                    )}
                  </div>
                )}

                {/* Combination Performance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-4 col-span-full">
                    <SummaryCard
                      title="Total Combinations"
                      value={combinationsData.length.toLocaleString()}
                      icon={Layers}
                      color="blue"
                      subtitle="Analyzed patterns"
                    />
                    <SummaryCard
                      title="Total Trades"
                      value={combinationsData.reduce((sum, c) => sum + c.trades, 0).toLocaleString()}
                      icon={Activity}
                      color="green"
                      subtitle="Across all combinations"
                    />
                  </div>

                  {/* Top Combinations by P&L Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Top Combinations by P&L</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Top 10 of {combinationsData.length}
                        </span>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[...combinationsData]
                            .sort((a, b) => b.pnl - a.pnl)
                            .slice(0, 10)
                            .map(combo => ({
                              name: combo.combination.length > 25 ? 
                                combo.combination.substring(0, 25) + '...' : 
                                combo.combination,
                              pnl: combo.pnl,
                              trades: combo.trades,
                              winRate: combo.win_rate,
                            }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={140}
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 13, fontWeight: 500 }}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                  <div className="font-semibold text-gray-900 mb-2">
                                    {data.name}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">P&L:</span>
                                      <span className={`font-medium ${
                                        data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {formatCurrency(data.pnl)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Trades:</span>
                                      <span className="font-medium">{data.trades}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Win Rate:</span>
                                      <span className="font-medium">
                                        {data.winRate ? (data.winRate ).toFixed(1) + '%' : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                            {combinationsData
                              .sort((a, b) => b.pnl - a.pnl)
                              .slice(0, 10)
                              .map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} 
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Win Rate vs P&L Scatter Plot */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Win Rate vs P&L</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {combinationsData.length} combinations
                        </span>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          data={combinationsData.map(combo => ({
                            // win_rate is already a decimal between 0-1 from the backend
                            winRate: combo.win_rate,
                            pnl: combo.pnl,
                            trades: combo.trades,
                            combination: combo.combination
                          }))}
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            dataKey="winRate" 
                            name="Win Rate %"
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="pnl" 
                            name="P&L"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                  <div className="font-semibold text-gray-900 mb-2">
                                    {data.combination}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Win Rate:</span>
                                      <span className="font-medium">{data.winRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">P&L:</span>
                                      <span className={`font-medium ${
                                        data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {formatCurrency(data.pnl)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Trades:</span>
                                      <span className="font-medium">{data.trades}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Scatter name="Combinations" fill="#3B82F6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Combinations Table */}
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">All Combinations</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filterCombinations.length} of {combinationsData.length} combinations
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Combination
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Trades
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Win Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            P&L
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Avg R:R
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Profit Factor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filterCombinations
                          .sort((a, b) => b.pnl - a.pnl)
                          .slice(0, 50) // Limit to top 50 for performance
                          .map((combo, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {combo.combination}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {combo.trades}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatPercent(combo.win_rate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-semibold ${combo.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(combo.pnl)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatRiskReward(combo.avg_rr)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {combo.profit_factor ? combo.profit_factor.toFixed(2) : 'N/A'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filterCombinations.length > 50 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        Showing top 50 results. Use filters to narrow down the results.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

