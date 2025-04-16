import { encodeFlightQuery, decodeFlightResponse, FlightQuery, FlightResult } from './protobufService';
import { fetchGoogleFlightsData, generateGoogleFlightsLink } from './googleFlightsApi';

// Enable structured cloning for large messages
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flight Finder Helper Extension Installed/Updated');
});

// Keep track of active fetches to allow cancellation
let activeFetches: AbortController[] = [];

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Received message from web app:', message, 'from:', sender);
  
  // Check extension status
  if (message.type === 'CHECK_EXTENSION_STATUS') {
    sendResponse({
      payload: {
        installed: true,
        active: true
      }
    });
    return true; // Required for async response
  }
  
  // Handle flight data fetch requests
  if (message.type === 'EXECUTE_FETCH') {
    // Send immediate acknowledgment
    sendResponse({ received: true });
    
    // Process the batch of queries
    processBatch(message.payload.queries, sender.tab?.id);
    
    return true; // Required for async response
  }
  
  // Handle cancellation requests
  if (message.type === 'CANCEL_FETCH') {
    console.log('Cancelling all fetches');
    
    // Abort all active fetches
    activeFetches.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        console.error('Error aborting fetch:', e);
      }
    });
    
    // Clear the array
    activeFetches = [];
    
    sendResponse({ cancelled: true });
    return true;
  }
  
  return false;
});

/**
 * Process a batch of flight queries
 */
async function processBatch(queries: FlightQuery[], tabId?: number) {
  if (!tabId) {
    console.error('No tab ID provided, cannot send results back');
    return;
  }
  
  // Process each query sequentially with delay between requests
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    
    // Create an abort controller for this fetch
    const controller = new AbortController();
    activeFetches.push(controller);
    
    try {
      // Use simulated data for development/testing
      const results = await fetchFlightData(query, controller.signal);
      
      // Remove this controller from the active fetches
      activeFetches = activeFetches.filter(c => c !== controller);
      
      // Send the results back to the web app
      chrome.tabs.sendMessage(tabId, {
        type: 'FETCH_RESULT',
        payload: {
          query,
          results
        }
      });
      
      // Add a delay before the next query to avoid rate limiting
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      }
      
    } catch (error) {
      // Remove this controller from the active fetches
      activeFetches = activeFetches.filter(c => c !== controller);
      
      // Check if this was an abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Fetch aborted');
        break; // Stop processing the batch
      }
      
      // Send error back to the web app
      chrome.tabs.sendMessage(tabId, {
        type: 'FETCH_ERROR',
        payload: {
          query,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
  
  // Send batch complete message
  chrome.tabs.sendMessage(tabId, {
    type: 'BATCH_COMPLETE'
  });
}

/**
 * Fetch flight data for a single query
 * In development/testing mode, returns simulated data
 */
async function fetchFlightData(query: FlightQuery, signal?: AbortSignal): Promise<FlightResult[]> {
  // For development, simulate a delay and return mock data
  // In production, we would use the actual protobuf encoder/decoder
  
  // Simulate network delay
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1500 + Math.random() * 1500);
    
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    }
  });
  
  // Check if aborted during delay
  if (signal?.aborted) {
    throw new DOMException('Fetch aborted by the user', 'AbortError');
  }
  
  try {
    // In a real implementation:
    // 1. Encode the query to a protobuf format
    // const encodedQuery = encodeFlightQuery(query);
    
    // 2. Fetch data from Google Flights
    // const responseData = await fetchGoogleFlightsData(encodedQuery);
    
    // 3. Decode the response data
    // return decodeFlightResponse(responseData);
    
    // For now, return simulated data
    return generateMockResults(query);
    
  } catch (error) {
    console.error('Error in fetchFlightData:', error);
    throw error;
  }
}

/**
 * Generate mock flight results for testing
 */
function generateMockResults(query: FlightQuery): FlightResult[] {
  const results: FlightResult[] = [];
  
  // Generate a random number of results (3-8)
  const numResults = Math.floor(Math.random() * 6) + 3;
  
  for (let i = 0; i < numResults; i++) {
    // Generate a random price between $200 and $1500
    const price = Math.floor(Math.random() * 1300) + 200;
    
    // Generate a random duration between 2 and 14 hours
    const durationHours = Math.floor(Math.random() * 12) + 2;
    const durationMinutes = Math.floor(Math.random() * 60);
    
    // Generate a random number of stops (0-2)
    const stops = Math.floor(Math.random() * 3);
    
    // Choose a random airline
    const airlines = ['Delta', 'American Airlines', 'United', 'JetBlue', 'British Airways', 'Lufthansa', 'Air France'];
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    
    // Generate random departure time
    const departureHour = Math.floor(Math.random() * 24);
    const departureMinute = Math.floor(Math.random() * 60);
    const departureFormatted = `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`;
    
    // Calculate arrival time based on departure and duration
    const arrivalHour = (departureHour + durationHours) % 24;
    const arrivalMinute = (departureMinute + durationMinutes) % 60;
    const arrivalFormatted = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`;
    
    results.push({
      price: `$${price}`,
      duration: `${durationHours}h ${durationMinutes}m`,
      stops,
      airline,
      departure: departureFormatted,
      arrival: arrivalFormatted,
      origin: query.origin,
      destination: query.dest,
      departureDate: query.depDate,
      returnDate: query.retDate
    });
  }
  
  // Sort by price
  return results.sort((a, b) => {
    const priceA = parseInt(a.price.replace(/\D/g, ''));
    const priceB = parseInt(b.price.replace(/\D/g, ''));
    return priceA - priceB;
  });
}

// Generate link as a fallback
function getFallbackLink(query: FlightQuery): string {
  return generateGoogleFlightsLink({
    origin: query.origin,
    dest: query.dest,
    depDate: query.depDate,
    retDate: query.retDate,
    numAdults: query.numAdults
  });
}