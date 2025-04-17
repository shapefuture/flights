// Logger utility to standardize logging across the application

/**
 * Log a debug message
 * @param message The message to log
 * @param data Optional additional data
 */
export const debug = (message: string, data?: any) => {
  console.debug('[DEBUG]', message, ...(data ? [data] : []));
};

/**
 * Log an info message
 * @param message The message to log
 * @param data Optional additional data
 */
export const info = (message: string, data?: any) => {
  console.info('[INFO]', message, ...(data ? [data] : []));
};

/**
 * Log a warning message
 * @param message The message to log
 * @param data Optional additional data
 */
export const warn = (message: string, data?: any) => {
  console.warn('[WARN]', message, ...(data ? [data] : []));
};

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error object
 * @param data Optional additional data
 */
export const error = (message: string, error?: Error | any) => {
  console.error('[ERROR]', message, ...(error ? [error] : []));
};

export default {
  debug,
  info,
  warn,
  error
};