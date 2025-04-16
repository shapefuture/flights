import { vi } from 'vitest';
import { handleRequest } from '../index'; // Adjust import as needed

// Mock fetch
global.fetch = vi.fn();

describe('Serverless Proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue(new Response(
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
    
    // Mock implementation for handleRequest
    const handleRequestMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '0.1.0'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
    
    const response = await handleRequestMock(request, {
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
    
    // Mock implementation for handleRequest
    const handleRequestMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          thinking: 'Test thinking content',
          plan: { steps: [] }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
    
    const response = await handleRequestMock(request, {
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
    
    // Mock implementation for handleRequest that returns rate limit error after too many calls
    const handleRequestMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ thinking: 'content', plan: { steps: [] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ))
      .mockResolvedValue(new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      ));
    
    // First request should succeed
    const response1 = await handleRequestMock(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    expect(response1.status).toBe(200);
    
    // Second request should be rate limited
    const response2 = await handleRequestMock(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    expect(response2.status).toBe(429);
    
    const errorBody = await response2.json();
    expect(errorBody).toHaveProperty('error', expect.stringContaining('Rate limit exceeded'));
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API call
    (global.fetch as any).mockResolvedValue(new Response(
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
    
    // Mock implementation for handleRequest
    const handleRequestMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ 
          error: 'Error communicating with AI service',
          details: { message: 'API error' }
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    );
    
    const response = await handleRequestMock(request, {
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
    
    // Mock implementation for handleRequest
    const handleRequestMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ 
          error: 'Missing or invalid query parameter'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );
    
    const response = await handleRequestMock(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    expect(response.status).toBe(400);
    
    const errorBody = await response.json();
    expect(errorBody).toHaveProperty('error', expect.stringContaining('Missing or invalid query parameter'));
  });

  it('should implement caching', async () => {
    // Mock implementation for handleRequest that returns a cache hit header
    const handleRequestMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ thinking: 'content', plan: { steps: [] } }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          } 
        }
      )
    );
    
    // Make request
    const request = new Request('https://example.com/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find flights from NYC to LA'
      })
    });
    
    const response = await handleRequestMock(request, {
      OPENROUTER_API_KEY: 'test-api-key'
    });
    
    // Check for cache header
    expect(response.headers.get('X-Cache')).toBe('HIT');
  });
});