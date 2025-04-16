import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchWithTimeout, callAgentApi, api, ApiError } from '../apiService';

// Setup global fetch mock
const mockFetchImplementation = vi.fn().mockImplementation((url, options) => {
  // Default mock response
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve(JSON.stringify({ success: true })),
    headers: new Headers()
  });
});

// Replace global fetch with our mock
global.fetch = mockFetchImplementation;

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchImplementation.mockClear();
  });

  describe('fetchWithTimeout', () => {
    it('should fetch data with default timeout', async () => {
      // Setup mock for successful response
      mockFetchImplementation.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers()
      });
      
      const response = await fetchWithTimeout('/test');
      const data = await response.json();
      
      expect(mockFetchImplementation).toHaveBeenCalledWith('/test', expect.objectContaining({
        signal: expect.any(Object)
      }));
      expect(data).toEqual({ success: true });
    });

    it('should abort after timeout', async () => {
      // Mock a fetch that never resolves
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() => new Promise(() => {}));
      
      // Set a very short timeout for testing
      try {
        await fetchWithTimeout('/test', {}, 50);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('timed out');
      }
      
      // Restore original fetch
      global.fetch = originalFetch;
    });
    
    it('should handle network errors', async () => {
      // Setup mock for network error
      mockFetchImplementation.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetchWithTimeout('/test');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Network error');
      }
    });
  });

  describe('callAgentApi', () => {
    it('should make a POST request to the agent API', async () => {
      // Setup mock for successful response
      mockFetchImplementation.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ thinking: 'test', plan: { steps: [] } }),
        headers: new Headers()
      });
      
      const result = await callAgentApi('Find flights to NYC');
      
      expect(mockFetchImplementation).toHaveBeenCalledWith('/api/agent', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Find flights to NYC')
      }));
      expect(result).toEqual({ thinking: 'test', plan: { steps: [] } });
    });
    
    it('should include context if provided', async () => {
      // Setup mock for successful response
      mockFetchImplementation.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ thinking: 'test', plan: { steps: [] } }),
        headers: new Headers()
      });
      
      const context = { previous: 'data' };
      await callAgentApi('Find flights to NYC', context);
      
      expect(mockFetchImplementation).toHaveBeenCalledWith('/api/agent', expect.objectContaining({
        body: expect.stringContaining('context')
      }));
    });
    
    it('should handle API errors', async () => {
      // Setup mock for API error
      mockFetchImplementation.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Bad request' }),
        headers: new Headers()
      });
      
      try {
        await callAgentApi('Invalid query');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toContain('Bad request');
      }
    });
    
    it('should handle network failures', async () => {
      // Setup mock for network failure
      mockFetchImplementation.mockRejectedValueOnce(new Error('Network failure'));
      
      try {
        await callAgentApi('Find flights');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toContain('Network failure');
      }
    });
  });

  describe('api object', () => {
    it('should make GET requests', async () => {
      // Setup mock for successful response
      mockFetchImplementation.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers()
      });
      
      const result = await api.get('/test');
      
      expect(mockFetchImplementation).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'GET'
      }));
      expect(result).toEqual({ data: 'test' });
    });
    
    it('should make POST requests', async () => {
      // Setup mock for successful response
      mockFetchImplementation.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers()
      });
      
      const body = { test: true };
      const result = await api.post('/test', body);
      
      expect(mockFetchImplementation).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body)
      }));
      expect(result).toEqual({ data: 'test' });
    });
    
    it('should throw ApiError for failed requests', async () => {
      // Setup mock for server error
      mockFetchImplementation.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
        headers: new Headers()
      });
      
      try {
        await api.get('/error');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(500);
        expect(error.message).toContain('Server error');
      }
    });
  });
});