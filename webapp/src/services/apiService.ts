import logger from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  details?: any;
  
  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Global request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

/**
 * Log API request details
 */
function logApiRequest(method: string, url: string, body?: any) {
  logger.debug(`API ${method} request to ${url}`, body);
}

/**
 * Log API response details
 */
function logApiResponse(method: string, url: string, status: number, data: any) {
  logger.debug(`API ${method} response from ${url}`, { status, data });
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  // Create an AbortController to handle timeouts
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a timeout Promise
  const timeoutPromise = new Promise<Response>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new ApiError(`Request timed out after ${timeoutMs}ms`, 408));
    }, timeoutMs);
    
    // Clean up the timeout if the fetch resolves or rejects
    signal.addEventListener('abort', () => clearTimeout(timeoutId));
  });
  
  // Create the fetch Promise with the signal
  const fetchPromise = fetch(url, {
    ...options,
    signal
  });
  
  // Race the fetch and timeout
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Call the agent API with the user's query
 */
export async function callAgentApi(query: string, context?: any, apiKey?: string) {
  const url = '/api/agent';
  
  logApiRequest('POST', url, { query, context });
  
  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ query, context })
      }
    );
    
    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    const data = await response.json();
    logApiResponse('POST', url, response.status, data);
    
    return data;
  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request aborted', 499);
    }
    
    // Handle other errors
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`API call failed: ${message}`);
    throw new ApiError(`API call failed: ${message}`);
  }
}

/**
 * Generic API object with convenience methods
 */
export const api = {
  async get(url: string, options?: RequestInit) {
    logApiRequest('GET', url);
    
    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      logApiResponse('GET', url, response.status, data);
      
      return data;
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`GET request failed: ${message}`);
      throw new ApiError(`GET request failed: ${message}`);
    }
  },
  
  async post(url: string, body?: any, options?: RequestInit) {
    logApiRequest('POST', url, body);
    
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      logApiResponse('POST', url, response.status, data);
      
      return data;
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`POST request failed: ${message}`);
      throw new ApiError(`POST request failed: ${message}`);
    }
  }
};

export default {
  fetchWithTimeout,
  callAgentApi,
  api,
  logApiRequest,
  logApiResponse,
  ApiError
};