// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Environment
export const ENV = process.env.NODE_ENV || 'development';

// Feature Flags
export const FEATURES = {
  ANALYTICS: true,
  TRADE_IMPORT: true,
  EXPORT: true,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'userData',
  THEME: 'theme',
};

// Default Settings
export const DEFAULTS = {
  PAGE_SIZE: 10,
  DATE_FORMAT: 'yyyy-MM-dd',
  TIME_FORMAT: 'HH:mm',
};
