import { vi } from 'vitest';
import logger, { debug, info, warn, error } from '../logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should log debug messages in development environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    debug('Test debug message');
    
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]'),
      'Test debug message'
    );
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not log debug messages in production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    debug('Test debug message');
    
    expect(console.debug).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should log info messages', () => {
    info('Test info message');
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      'Test info message'
    );
  });

  it('should log warning messages', () => {
    warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      'Test warning message'
    );
  });

  it('should log error messages', () => {
    error('Test error message');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Test error message'
    );
  });

  it('should log API requests and responses', () => {
    logger.logApiRequest('/test', 'GET');
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('API Request'),
      expect.stringContaining('GET /test')
    );

    logger.logApiResponse('/test', 200, { success: true });
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('API Response'),
      expect.stringContaining('/test (200)'),
      { success: true }
    );

    logger.logApiResponse('/test', 500, { error: 'Server error' });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('API Error Response'),
      expect.stringContaining('/test (500)'),
      { error: 'Server error' }
    );
  });

  it('should initialize error tracking', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    logger.initializeErrorTracking();
    
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Test that it only initializes once
    logger.initializeErrorTracking();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2); // Still just 2 calls
  });
});