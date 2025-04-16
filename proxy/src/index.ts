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
- origin: Airport code (e.g., 'JFK')
- dest: Airport code (e.g., 'LHR')
- depDate: Departure date in YYYY-MM-DD format
- retDate: Return date in YYYY-MM-DD format (for round trips)
- numAdults: Number of adult passengers
- numChildren: Number of child passengers
- numInfants: Number of infant passengers
- cabinClass: Cabin class (e.g., 'economy', 'premium_economy', 'business', 'first')

Example:
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
        "limit": 5
      }
    }
  ]
}
</plan>

Respond ONLY with the thinking and plan tags.`;

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
    
    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok' }),
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
          }
        }
        
        // For development without actually calling the LLM, return a mock response
        if (!env.OPENROUTER_API_KEY) {
          console.warn('No OpenRouter API key provided, returning mock response');
          
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
          
          return new Response(
            JSON.stringify(mockResponse),
            {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            }
          );
        }
        
        // Make the actual API call to OpenRouter
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
          throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
        }
        
        const llmResponse = await openRouterResponse.json();
        const content = llmResponse.choices[0].message.content;
        
        // Parse the thinking and plan from the response
        const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
        const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/);
        
        const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
        let plan = null;
        
        if (planMatch) {
          try {
            plan = JSON.parse(planMatch[1].trim());
          } catch (e) {
            console.error('Failed to parse plan JSON:', e);
          }
        }
        
        return new Response(
          JSON.stringify({
            thinking,
            plan
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      } catch (error) {
        console.error('Error processing request:', error);
        
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