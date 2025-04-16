/**
 * Logger utility for consistent logging across the application
 */

// Named exports for logger functions
export const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export const info = (message: string, ...args: any[]) => {
  console.log(`[INFO] ${message}`, ...args);
};

export const error = (message: string, ...args: any[]) => {
  console.error(`[ERROR] ${message}`, ...args);
};

export const warn = (message: string, ...args: any[]) => {
  console.warn(`[WARN] ${message}`, ...args);
};

// Default export for backward compatibility
const logger = {
  debug,
  info,
  error,
  warn
};

export default logger;