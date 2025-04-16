export interface Env {
  OPENROUTER_API_KEY: string;
  DEBUG_MODE?: string;
}

/**
 * Structured error for API processing
 */
class ApiError extends Error {
  status: number;
  details?: any;
  
  constructor(message: string, status: number = 400, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// System prompt for the LLM
const SYSTEM_PROMPT = `You are an advanced multi-step flight planning agent. Analyze the user's request. 

First, think step-by-step about how to fulfill the request, including required searches. 
Enclose your thoughts in <thinking>...</thinking> tags.

Second, create a structured plan as a JSON object within <plan>...</plan> tags. 
The plan should contain a list of steps, each with an 'action' and necessary 'parameters'.

Available actions:
- 'generate_search_queries': Create specific search parameters based on natural language input
- 'execute_flight_fetch': Request flight data using the generated search parameters
- 'summarize_results': Analyze and summarize the flight results

For flight parameters, include:
- origin: Airport code or list of airport codes (e.g., 'JFK' or ['JFK', 'LGA', 'EWR'])
- dest: Airport code or list of airport codes (e.g., 'LHR' or ['LHR', 'LGW'])
- departureDateRange: Use descriptive date ranges like "next-weekend", "this-month", or specific dates in "YYYY-MM-DD" format
- returnDateRange: Same format as departure dates, or use "one-way" for one-way flights
- stayDuration: Number of days for the stay (if departure and return date are not explicitly specified)
- departureDateFlexibility: Number of days flexibility around departure date (e.g., 2 means ±2 days)
- returnDateFlexibility: Number of days flexibility around return date
- numAdults: Number of adult passengers
- numChildren: Number of child passengers
- numInfants: Number of infant passengers
- cabinClass: Cabin class (e.g., 'economy', 'premium_economy', 'business', 'first')
- maxPrice: Maximum price in dollars

For example:
User: "I need a flight from NYC to London next weekend, returning the following weekend"

<thinking>
I need to find flights from NYC to London. NYC could refer to any of the NYC airports (JFK, LGA, EWR), so I should consider all of them. "Next weekend" likely refers to the upcoming Saturday and Sunday. To determine the exact dates, I need to calculate what dates correspond to "next weekend" and "the following weekend" based on the current date.
</thinking>

<plan>
{
  "steps": [
    {
      "action": "generate_search_queries",
      "parameters": {
        "origins": ["JFK", "LGA", "EWR"],
        "destinations": ["LHR", "LGW"],
        "departureDateRange": "next-weekend",
        "returnDateRange": "following-weekend",
        "numAdults": 1,
        "numChildren": 0,
        "numInfants": 0,
        "cabinClass": "economy"
      }
    },
    {
      "action": "execute_flight_fetch",
      "parameters": {
        "useExtension": true
      }
    },
    {
      "action": "summarize_results",
      "parameters": {
        "sortBy": "price",
        "limit": 20
      }
    }
  ]
}
</plan>

Respond ONLY with the thinking and plan tags. Be comprehensive in your thinking analysis and create specific, detailed plans.`;

// Get current time for rate limiting logs
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log a message with a timestamp (only in debug mode)
 */
function log(env: Env, level: string, message: string, data?: any): void {
  if (env.DEBUG_MODE === 'true') {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }
}

// Basic in-memory rate limiter
const rateLimits = new Map<string, { count: number, resetTime: number, lastRequest: number }>();

/**
 * Check if the current request exceeds the rate limit
 * @returns Boolean indicating whether the rate limit is exceeded
 */
function checkRateLimit(ip: string, env: Env): boolean {
  const now = Date.now();
  const limit = 20; // Maximum requests per minute
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!rateLimits.has(ip)) {
    log(env, 'info', `New client: ${ip}`);
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs, lastRequest: now });
    return true;
  }
  
  const userLimit = rateLimits.get(ip)!;
  
  // Calculate time since last request for logging
  const timeSinceLastMs = now - userLimit.lastRequest;
  userLimit.lastRequest = now;
  
  if (now > userLimit.resetTime) {
    // Reset window
    log(env, 'debug', `Rate limit window reset for ${ip} after ${Math.round(timeSinceLastMs/1000)}s`);
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return true;
  }
  
  if (userLimit.count >= limit) {
    log(env, 'warn', `Rate limit exceeded for ${ip} - ${userLimit.count} requests in current window`);
    return false;
  }
  
  userLimit.count++;
  log(env, 'debug', `Request ${userLimit.count}/${limit} for ${ip} (interval: ${Math.round(timeSinceLastMs/1000)}s)`);
  return true;
}

/**
 * Clean up old rate limit entries to prevent memory leaks
 */
function cleanupRateLimits(env: Env): void {
  const now = Date.now();
  const oldEntryThreshold = 10 * 60 * 1000; // 10 minutes
  
  let cleanupCount = 0;
  
  rateLimits.forEach((limit, ip) => {
    if (now - limit.lastRequest > oldEntryThreshold) {
      rateLimits.delete(ip);
      cleanupCount++;
    }
  });
  
  if (cleanupCount > 0) {
    log(env, 'info', `Cleaned up ${cleanupCount} stale rate limit entries`);
  }
}

// Simple cache implementation
interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get a value from the cache, if it exists and isn't expired
 * @returns The cached value, or null if not found or expired
 */
function getFromCache(key: string, env: Env): any | null {
  const now = Date.now();
  const entry = cache.get(key);
  
  if (!entry) {
    log(env, 'debug', `Cache miss: ${key}`);
    return null;
  }
  
  if (now > entry.expiresAt) {
    log(env, 'debug', `Cache expired: ${key}`);
    cache.delete(key);
    return null;
  }
  
  log(env, 'debug', `Cache hit: ${key}`);
  return entry.value;
}

/**
 * Store a value in the cache with expiration
 */
function setInCache(key: string, value: any, ttlMs: number, env: Env): void {
  const expiresAt = Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });
  log(env, 'debug', `Cache set: ${key}, expires in ${ttlMs/1000}s`);
}

/**
 * Clean up expired cache entries to prevent memory leaks
 */
function cleanupCache(env: Env): void {
  const now = Date.now();
  
  let cleanupCount = 0;
  
  cache.forEach((entry, key) => {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleanupCount++;
    }
  });
  
  if (cleanupCount > 0) {
    log(env, 'info', `Cleaned up ${cleanupCount} expired cache entries`);
  }
}

/**
 * Helper for structured errors
 */
function errorResponse(error: Error, status: number = 400, corsHeaders: HeadersInit): Response {
  const isApiError = error instanceof ApiError;
  const errorBody = {
    error: error.message,
    status: isApiError ? error.status : status,
    timestamp: getTimestamp(),
    details: isApiError ? error.details : undefined
  };
  
  return new Response(
    JSON.stringify(errorBody),
    {
      status: isApiError ? error.status : status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Periodically clean up caches and rate limits
    cleanupCache(env);
    cleanupRateLimits(env);
    
    // Set CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    
    // Handle OPTIONS request (preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }
    
    try {
      const url = new URL(request.url);
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                       request.headers.get('X-Forwarded-For') || 
                       'unknown';
      
      log(env, 'info', `Request: ${request.method} ${url.pathname} from ${clientIP}`);
      
      // Check rate limit
      if (!checkRateLimit(clientIP, env)) {
        throw new ApiError('Rate limit exceeded. Try again in a minute.', 429);
      }
      
      // Health check endpoint
      if (url.pathname === '/api/health') {
        log(env, 'debug', 'Health check requested');
        
        return new Response(
          JSON.stringify({ 
            status: 'ok',
            timestamp: getTimestamp(),
            version: '0.1.0',
            cache_size: cache.size,
            rate_limits: rateLimits.size
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Agent endpoint
      if (url.pathname === '/api/agent') {
        if (request.method !== 'POST') {
          throw new ApiError('Method not allowed', 405);
        }
        
        // Parse the request body
        let body;
        try {
          body = await request.json() as { query: string, context?: any };
        } catch (e) {
          throw new ApiError('Invalid JSON in request body', 400);
        }
        
        // Extract and validate the query
        const { query, context } = body;
        
        if (!query || typeof query !== 'string') {
          throw new ApiError('Missing or invalid query parameter', 400);
        }
        
        if (query.length > 500) {
          throw new ApiError('Query too long (max 500 characters)', 400);
        }
        
        log(env, 'info', `Processing query: "${query.substring(0, 50)}..."`);
        
        // Create a cache key
        const cacheKey = `query:${query}:context:${JSON.stringify(context || {})}`;
        
        // Check cache first
        const cachedResponse = getFromCache(cacheKey, env);
        if (cachedResponse) {
          log(env, 'info', `Cache hit for query: "${query.substring(0, 30)}..."`);
          return new Response(
            JSON.stringify(cachedResponse),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                ...corsHeaders
              }
            }
          );
        }
        
        log(env, 'info', `Cache miss for query: "${query.substring(0, 30)}..."`);
        
        // Call the LLM API with OpenRouter
        let messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query }
        ];
        
        // If there's context from a previous interaction, add it to the prompt
        if (context) {
          log(env, 'debug', 'Context provided:', context);
          
          // Customize system prompt based on context
          if (context.userFeedback) {
            messages = [
              { 
                role: "system", 
                content: `${SYSTEM_PROMPT}\n\nThe user provided feedback on previous results: "${context.userFeedback}". Adjust your plan to address this feedback.` 
              },
              { role: "user", content: `Original query: ${query}\nFeedback: ${context.userFeedback}` }
            ];
          } else if (context.task === 'handle_error') {
            messages = [
              { 
                role: "system", 
                content: `${SYSTEM_PROMPT}\n\nAn error occurred during execution: "${context.errorDetails}". Suggest how to resolve this issue or provide an alternative approach.` 
              },
              { role: "user", content: query }
            ];
          } else if (context.task === 'summarize') {
            messages = [
              { 
                role: "system", 
                content: `You are a helpful flight assistant. You are given a list of flight results and need to summarize the key insights. Focus on price ranges, best deals, recommended options, and any notable patterns. Provide a concise summary in 2-3 paragraphs.` 
              },
              { 
                role: "user", 
                content: `Here are the flight results for the query "${query}":\n\n${JSON.stringify(context.results.slice(0, 10), null, 2)}\n\nPlease summarize these results and provide recommendations.` 
              }
            ];
          }
        }
        
        // For development without actually calling the LLM, return a mock response
        if (!env.OPENROUTER_API_KEY) {
          log(env, 'warn', 'No OpenRouter API key provided, returning mock response');
          
          const mockResponse = {
            thinking: "I need to find flights based on the user's query. Let me analyze what they're looking for.",
            plan: {
              steps: [
                {
                  action: "generate_search_queries",
                  parameters: {
                    origins: ["JFK"],
                    destinations: ["LHR"],
                    departureDateRange: "next-week",
                    returnDateRange: "one-week-later",
                    numAdults: 1,
                    numChildren: 0,
                    numInfants: 0,
                    cabinClass: "economy"
                  }
                },
                {
                  action: "execute_flight_fetch",
                  parameters: {
                    useExtension: true
                  }
                },
                {
                  action: "summarize_results",
                  parameters: {
                    sortBy: "price",
                    limit: 5
                  }
                }
              ]
            }
          };
          
          // Cache the response
          setInCache(cacheKey, mockResponse, 10 * 60 * 1000, env); // Cache for 10 minutes
          
          return new Response(
            JSON.stringify(mockResponse),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                ...corsHeaders
              }
            }
          );
        }
        
        // Make the actual API call to OpenRouter
        log(env, 'info', `Calling OpenRouter API for query: "${query.substring(0, 30)}..."`);
        
        try {
          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
              'HTTP-Referer': url.origin, // Required by OpenRouter
              'X-Title': 'Flight Finder Agent' // Optional but good practice
            },
            body: JSON.stringify({
              model: 'mistralai/mistral-7b-instruct:free', // Using free tier
              messages: messages,
              temperature: 0.3, // Lower for more deterministic outputs
              max_tokens: 1024
            })
          });
          
          if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.json();
            log(env, 'error', 'OpenRouter API error:', errorData);
            throw new ApiError(`OpenRouter API error: ${JSON.stringify(errorData)}`, openRouterResponse.status, errorData);
          }
          
          const llmResponse = await openRouterResponse.json();
          log(env, 'debug', 'OpenRouter API response:', llmResponse);
          
          const content = llmResponse.choices[0].message.content;
          
          log(env, 'info', `Received response from OpenRouter for query: "${query.substring(0, 30)}..."`);
          
          // Parse the thinking and plan from the response
          const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
          const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/);
          
          const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
          let plan = null;
          
          if (planMatch) {
            try {
              plan = JSON.parse(planMatch[1].trim());
            } catch (e) {
              log(env, 'error', 'Failed to parse plan JSON:', e);
              throw new ApiError('Failed to parse plan from LLM response', 500, { 
                raw_plan: planMatch[1].trim() 
              });
            }
          } else {
            log(env, 'warn', 'No plan found in LLM response');
          }
          
          const responseData = { thinking, plan };
          
          // Cache the response
          setInCache(cacheKey, responseData, 10 * 60 * 1000, env); // Cache for 10 minutes
          
          return new Response(
            JSON.stringify(responseData),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                ...corsHeaders
              }
            }
          );
        } catch (error) {
          if (error instanceof ApiError) {
            throw error; // Re-throw API errors
          }
          
          log(env, 'error', 'Error calling OpenRouter API:', error);
          throw new ApiError(
            'Error communicating with AI service',
            502,
            error instanceof Error ? { message: error.message } : { error }
          );
        }
      }
      
      // Default 404 response
      throw new ApiError('Not found', 404);
      
    } catch (error) {
      // Log the error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorDetails = error instanceof ApiError ? error.details : undefined;
      
      log(env, 'error', 'Error processing request:', { message: errorMessage, details: errorDetails });
      
      // Return structured error response
      return errorResponse(
        error instanceof Error ? error : new Error(String(error)),
        500,
        corsHeaders
      );
    }
  },
};