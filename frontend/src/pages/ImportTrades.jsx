import React, { useState, useCallback, useMemo } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Settings,
  BarChart3,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Database,
  Zap,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  DollarSign,
  ChevronDown,
  Check,
  Zap as Lightning,
  Cpu,
  Box,
  Database as MetaTrader,
  Server as CTrader,
  HardDrive as NinjaTrader,
  Monitor as TradingView,
  File as Custom,
} from "lucide-react";

// Platform configurations with their default column mappings
const PLATFORM_PROFILES = {
  metatrader: {
    name: "MetaTrader 4/5",
    icon: MetaTrader,
    description: "Standard MetaTrader 4/5 statement export",
    mapping: {
      symbol: "Symbol",
      direction: "Type",
      date: "Open Time",
      time: "Open Time",
      pnl: "Profit",
      rr: "R:R",
      stop_loss: "S/L",
      take_profit: "T/P",
    },
  },
  ctrader: {
    name: "cTrader",
    icon: CTrader,
    description: "cTrader account statement export",
    mapping: {
      symbol: "Symbol",
      direction: "Direction",
      date: "Open Time",
      time: "Open Time",
      pnl: "Profit",
      rr: "Risk/Reward",
      stop_loss: "Stop Loss",
      take_profit: "Take Profit",
    },
  },
  ninjatrader: {
    name: "NinjaTrader",
    icon: NinjaTrader,
    description: "NinjaTrader trade history export",
    mapping: {
      symbol: "Instrument",
      direction: "Action",
      date: "Date",
      time: "Time",
      pnl: "P&L",
      stop_loss: "Stop price",
      take_profit: "Limit price",
    },
  },
  tradingview: {
    name: "TradingView",
    icon: TradingView,
    description: "TradingView strategy tester export",
    mapping: {
      symbol: "Ticker",
      direction: "Action",
      date: "Date",
      pnl: "Profit",
      stop_loss: "Stop Loss",
      take_profit: "Take Profit",
    },
  },
  custom: {
    name: "Custom",
    icon: Custom,
    description: "Set up your own column mappings with direct PnL values",
    mapping: {
      symbol: "",
      direction: "",
      date: "",
      time: "",
      pnl: "",
      entry_price: "",
      exit_price: "",
      rr: "",
      stop_loss: "",
      take_profit: "",
    },
  },
};

// Platform selector component
const PlatformSelector = ({ selectedPlatform, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = selectedPlatform ? PLATFORM_PROFILES[selectedPlatform].icon : Box;
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedPlatform ? (
            <>
              <Icon className="w-5 h-5 mr-3 text-blue-600" />
              <span className="font-medium">{PLATFORM_PROFILES[selectedPlatform].name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {PLATFORM_PROFILES[selectedPlatform].description}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Select platform...</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-auto">
          {Object.entries(PLATFORM_PROFILES).map(([key, platform]) => {
            const PlatformIcon = platform.icon;
            return (
              <button
                key={key}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 ${selectedPlatform === key ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  onSelect(key);
                  setIsOpen(false);
                }}
              >
                <PlatformIcon className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-xs text-gray-500">{platform.description}</div>
                </div>
                {selectedPlatform === key && (
                  <Check className="w-5 h-5 ml-auto text-green-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SummaryMetrics = ({ stats }) => {
  const metrics = [
    {
      label: "Total Trades",
      value: stats.total_trades,
      icon: BarChart3,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      label: "Total P&L",
      value: `$${stats.total_pnl.toFixed(2)}`,
      icon: DollarSign,
      color: stats.total_pnl >= 0 ? "bg-green-500" : "bg-red-500",
      change: stats.total_pnl >= 0 ? "+8.2%" : "-3.1%",
    },
    {
      label: "Win Rate",
      value: `${stats.win_rate.toFixed(1)}%`,
      icon: Target,
      color: "bg-purple-500",
      change: "+2.1%",
    },
    {
      label: "Avg P&L",
      value: `$${stats.avg_pnl.toFixed(2)}`,
      icon: TrendingUp,
      color: stats.avg_pnl >= 0 ? "bg-emerald-500" : "bg-orange-500",
      change: "+5.7%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`${metric.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {metric.change}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ImportTrades() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [mapping, setMapping] = useState({
    symbol: "",
    direction: "",
    date: "",
    time: "",
    pnl: "",
    entry_price: "",
    exit_price: "",
    rr: "",
    stop_loss: "",
    take_profit: "",
    // ten custom variables
    var1: "",
    var2: "",
    var3: "",
    var4: "",
    var5: "",
    var6: "",
    var7: "",
    var8: "",
    var9: "",
    var10: "",
  });
  const [csvFileName, setCsvFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const fieldLabels = {
    symbol: {
      label: "Symbol",
      icon: FileText,
      description: "Trading symbol (e.g., AAPL, TSLA)",
      required: true,
    },
    direction: {
      label: "Direction",
      icon: TrendingUp,
      description: "Buy/Sell or Long/Short",
      required: true,
    },
    date: {
      label: "Date",
      icon: Calendar,
      description: "Trade execution date (required)",
      required: true,
    },
    time: {
      label: "Time",
      icon: Clock,
      description: "Trade execution time (optional, for more accurate analysis)",
      required: false,
    },
    pnl: {
      label: "PnL",
      icon: DollarSign,
      description: "Profit and Loss amount (required for custom imports)",
      required: true,
    },
    entry_price: {
      label: "Entry Price",
      icon: DollarSign,
      description: "Entry price of the trade (optional)",
      required: false,
    },
    exit_price: {
      label: "Exit Price",
      icon: DollarSign,
      description: "Exit price of the trade (optional)",
      required: false,
    },
    quantity: {
      label: "Quantity",
      icon: Box,
      description: "Number of units/shares/contracts (optional for custom imports)",
      required: false,
    },
    rr: {
      label: "Risk/Reward",
      icon: Target,
      description: "Risk to reward ratio (optional)",
      required: false,
    },
    stop_loss: {
      label: "Stop Loss",
      icon: Target,
      description: "Stop loss price level",
      required: false,
    },
    take_profit: {
      label: "Take Profit",
      icon: Target,
      description: "Take profit price level",
      required: false,
    },
    var1: {
      label: "Variable 1",
      icon: Settings,
      description: "Your custom metric #1",
      required: false,

    },
    var2: {
      label: "Variable 2",
      icon: Settings,
      description: "Your custom metric #2",
      required: false,

    },
    var3: {
      label: "Variable 3",
      icon: Settings,
      description: "Your custom metric #3",
      required: false,

    },
    var4: {
      label: "Variable 4",
      icon: Settings,
      description: "Your custom metric #4",
      required: false,

    },
    var5: {
      label: "Variable 5",
      icon: Settings,
      description: "Your custom metric #5",
      required: false,

    },
    var6: {
      label: "Variable 6",
      icon: Settings,
      description: "Your custom metric #6",
      required: false,

    },
    var7: {
      label: "Variable 7",
      icon: Settings,
      description: "Your custom metric #7",
      required: false,

    },
    var8: {
      label: "Variable 8",
      icon: Settings,
      description: "Your custom metric #8",
      required: false,

    },
    var9: {
      label: "Variable 9",
      icon: Settings,
      description: "Your custom metric #9",
      required: false,

    },
    var10: {
      label: "Variable 10",
      icon: Settings,
      description: "Your custom metric #10",
      required: false,
    },
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Apply platform mapping to the current headers
  const applyPlatformMapping = (platformId) => {
    if (platformId === 'custom' || !platformId) {
      // Reset to empty mappings for custom
      setMapping({
        symbol: "",
        direction: "",
        date: "",
        time: "",
        pnl: "",
        entry_price: "",
        exit_price: "",
        rr: "",
        stop_loss: "",
        take_profit: "",
        var1: "",
        var2: "",
        var3: "",
        var4: "",
        var5: "",
        var6: "",
        var7: "",
        var8: "",
        var9: "",
        var10: "",
      });
      return;
    }

    const profile = PLATFORM_PROFILES[platformId];
    if (!profile) return;

    // Create a new mapping based on the profile
    const newMapping = {};
    
    // For each field in the profile's mapping, try to find a matching header
    Object.entries(profile.mapping).forEach(([field, profileHeader]) => {
      // Try to find a header that matches the profile's expected header
      const matchingHeader = headers.find(header => 
        header.toLowerCase().includes(profileHeader.toLowerCase()) ||
        profileHeader.toLowerCase().includes(header.toLowerCase())
      );
      
      if (matchingHeader) {
        newMapping[field] = matchingHeader;
      } else {
        // If no match found, leave it empty
        newMapping[field] = "";
      }
    });

    // Update the mapping state
    setMapping(prev => ({
      ...prev,
      ...newMapping,
    }));
  };

  const handlePlatformSelect = (platformId) => {
    setSelectedPlatform(platformId);
    if (headers.length > 0) {
      // If we already have headers, apply the mapping immediately
      applyPlatformMapping(platformId);
    }
  };

  const handleFile = (file) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }
    setError("");
    setAnalysis(null);
    setValidationErrors([]);
    setCsvFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);
        if (!results || !results.data || results.data.length === 0) {
          setError("No data found in CSV file.");
          return;
        }
        const fileHeaders = Object.keys(results.data[0]);
        setCsvData(results.data);
        setHeaders(fileHeaders);
        
        // If we have a platform selected, try to apply its mapping
        if (selectedPlatform) {
          applyPlatformMapping(selectedPlatform);
        }
        
        setStep(2);
      },
      error: (err) => {
        setLoading(false);
        console.error("CSV parse error:", err);
        setError("Failed to parse CSV file. Please check the format.");
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const validateMapping = () => {
    const errors = [];
    const required = ["symbol", "direction", "date", "pnl"];
    for (let req of required) {
      if (!mapping[req]) {
        errors.push(`${fieldLabels[req]?.label || req} mapping is required`);
      }
    }
    // no need to require var1..10
    // check duplicates
    const mapped = Object.values(mapping).filter(Boolean);
    if (mapped.length !== [...new Set(mapped)].length) {
      errors.push("Each column can only be mapped once");
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleLiveAnalysis = () => {
    if (!validateMapping()) return;
    const trades = buildMappedTrades();
    if (!trades.length) {
      setError("No trades after mapping.");
      return;
    }
    const total_pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const win_rate =
      (trades.filter((t) => t.pnl > 0).length / trades.length) * 100;
    const avg_pnl = trades.length > 0 ? total_pnl / trades.length : 0;
    setSummaryStats({
      total_trades: trades.length,
      total_pnl,
      win_rate,
      avg_pnl,
    });
    setStep(3);
  };

  const parseDateTime = (dateStr, timeStr = null) => {
    if (!dateStr) return null;
    
    // Try to parse the date string
    let date = new Date(dateStr);
    
    // If we have a time string, try to parse it and combine with date
    if (timeStr) {
      const timeParts = String(timeStr).split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, seconds, 0);
        }
      }
    }
    
    // If date is still invalid, try parsing common date formats
    if (isNaN(date.getTime())) {
      // Try ISO format (2023-01-01)
      const isoMatch = String(dateStr).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (isoMatch) {
        date = new Date(isoMatch[1], isoMatch[2] - 1, isoMatch[3]);
      } 
      // Try US format (MM/DD/YYYY)
      const usMatch = String(dateStr).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (usMatch) {
        date = new Date(usMatch[3], usMatch[1] - 1, usMatch[2]);
      }
      // Try European format (DD/MM/YYYY)
      const euMatch = String(dateStr).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (euMatch && (!usMatch || euMatch[0] !== usMatch[0])) {
        date = new Date(euMatch[3], euMatch[2] - 1, euMatch[1]);
      }
    }
    
    return isNaN(date.getTime()) ? null : date;
  };

  const buildMappedTrades = () => {
    return csvData.map((row, index) => {
      // Generate a temporary ID if not provided
      const tempId = `imported-${Date.now()}-${index}`;
      const now = new Date().toISOString();
      
      // Extract and clean basic fields
      const rawSymbol = (row[mapping.symbol] || "").toString().trim().toUpperCase();
      const rawDirection = (row[mapping.direction] || "").toString().toLowerCase();
      const rawDate = row[mapping.date] || "";
      const rawTime = mapping.time ? (row[mapping.time] || "") : "";
      
      // Parse numeric fields with proper error handling
      const parseNumber = (value, defaultValue = 0) => {
        if (value === undefined || value === null || value === '') return defaultValue;
        if (typeof value === 'string') {
          value = value.replace(/[^0-9.-]/g, '');
        }
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
      };
      
      // Parse direction (default to long if not specified)
      let direction = "long";
      if (rawDirection.includes("sell") || rawDirection === "short") {
        direction = "short";
      }
      
      // Parse date and time with better error handling
      let tradeDate = new Date();
      let hour = tradeDate.getHours();
      let entryDate = null;
      let exitDate = null;
      
      try {
        // First try to parse the date from the CSV
        if (rawDate) {
          // Try parsing with time if available
          const dateTimeStr = rawTime ? `${rawDate} ${rawTime}` : rawDate;
          tradeDate = new Date(dateTimeStr);
          
          // If parsing failed, try different date formats
          if (isNaN(tradeDate.getTime())) {
            // Try ISO format (2023-01-01)
            tradeDate = new Date(dateTimeStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
            
            if (isNaN(tradeDate.getTime())) {
              // Try another common format (MM/DD/YYYY)
              const parts = dateTimeStr.split(/[\/\s:]/);
              if (parts.length >= 3) {
                tradeDate = new Date(parts[2], parts[0] - 1, parts[1] || 1);
              }
            }
          }
          
          // If we still don't have a valid date, use current date as fallback
          if (isNaN(tradeDate.getTime())) {
            console.warn(`Could not parse date: ${dateTimeStr}, using current date`);
            tradeDate = new Date();
          }
          
          hour = tradeDate.getHours();
        }
        
        // Set entry and exit dates (same as trade date if not specified)
        entryDate = tradeDate;
        exitDate = tradeDate;
        
      } catch (e) {
        console.error("Error parsing date:", e);
        // Fallback to current date
        tradeDate = new Date();
        entryDate = new Date();
        exitDate = new Date();
        hour = tradeDate.getHours();
      }

      // Format dates for storage
      const formatDateForBackend = (date) => {
        if (!date || isNaN(date.getTime())) return new Date().toISOString();
        return date.toISOString();
      };
      
      const formattedDate = formatDateForBackend(tradeDate);
      const formattedEntryDate = formatDateForBackend(entryDate);
      const formattedExitDate = formatDateForBackend(exitDate);

      // Parse trade values with fallbacks - ensure we're using the mapped column values
      const getValue = (key, fallbackKey = null) => {
        // First try the mapped column, then try the fallback key, then try the raw row
        if (mapping[key] && row[mapping[key]] !== undefined && row[mapping[key]] !== '') {
          return row[mapping[key]];
        }
        if (fallbackKey && row[fallbackKey] !== undefined && row[fallbackKey] !== '') {
          return row[fallbackKey];
        }
        return row[key] || '';
      };

      // Parse numbers with better handling of different formats
      const parsePrice = (value) => {
        if (value === undefined || value === null || value === '') return null;
        // Remove any non-numeric characters except decimal point and minus
        const numStr = String(value).replace(/[^0-9.-]/g, '');
        const num = parseFloat(numStr);
        return isNaN(num) ? null : num;
      };

      // Get and parse the values
      const entryPrice = parsePrice(getValue('entry_price', 'entry price'));
      const exitPrice = parsePrice(getValue('exit_price', 'exit price'));
      const quantity = parseNumber(getValue('quantity', 'size') || '1');
      const stopLoss = parsePrice(getValue('stop_loss', 'stop loss'));
      const takeProfit = parsePrice(getValue('take_profit', 'take profit'));
      
      console.log('Parsed prices:', { entryPrice, exitPrice, stopLoss, takeProfit, row });
      
      // Calculate PnL if not provided
      let pnl = parseNumber(row[mapping.pnl] || row.pnl);
      if (!pnl && !isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(quantity)) {
        pnl = direction === 'long' 
          ? (exitPrice - entryPrice) * quantity 
          : (entryPrice - exitPrice) * quantity;
      }
      
      // Calculate R:R if not provided
      let rr = parseNumber(row[mapping.rr] || row.rr);
      if ((!rr || isNaN(rr)) && !isNaN(stopLoss) && !isNaN(takeProfit) && !isNaN(entryPrice)) {
        const risk = direction === 'long' 
          ? entryPrice - stopLoss 
          : stopLoss - entryPrice;
        const reward = direction === 'long'
          ? takeProfit - entryPrice
          : entryPrice - takeProfit;
        rr = risk !== 0 ? Math.abs(reward / risk) : 0;
      }

      // Extract custom variables using original CSV header names
      const extra_data = {};
      const customVars = {};
      
      // Track all mapped custom variables (var1-var10)
      for (let i = 1; i <= 10; i++) {
        const varKey = `var${i}`;
        if (mapping[varKey] && row[mapping[varKey]] !== undefined) {
          // Store with original header name
          const headerName = mapping[varKey];
          extra_data[headerName] = row[headerName];
          
          // Also store in a structured way for backward compatibility
          customVars[varKey] = {
            name: headerName,
            value: row[headerName]
          };
        }
      }
      
      // Store the mapping of var1-var10 to their original names
      extra_data['_var_mapping'] = customVars;
      
      // Add hour to extra_data if available
      if (hour !== null) {
        extra_data['trade_hour'] = hour;
      }

      // Build the trade object with all required fields matching Journal.jsx structure
      const tradeObj = {
        // Core trade identification
        id: tempId,  // Temporary ID for imported trades
        symbol: rawSymbol,
        direction: direction === 'long' ? 'long' : 'short',
        
        // Price and quantity
        entry_price: entryPrice,
        exit_price: exitPrice,
        stop_loss: !isNaN(stopLoss) ? stopLoss : null,
        take_profit: !isNaN(takeProfit) ? takeProfit : null,
        quantity: quantity,
        
        // Dates and times - ensure all date fields are properly set
        date: formattedDate.split('T')[0],
        entry_date: formattedEntryDate,
        exit_date: formattedExitDate,
        time: tradeDate ? tradeDate.toTimeString().split(' ')[0] : '00:00:00',
        created_at: now,
        updated_at: now,
        
        // Financials
        pnl: parseFloat(pnl.toFixed(8)),
        rr: parseFloat(Math.max(0, rr).toFixed(8)), // Ensure non-negative RR
        risk_amount: 0, // Will be calculated on the backend
        
        // Instrument and strategy
        instrument_type: 'crypto',
        strategy: extra_data.strategy || null,
        setup: extra_data.setup || null,
        notes: extra_data.notes || null,
        
        // Additional fields
        status: 'closed',
        contract_size: extra_data.contract_size ? parseNumber(extra_data.contract_size) : null,
        
        // Extended data with original CSV headers
        extra_data: extra_data,
        
        // Backward compatibility fields
        commission: parseNumber(extra_data.commission || 0),
        swap: parseNumber(extra_data.swap || 0)
      };
      
      // Log the trade object for debugging
      if (index < 3) { // Only log first few trades to avoid console spam
        console.log(`Trade ${index} data:`, JSON.stringify(tradeObj, null, 2));
      }
      
      return tradeObj;
    });
  };

  const handleSaveToDatabase = async () => {
    if (!validateMapping()) return;
    setError("");
    setAnalysis(null);
    setLoading(true);

    try {
      const tradesToImport = buildMappedTrades();
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        navigate('/login');
        return;
      }

      // Log the first few trades for debugging
      console.log('First few trades before transformation:', tradesToImport.slice(0, 3));
      
      // Transform trades to match the structure expected by the backend (same as Journal.jsx)
      const transformedTrades = tradesToImport.map((trade, index) => {
        const transformed = {
          symbol: String(trade.symbol || '').toUpperCase(),
          direction: trade.direction === 'long' ? 'long' : 'short',
          entry_price: trade.entry_price !== null && !isNaN(trade.entry_price) ? parseFloat(trade.entry_price) : null,
          exit_price: trade.exit_price !== null && !isNaN(trade.exit_price) ? parseFloat(trade.exit_price) : null,
          stop_loss: trade.stop_loss !== null && !isNaN(trade.stop_loss) ? parseFloat(trade.stop_loss) : null,
          take_profit: trade.take_profit !== null && !isNaN(trade.take_profit) ? parseFloat(trade.take_profit) : null,
          quantity: parseFloat(trade.quantity) || 1,
          instrument_type: trade.instrument_type || 'crypto',
          contract_size: trade.contract_size ? parseFloat(trade.contract_size) : null,
          risk_amount: parseFloat(trade.risk_amount) || 0,
          pnl: parseFloat(trade.pnl) || 0,
          rr: parseFloat(trade.rr) || 0,
          strategy: trade.strategy || null,
          setup: trade.setup || null,
          notes: trade.notes || null,
          // Include dates
          ...(trade.entry_date && { entry_date: trade.entry_date }),
          ...(trade.exit_date && { exit_date: trade.exit_date }),
          // Include any additional fields that might be needed
          ...(trade.date && { date: trade.date }),
          ...(trade.time && { time: trade.time }),
          ...(trade.commission && { commission: parseFloat(trade.commission) }),
          ...(trade.swap && { swap: parseFloat(trade.swap) }),
          extra_data: {
            ...(trade.extra_data || {}),
            // Ensure all custom variables are included
            var1: trade.var1 || trade.extra_data?.var1 || null,
            var2: trade.var2 || trade.extra_data?.var2 || null,
            var3: trade.var3 || trade.extra_data?.var3 || null,
            var4: trade.var4 || trade.extra_data?.var4 || null,
            var5: trade.var5 || trade.extra_data?.var5 || null,
            var6: trade.var6 || trade.extra_data?.var6 || null,
            var7: trade.var7 || trade.extra_data?.var7 || null,
            var8: trade.var8 || trade.extra_data?.var8 || null,
            var9: trade.var9 || trade.extra_data?.var9 || null,
            var10: trade.var10 || trade.extra_data?.var10 || null,
          }
        };
        
        // Log the first few transformed trades for debugging
        if (index < 3) {
          console.log(`Transformed trade ${index}:`, JSON.stringify(transformed, null, 2));
        }
        
        return transformed;
      });
      

      const payload = {
        filename: csvFileName,
        trades: transformedTrades,
      };
      
      const res = await fetch("http://localhost:5000/api/journal/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          navigate('/login');
        } else {
          const bodyErr = await res.json().catch(() => ({}));
          setError(bodyErr.error || `Server responded with status ${res.status}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Update UI to show success
      setStep(4);
      setAnalysis({
        totalTrades: data.inserted_count || transformedTrades.length,
        totalPnL: transformedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        winRate: transformedTrades.length > 0 
          ? (transformedTrades.filter(t => (t.pnl || 0) > 0).length / transformedTrades.length) * 100
          : 0,
        avgRR: transformedTrades.length > 0
          ? transformedTrades.reduce((sum, t) => sum + (t.rr || 0), 0) / transformedTrades.length
          : 0,
      });
      
      // Show success message and reset form after a delay
      setSuccess(`${data.inserted_count || transformedTrades.length} trades imported successfully!`);
      
    } catch (err) {
      console.error("Error importing trades:", err);
      setError(err.message || "Failed to import trades. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  

  

  const getColumnPreview = (col) => {
    if (!csvData.length || !col) return [];
    return [
      ...new Set(
        csvData
          .map((r) => r[col])
          .filter((v) => v != null && String(v).trim() !== "")
      ),
    ].slice(0, 5);
  };

  const renderMappingCard = (fieldName) => {
    const field = fieldLabels[fieldName];
    const Icon = field.icon;
    const sel = mapping[fieldName];
    const preview = getColumnPreview(sel);
    
    // Skip rendering if this is a platform-specific field that's not in the current platform's mapping
    if (selectedPlatform && selectedPlatform !== 'custom') {
      const profile = PLATFORM_PROFILES[selectedPlatform];
      if (profile && !(fieldName in profile.mapping) && fieldName.startsWith('var')) {
        return null; // Skip custom variables not in the platform's mapping
      }
    }
    return (
      <div
        key={fieldName}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start space-x-4">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
             <label className="block text-lg font-semibold text-gray-900 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            <p className="text-sm text-gray-600 mb-3">
              {field.description}
            </p>
            <select
              value={sel}
              onChange={(e) =>
                setMapping((p) => ({ ...p, [fieldName]: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Select column…</option>
              {headers.map((col) => {
                const vals = getColumnPreview(col);
                const suffix = vals.length
                  ? ` (e.g. ${vals.slice(0, 2).join(", ")}${
                      vals.length > 2 ? "…" : ""
                    })`
                  : "";
                return (
                  <option key={col} value={col}>
                    {col}
                    {suffix}
                  </option>
                );
              })}
            </select>
            {sel && preview.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Sample values:
                </p>
                <div className="flex flex-wrap gap-1">
                  {preview.map((v, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                    >
                      {String(v).length > 15
                        ? `${String(v).substr(0, 15)}…`
                        : String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewTable = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-indigo-600" />
          Data Preview
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          First 3 rows of your mapped data
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                R:R
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {csvData.slice(0, 3).map((row, idx) => {
              const rawSymbol = row[mapping.symbol] || "";
              const rawDir = row[mapping.direction] || "";
              const dirTrim = rawDir.toString().trim().toLowerCase();
              const previewDir =
                dirTrim.startsWith("b") || dirTrim.startsWith("l")
                  ? "long"
                  : "short";
              const dateVal = row[mapping.date] || "";
              const pnlVal =
                parseFloat(
                  row[mapping.pnl]
                    ?.toString()
                    .replace(/[\$,]/g, "")
                    .trim()
                ) || 0;
              const rrVal =
                parseFloat(
                  row[mapping.rr]
                    ?.toString()
                    .replace(/[%]/g, "")
                    .trim()
                ) || 0;
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {String(rawSymbol).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        previewDir === "long"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {previewDir}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dateVal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={pnlVal >= 0 ? "text-green-600" : "text-red-600"}
                    >
                      ${pnlVal.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rrVal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // … Steps 1–4 UI remains exactly as before, no changes below …
  // (omitted for brevity, same as your existing code)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Import Trades
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Upload your trading history to analyze your performance
          </p>
          
          {step === 1 && (
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Select your trading platform</h3>
              <p className="text-sm text-gray-500 mb-4">
                Choose your platform to automatically map the columns from your export file
              </p>
              <PlatformSelector 
                selectedPlatform={selectedPlatform}
                onSelect={handlePlatformSelect}
              />
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-20 mt-2">
            <span className="text-sm text-gray-600">Upload</span>
            <span className="text-sm text-gray-600">Map</span>
            <span className="text-sm text-gray-600">Analyze</span>
            <span className="text-sm text-gray-600">Import</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
            <div className="flex-1">{error}</div>
            <button 
              onClick={() => setError("")}
              className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
            <div className="flex-1">{success}</div>
            <button 
              onClick={() => setSuccess("")}
              className="ml-4 flex-shrink-0 text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Validation Issues</h3>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 transition-colors">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`${dragActive ? 'border-indigo-500 bg-indigo-50' : ''} transition-all duration-200`}
            >
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload your CSV file</h3>
              <p className="text-gray-600 mb-6">Drag and drop your file here, or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && csvData.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Your Columns</h2>
              <p className="text-gray-600">Match your CSV columns to the required trade fields</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "symbol",
                "direction",
                "date",
                "time",
                "pnl",
                ...(selectedPlatform !== 'custom' ? [
                  "entry_price",
                  "exit_price",
                  "quantity"
                ] : []),
                "rr",
                "stop_loss",
                "take_profit",
                ...(selectedPlatform === 'custom' ? 
                  Array(10).fill().map((_, i) => `var${i + 1}`) : []
                ),
              ].map((field) => {
                // Skip rendering if field is not in fieldLabels (like pnl which we removed)
                if (!fieldLabels[field] && !field.startsWith('var')) {
                  return null;
                }
                return renderMappingCard(field);
              })}
            </div>

            {Object.values(mapping).some(Boolean) && renderPreviewTable()}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Upload
              </button>
              <button
                onClick={handleLiveAnalysis}
                disabled={
                     loading ||
                       !(
                          mapping.symbol &&
                          mapping.direction &&
                          mapping.date &&
                          mapping.pnl &&
                          mapping.rr
                       )      
                } 
                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Zap className="w-5 h-5 mr-2" />
                {loading ? "Analyzing..." : "Analyze Data"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Analysis Results */}
        {step === 3 && summaryStats && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Results</h2>
              <p className="text-gray-600">Review your trading performance metrics</p>
            </div>

            <SummaryMetrics stats={summaryStats} />

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Mapping
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Database className="w-5 h-5 mr-2" />
                {loading ? "Importing..." : "Import to Database"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-12">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Import Successful!</h2>
            <p className="text-xl text-gray-600 mb-8">
              {analysis?.totalTrades} trades have been successfully imported to your database.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setStep(1);
                  setCsvData([]);
                  setHeaders([]);
                  setMapping({ symbol: "", direction: "", date: "", pnl: "", rr: "" });
                  setAnalysis(null);
                  setCsvFileName("");
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={() => navigate("/journal")}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Journal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}