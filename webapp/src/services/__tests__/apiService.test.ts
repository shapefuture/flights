import { vi } from 'vitest';
import { ApiError, fetchWithTimeout, callAgentApi, api } from '../apiService';

// Create a mock Response
const createResponse = (status: number, data: any) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe('ApiError', () => {
    it('should create an ApiError with all properties', () => {
      const error = new ApiError('Test error', 400, { detail: 'Additional info' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ detail: 'Additional info' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('fetchWithTimeout', () => {
    it('should make a successful fetch request', async () => {
      const mockResponse = createResponse(200, { success: true });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await fetchWithTimeout('https://example.com/api', {
        method: 'GET'
      }, 5000);
      
      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
        method: 'GET',
        signal: expect.any(AbortSignal)
      });
    });

    it('should abort after timeout', async () => {
      vi.useFakeTimers();
      
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => {
        // This promise never resolves, simulating a hanging request
      }));
      
      const fetchPromise = fetchWithTimeout('https://example.com/api', {
        method: 'GET'
      }, 1000);
      
      // Advance timer to trigger the timeout
      vi.advanceTimersByTime(1500);
      
      await expect(fetchPromise).rejects.toThrow('Request timeout');
      
      vi.useRealTimers();
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('NetworkError when attempting to fetch resource');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);
      
      await expect(fetchWithTimeout('https://example.com/api', {
        method: 'GET'
      }, 5000)).rejects.toThrow('Network error');
    });
  });

  describe('callAgentApi', () => {
    it('should make a POST request to the agent API', async () => {
      const mockResponse = createResponse(200, { success: true });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await callAgentApi('Test query');
      
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'Test query' })
        })
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = createResponse(400, { error: 'Bad request' });
      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);
      
      const result = await callAgentApi('Test query');
      
      expect(result).toEqual({ error: 'Bad request' });
    });

    it('should handle network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));
      
      const result = await callAgentApi('Test query');
      
      expect(result).toEqual({ error: 'Network failure' });
    });
  });

  describe('api object', () => {
    it('should make GET requests', async () => {
      const mockResponse = createResponse(200, { data: 'test' });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await api.get('/test-endpoint');
      
      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should make POST requests', async () => {
      const mockResponse = createResponse(200, { data: 'test' });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await api.post('/test-endpoint', { foo: 'bar' });
      
      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ foo: 'bar' })
        })
      );
    });

    it('should throw ApiError for failed requests', async () => {
      const errorResponse = createResponse(500, { error: 'Server error' });
      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);
      
      await expect(api.get('/test-endpoint')).rejects.toThrow(ApiError);
      await expect(api.get('/test-endpoint')).rejects.toThrow('Server error');
    });
  });
});