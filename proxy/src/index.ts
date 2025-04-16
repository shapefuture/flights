export interface Env {
  OPENROUTER_API_KEY: string;
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

// Basic in-memory rate limiter
const rateLimits = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 20; // Maximum requests per minute
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const userLimit = rateLimits.get(ip)!;
  
  if (now > userLimit.resetTime) {
    // Reset window
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Simple cache implementation
interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getFromCache(key: string): any | null {
  const now = Date.now();
  const entry = cache.get(key);
  
  if (!entry) return null;
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.value;
}

function setInCache(key: string, value: any, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
    
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`[${getTimestamp()}] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '0.1.0'
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
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      try {
        const { query, context } = await request.json() as { query: string, context?: any };
        
        // Validate the query
        if (!query || typeof query !== 'string') {
          throw new Error('Invalid query parameter');
        }
        
        console.log(`[${getTimestamp()}] Processing query from IP ${clientIP}: "${query.substring(0, 50)}..."`);
        
        // Create a cache key
        const cacheKey = `query:${query}:context:${JSON.stringify(context || {})}`;
        
        // Check cache first
        const cachedResponse = getFromCache(cacheKey);
        if (cachedResponse) {
          console.log(`[${getTimestamp()}] Cache hit for query: "${query.substring(0, 30)}..."`);
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
        
        // Call the LLM API with OpenRouter
        let messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query }
        ];
        
        // If there's context from a previous interaction, add it to the prompt
        if (context) {
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
          console.warn('[${getTimestamp()}] No OpenRouter API key provided, returning mock response');
          
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
          setInCache(cacheKey, mockResponse, 10 * 60 * 1000); // Cache for 10 minutes
          
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
        console.log(`[${getTimestamp()}] Calling OpenRouter API for query: "${query.substring(0, 30)}..."`);
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
          console.error(`[${getTimestamp()}] OpenRouter API error:`, errorData);
          throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
        }
        
        const llmResponse = await openRouterResponse.json();
        const content = llmResponse.choices[0].message.content;
        
        console.log(`[${getTimestamp()}] Received response from OpenRouter for query: "${query.substring(0, 30)}..."`);
        
        // Parse the thinking and plan from the response
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
        const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/);
        
        const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
        let plan = null;
        
        if (planMatch) {
          try {
            plan = JSON.parse(planMatch[1].trim());
          } catch (e) {
            console.error(`[${getTimestamp()}] Failed to parse plan JSON:`, e);
          }
        }
        
        const responseData = { thinking, plan };
        
        // Cache the response
        setInCache(cacheKey, responseData, 10 * 60 * 1000); // Cache for 10 minutes
        
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
        console.error(`[${getTimestamp()}] Error processing request:`, error);
        
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
    }
    
    // Default 404 response
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  },
};