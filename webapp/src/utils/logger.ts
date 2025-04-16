// Simple logging utility

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Create a logger object with basic logging methods
const logger = {
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};

// Export all functions individually
export const { debug, info, warn, error } = logger;

// Export the logger as default
export default logger;
