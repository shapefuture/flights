import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { debug, info, warn, error } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should log debug messages', () => {
    debug('Test debug message');
    expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'Test debug message');
  });

  it('should log debug messages with additional data', () => {
    const data = { user: 'test', id: 123 };
    debug('Test debug message', data);
    expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'Test debug message', data);
  });

  it('should log info messages', () => {
    info('Test info message');
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'Test info message');
  });

  it('should log info messages with additional data', () => {
    const data = { user: 'test', id: 123 };
    info('Test info message', data);
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'Test info message', data);
  });

  it('should log warning messages', () => {
    warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'Test warning message');
  });

  it('should log warning messages with additional data', () => {
    const data = { user: 'test', id: 123 };
    warn('Test warning message', data);
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'Test warning message', data);
  });

  it('should log error messages', () => {
    error('Test error message');
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
  });

  it('should log error messages with an error object', () => {
    const err = new Error('Something went wrong');
    error('Test error message', err);
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Test error message', err);
  });

  it('should log error messages with both error and additional data', () => {
    const err = new Error('Something went wrong');
    const data = { user: 'test', id: 123 };
    error('Test error message', err, data);
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'Test error message', err, data);
  });
});