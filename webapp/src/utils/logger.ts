/**
 * Logger utility for consistent logging across the application
 */

// Named exports for logger functions
export const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

export const info = (message: string, ...args: any[]) => {
  console.info(`[INFO] ${message}`, ...args);
};

export const error = (message: string, ...args: any[]) => {
  console.error(`[ERROR] ${message}`, ...args);
};

export const warn = (message: string, ...args: any[]) => {
  console.warn(`[WARN] ${message}`, ...args);
};

// Additional logging methods for API interactions
export const logApiRequest = (endpoint: string, params: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[API REQUEST] ${endpoint}`, params);
  }
};

export const logApiResponse = (endpoint: string, response: any, status: number = 200) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[API RESPONSE] ${endpoint} (${status})`, response);
  }
};

export const logUserActivity = (activity: string, details?: any) => {
  console.info(`[USER ACTIVITY] ${activity}`, details || '');
};

// Factory function for creating contextual loggers
export const createLogger = (context: string) => ({
  debug: (message: string, ...args: any[]) => debug(`[${context}] ${message}`, ...args),
  info: (message: string, ...args: any[]) => info(`[${context}] ${message}`, ...args),
  error: (message: string, ...args: any[]) => error(`[${context}] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => warn(`[${context}] ${message}`, ...args),
});

// Default export for backward compatibility
const logger = {
  debug,
  info,
  error,
  warn,
  logApiRequest,
  logApiResponse,
  logUserActivity,
  createLogger
};

export default logger;