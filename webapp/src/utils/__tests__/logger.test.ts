import * as logger from '../logger';

// Spy on console methods
const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs debug messages', () => {
    logger.debug('Test debug message');
    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('Test debug message');
  });

  it('logs info messages', () => {
    logger.info('Test info message');
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('Test info message');
  });

  it('logs warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Test warning message');
  });

  it('logs error messages', () => {
    const testError = new Error('Test error');
    logger.error('Test error message', testError);
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Test error message');
    expect(consoleErrorSpy.mock.calls[0][1]).toBe(testError);
  });

  it('logs API requests', () => {
    logger.logApiRequest('/api/test', 'GET', { param: 'value' });
    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('API Request: GET /api/test');
    expect(consoleDebugSpy.mock.calls[0][1]).toEqual({ requestData: { param: 'value' } });
  });

  it('logs successful API responses', () => {
    logger.logApiResponse('/api/test', 'GET', 200, { result: 'success' });
    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('API Response: GET /api/test (200)');
    expect(consoleDebugSpy.mock.calls[0][1]).toEqual({ responseData: { result: 'success' } });
  });

  it('logs error API responses', () => {
    logger.logApiResponse('/api/test', 'GET', 500, { error: 'server error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('API Response: GET /api/test (500)');
    expect(consoleErrorSpy.mock.calls[0][1]).toEqual({ responseData: { error: 'server error' } });
  });

  it('logs user activities', () => {
    logger.logUserActivity('login', 'user123', { ip: '127.0.0.1' });
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('User Activity: login');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[User:user123]');
    expect(consoleInfoSpy.mock.calls[0][1]).toEqual({ ip: '127.0.0.1' });
  });

  it('creates a namespaced logger', () => {
    const authLogger = logger.createLogger('auth');
    
    authLogger.info('User login');
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[auth]');
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('User login');
    
    authLogger.error('Login failed', new Error('Invalid credentials'));
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[auth]');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Login failed');
  });
});