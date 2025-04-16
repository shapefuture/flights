// Enhanced logger with better formatting and error tracking

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  tags?: string[];
  user?: string;
  context?: Record<string, any>;
}

// Get configured log level from environment
const ENV_LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';

// Map log levels to numeric values for comparison
const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVEL_MAP[ENV_LOG_LEVEL as LogLevel] || LOG_LEVEL_MAP.info;

// Format message with timestamp, log level and other metadata
function formatLogMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const timestamp = new Date().toISOString();
  const tagsStr = options?.tags ? `[${options.tags.join(',')}]` : '';
  const userStr = options?.user ? `[User:${options.user}]` : '';
  
  return `${timestamp} [${level.toUpperCase()}] ${tagsStr} ${userStr} ${message}`;
}

// Determine if message should be logged based on configured level
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_MAP[level] >= CURRENT_LOG_LEVEL;
}

// Send error to an error monitoring service (mock implementation)
function reportErrorToMonitoring(error: Error | string, context?: Record<string, any>): void {
  // This would integrate with an actual error monitoring service like Sentry
  if (import.meta.env.PROD) {
    console.log('[ERROR_MONITORING]', { error, context });
    
    // Example Sentry integration:
    // Sentry.captureException(error, {
    //   extra: context
    // });
  }
}

// Debug level logging
export function debug(message: string, ...args: any[]): void {
  if (!shouldLog('debug')) return;
  
  console.debug(formatLogMessage('debug', message), ...args);
}

// Info level logging
export function info(message: string, ...args: any[]): void {
  if (!shouldLog('info')) return;
  
  console.info(formatLogMessage('info', message), ...args);
}

// Warning level logging
export function warn(message: string, ...args: any[]): void {
  if (!shouldLog('warn')) return;
  
  console.warn(formatLogMessage('warn', message), ...args);
}

// Error level logging
export function error(message: string, err?: any, options?: LogOptions): void {
  if (!shouldLog('error')) return;
  
  console.error(formatLogMessage('error', message), err);
  
  // Report errors to monitoring service
  if (err instanceof Error) {
    reportErrorToMonitoring(err, { message, ...options?.context });
  } else if (err) {
    reportErrorToMonitoring(`${message}: ${JSON.stringify(err)}`, options?.context);
  } else {
    reportErrorToMonitoring(message, options?.context);
  }
}

// Log API requests
export function logApiRequest(
  endpoint: string, 
  method: string, 
  requestData?: any,
  options?: LogOptions
): void {
  if (!shouldLog('debug')) return;
  
  const message = `API Request: ${method} ${endpoint}`;
  console.debug(
    formatLogMessage('debug', message, { ...options, tags: [...(options?.tags || []), 'api'] }),
    { requestData }
  );
}

// Log API responses
export function logApiResponse(
  endpoint: string,
  method: string,
  status: number,
  responseData?: any,
  options?: LogOptions
): void {
  // Choose log level based on response status
  const level: LogLevel = status >= 400 ? 'error' : 'debug';
  
  if (!shouldLog(level)) return;
  
  const message = `API Response: ${method} ${endpoint} (${status})`;
  console[level](
    formatLogMessage(level, message, { ...options, tags: [...(options?.tags || []), 'api'] }),
    { responseData }
  );
  
  // If error response, report to monitoring
  if (status >= 400) {
    reportErrorToMonitoring(
      `API Error: ${method} ${endpoint} returned ${status}`,
      { status, responseData, ...options?.context }
    );
  }
}

// Log user activities
export function logUserActivity(
  action: string,
  userId: string,
  details?: any
): void {
  if (!shouldLog('info')) return;
  
  const message = `User Activity: ${action}`;
  console.info(
    formatLogMessage('info', message, { user: userId, tags: ['user', 'activity'] }),
    details
  );
}

// Create a namespaced logger
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...args: any[]) => debug(`[${namespace}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => info(`[${namespace}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => warn(`[${namespace}] ${message}`, ...args),
    error: (message: string, err?: any, options?: LogOptions) => 
      error(`[${namespace}] ${message}`, err, options),
    logApiRequest: (endpoint: string, method: string, requestData?: any, options?: LogOptions) =>
      logApiRequest(endpoint, method, requestData, { ...options, tags: [...(options?.tags || []), namespace] }),
    logApiResponse: (endpoint: string, method: string, status: number, responseData?: any, options?: LogOptions) =>
      logApiResponse(endpoint, method, status, responseData, { ...options, tags: [...(options?.tags || []), namespace] }),
    logUserActivity: (action: string, userId: string, details?: any) =>
      logUserActivity(`[${namespace}] ${action}`, userId, details)
  };
}