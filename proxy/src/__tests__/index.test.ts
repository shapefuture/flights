import { vi } from 'vitest';
import { handleRequest } from '../index'; // Adjust import as needed

// Mock fetch
global.fetch = vi.fn();

describe('Serverless Proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue(new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: `
                <thinking>
                Test thinking content
                </thinking>
                
                <plan>
                {
                  "steps": [
                    {
                      "action": "generate_search_queries",
                      "parameters": {
                        "origins": ["JFK"],
                        "destinations": ["LAX"],
                        "departureDateRange": "2023-06-01",
                        "returnDateRange": "2023-06-08"
                      }
                    }
                  ]
                }
                </plan>
              `
            }
          }
        ]
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  });

  it('should handle health check requests', async () => {
    const request = new Request('https://example.com/api/health', {
      method: 'GET'
    });
    
    const response = await handleRequest(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    expect(response.status).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('status', 'ok');
    expect(responseBody).toHaveProperty('timestamp');
    expect(responseBody).toHaveProperty('version');
  });

  it('should process agent queries', async () => {
    const request = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    const response = await handleRequest(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    expect(response.status).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('thinking', expect.stringContaining('Test thinking content'));
    expect(responseBody).toHaveProperty('plan');
    expect(responseBody.plan).toHaveProperty('steps');
  });

  it('should enforce rate limits', async () => {
    // Setup a request
    const request = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.168.1.1'
      },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    // Make multiple requests to trigger rate limit
    const responses = [];
    for (let i = 0; i < 25; i++) { // Assuming rate limit is 20/minute
      responses.push(await handleRequest(request, {
        OPENROUTER_API_KEY: 'test-api-key'
      }));
    }
    
    // Check that later requests are rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
    
    const errorBody = await lastResponse.json();
    expect(errorBody).toHaveProperty('error', expect.stringContaining('Rate limit exceeded'));
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API call
    (global.fetch as jest.Mock).mockResolvedValue(new Response(
      JSON.stringify({ error: 'API error', message: 'Something went wrong' }),
      { status: 500 }
    ));
    
    const request = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    const response = await handleRequest(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    expect(response.status).toBe(502); // Gateway error
    
    const errorBody = await response.json();
    expect(errorBody).toHaveProperty('error', expect.stringContaining('Error communicating with AI service'));
  });

  it('should validate input parameters', async () => {
    // Test with missing query
    const request = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No query provided
      })
    });
    
    const response = await handleRequest(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    expect(response.status).toBe(400);
    
    const errorBody = await response.json();
    expect(errorBody).toHaveProperty('error', expect.stringContaining('Missing or invalid query parameter'));
  });

  it('should implement caching', async () => {
    // Make first request
    const request1 = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    await handleRequest(request1, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    // Make second identical request
    const request2 = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    const response2 = await handleRequest(request2, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    // Check for cache header
    expect(response2.headers.get('X-Cache')).toBe('HIT');
    
    // API should only be called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});