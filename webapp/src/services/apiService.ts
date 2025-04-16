// Define interfaces for API requests and responses
interface AgentRequest {
  query: string;
  context?: object;
}

interface AgentResponse {
  thinking?: string;
  plan?: any;
  error?: string;
}

/**
 * Call the agent API to process a natural language query
 * 
 * @param query - The natural language query from the user
 * @param context - Optional context for refining requests or handling errors
 * @returns The processed response from the LLM
 */
export async function callAgentApi(query: string, context?: object): Promise<AgentResponse> {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling agent API:', error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: 'Unknown error occurred' };
  }
}