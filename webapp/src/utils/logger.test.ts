import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from './logger';

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages in non-production environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    logger.debug('Test debug message');
    
    expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'Test debug message');
    
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not log debug messages in production environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    logger.debug('Test debug message');
    
    expect(console.debug).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'Test info message');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'Test warning message');
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
  });

  it('should handle multiple arguments', () => {
    const data = { test: true };
    logger.info('Test message with data', data);
    
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'Test message with data', data);
  });
});