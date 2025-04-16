/**
 * Logger utility for consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configure this based on environment
const LOG_LEVEL: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Default to 'info' in production, 'debug' in development
const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVEL.info : LOG_LEVEL.debug;

// Track if we've initialized the error tracking
let errorTrackingInitialized = false;

/**
 * Initialize error tracking for unhandled errors
 */
function initializeErrorTracking() {
  if (errorTrackingInitialized) return;
  
  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    error('Unhandled Promise Rejection:', event.reason);
  });
  
  // Log uncaught exceptions
  window.addEventListener('error', (event) => {
    error('Uncaught Exception:', event.error || event.message);
  });
  
  errorTrackingInitialized = true;
}

/**
 * Log a debug message (only in development)
 */
export function debug(...args: any[]) {
  if (currentLevel <= LOG_LEVEL.debug) {
    console.debug(`[DEBUG][${new Date().toISOString()}]`, ...args);
  }
}

/**
 * Log an info message
 */
export function info(...args: any[]) {
  if (currentLevel <= LOG_LEVEL.info) {
    console.info(`[INFO][${new Date().toISOString()}]`, ...args);
  }
}

/**
 * Log a warning message
 */
export function warn(...args: any[]) {
  if (currentLevel <= LOG_LEVEL.warn) {
    console.warn(`[WARN][${new Date().toISOString()}]`, ...args);
  }
}

/**
 * Log an error message
 */
export function error(...args: any[]) {
  if (currentLevel <= LOG_LEVEL.error) {
    console.error(`[ERROR][${new Date().toISOString()}]`, ...args);
    
    // In a real app, you might send this to an error tracking service
    // sendToErrorTrackingService(args);
  }
}

/**
 * Log an API request for debugging
 */
export function logApiRequest(endpoint: string, method: string, data?: any) {
  debug(`API Request: ${method} ${endpoint}`, data || '');
}

/**
 * Log an API response for debugging
 */
export function logApiResponse(endpoint: string, status: number, data: any) {
  if (status >= 400) {
    error(`API Error Response: ${endpoint} (${status})`, data);
  } else {
    debug(`API Response: ${endpoint} (${status})`, data);
  }
}

// Export a default object with all methods
const logger = {
  debug,
  info,
  warn,
  error,
  logApiRequest,
  logApiResponse,
  initializeErrorTracking
};

export default logger;