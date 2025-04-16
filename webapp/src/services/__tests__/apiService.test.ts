import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, callAgentApi, api, ApiError } from '../apiService';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Helper to mock fetch responses
function mockFetchResponse(status = 200, data = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
}

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchWithTimeout', () => {
    it('should fetch data with default timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(mockFetchResponse(200, { success: true }));
      
      const response = await fetchWithTimeout('/test');
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
      expect(data).toEqual({ success: true });
    });

    it('should abort after timeout', async () => {
      // Mock a fetch that never resolves
      (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
      
      // Set a very short timeout for testing
      await expect(fetchWithTimeout('/test', {}, 50)).rejects.toThrow('Request timed out');
    });
    
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(fetchWithTimeout('/test')).rejects.toThrow('Network error');
    });
  });

  describe('callAgentApi', () => {
    it('should make a POST request to the agent API', async () => {
      const mockResponse = { thinking: 'test', plan: { steps: [] } };
      (global.fetch as jest.Mock).mockImplementationOnce(mockFetchResponse(200, mockResponse));
      
      const result = await callAgentApi('Find flights to NYC');
      
      expect(fetch).toHaveBeenCalledWith('/api/agent', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'Find flights to NYC' })
      }));
      expect(result).toEqual(mockResponse);
    });
    
    it('should include context if provided', async () => {
      const mockResponse = { thinking: 'test', plan: { steps: [] } };
      (global.fetch as jest.Mock).mockImplementationOnce(mockFetchResponse(200, mockResponse));
      
      const context = { previous: 'data' };
      await callAgentApi('Find flights to NYC', context);
      
      expect(fetch).toHaveBeenCalledWith('/api/agent', expect.objectContaining({
        body: JSON.stringify({ query: 'Find flights to NYC', context })
      }));
    });
    
    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetchResponse(400, { error: 'Bad request' })
      );
      
      await expect(callAgentApi('Invalid query')).rejects.toThrow(ApiError);
      await expect(callAgentApi('Invalid query')).rejects.toThrow('Bad request');
    });
    
    it('should handle network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
      
      await expect(callAgentApi('Find flights')).rejects.toThrow(ApiError);
      await expect(callAgentApi('Find flights')).rejects.toThrow('Network failure');
    });
  });

  describe('api object', () => {
    it('should make GET requests', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockImplementationOnce(mockFetchResponse(200, mockResponse));
      
      const result = await api.get('/test');
      
      expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'GET'
      }));
      expect(result).toEqual(mockResponse);
    });
    
    it('should make POST requests', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockImplementationOnce(mockFetchResponse(200, mockResponse));
      
      const body = { test: true };
      const result = await api.post('/test', body);
      
      expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body)
      }));
      expect(result).toEqual(mockResponse);
    });
    
    it('should throw ApiError for failed requests', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        mockFetchResponse(500, { error: 'Server error' })
      );
      
      try {
        await api.get('/error');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as Error).message).toContain('Server error');
      }
    });
  });
});