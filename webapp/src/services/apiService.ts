import logger from '../utils/logger';

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Configuration for API requests
 */
interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Default API configuration
 */
const defaultConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Parse the API response based on content type
 */
async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('Content-Type') || '';
  
  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType.includes('text/')) {
      return await response.text();
    }
    
    // Default to arrayBuffer for binary data
    return await response.arrayBuffer();
  } catch (error) {
    logger.error('Failed to parse API response:', error);
    throw new ApiError(
      'Failed to parse server response',
      response.status,
      { originalError: error }
    );
  }
}

/**
 * Make a fetch request with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  // Create an abort controller for timeouts
  const controller = new AbortController();
  const { signal } = controller;
  
  // Set up the timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle abort errors (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      throw new ApiError('Network error. Please check your connection.', 0);
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Call the agent API with proper error handling and logging
 */
export async function callAgentApi(query: string, context?: any): Promise<any> {
  logger.logApiRequest('/api/agent', 'POST', { query, context });
  
  try {
    const response = await fetchWithTimeout(
      `${defaultConfig.baseUrl}/agent`,
      {
        method: 'POST',
        headers: defaultConfig.headers,
        body: JSON.stringify({ query, context })
      },
      defaultConfig.timeout!
    );
    
    const data = await parseResponse(response);
    
    logger.logApiResponse('/api/agent', response.status, data);
    
    // Check for error in the response data
    if (!response.ok) {
      throw new ApiError(
        data.error || 'An unknown error occurred',
        response.status,
        data
      );
    }
    
    return data;
  } catch (error) {
    // Log and transform errors for consistent handling
    if (error instanceof ApiError) {
      logger.error('API Error:', error.message, { status: error.status, data: error.data });
      return { error: error.message };
    } else {
      logger.error('Unexpected API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
}

/**
 * Check the health of the API
 */
export async function checkApiHealth(): Promise<{ status: string, version?: string }> {
  logger.logApiRequest('/api/health', 'GET');
  
  try {
    const response = await fetchWithTimeout(
      `${defaultConfig.baseUrl}/health`,
      {
        method: 'GET',
        headers: defaultConfig.headers
      },
      5000 // Quick timeout for health check
    );
    
    const data = await parseResponse(response);
    
    logger.logApiResponse('/api/health', response.status, data);
    
    if (!response.ok) {
      throw new ApiError(
        data.error || 'API health check failed',
        response.status,
        data
      );
    }
    
    return data;
  } catch (error) {
    logger.error('API Health Check Failed:', error);
    return { status: 'error' };
  }
}

/**
 * Create a general-purpose api object for reuse
 */
export const api = {
  get: async (endpoint: string, config?: Partial<ApiConfig>) => {
    const mergedConfig = { ...defaultConfig, ...config };
    logger.logApiRequest(endpoint, 'GET');
    
    try {
      const response = await fetchWithTimeout(
        `${mergedConfig.baseUrl}${endpoint}`,
        {
          method: 'GET',
          headers: mergedConfig.headers
        },
        mergedConfig.timeout!
      );
      
      const data = await parseResponse(response);
      
      logger.logApiResponse(endpoint, response.status, data);
      
      if (!response.ok) {
        throw new ApiError(
          data.error || `GET request to ${endpoint} failed`,
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        { originalError: error }
      );
    }
  },
  
  post: async (endpoint: string, body: any, config?: Partial<ApiConfig>) => {
    const mergedConfig = { ...defaultConfig, ...config };
    logger.logApiRequest(endpoint, 'POST', body);
    
    try {
      const response = await fetchWithTimeout(
        `${mergedConfig.baseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: mergedConfig.headers,
          body: JSON.stringify(body)
        },
        mergedConfig.timeout!
      );
      
      const data = await parseResponse(response);
      
      logger.logApiResponse(endpoint, response.status, data);
      
      if (!response.ok) {
        throw new ApiError(
          data.error || `POST request to ${endpoint} failed`,
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        { originalError: error }
      );
    }
  }
};