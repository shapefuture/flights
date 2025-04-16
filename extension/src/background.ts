import { encodeFlightQuery, decodeFlightResponse, FlightQuery, FlightResult } from './protobufService';
import { fetchGoogleFlightsData, generateGoogleFlightsLink } from './googleFlightsApi';

// Enable structured cloning for large messages
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flight Finder Helper Extension Installed/Updated');
  
  // Initialize storage with version info
  chrome.storage.local.set({ 
    version: '0.1.0',
    lastUpdated: new Date().toISOString()
  });
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
      // Check if we have cached results for this query
      const cachedResults = await getCachedFlightData(query);
      
      if (cachedResults) {
        console.log('Using cached results for', query);
        
        // Remove this controller from the active fetches
        activeFetches = activeFetches.filter(c => c !== controller);
        
        // Send the cached results back to the web app
        chrome.tabs.sendMessage(tabId, {
          type: 'FETCH_RESULT',
          payload: {
            query,
            results: cachedResults,
            fromCache: true
          }
        });
        
      } else {
        // Fetch fresh data
        const results = await fetchFlightData(query, controller.signal);
        
        // Cache the results
        cacheFlightData(query, results);
        
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
      }
      
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
 * Get cached flight data for a query
 */
async function getCachedFlightData(query: FlightQuery): Promise<FlightResult[] | null> {
  return new Promise((resolve) => {
    const cacheKey = `flight_${query.origin}_${query.dest}_${query.depDate}_${query.retDate || 'oneway'}`;
    
    chrome.storage.local.get([cacheKey], (result) => {
      if (result && result[cacheKey]) {
        const cachedData = result[cacheKey];
        
        // Check if the cache is still valid (less than 4 hours old)
        const cacheTime = new Date(cachedData.timestamp).getTime();
        const now = new Date().getTime();
        const fourHoursMs = 4 * 60 * 60 * 1000;
        
        if (now - cacheTime < fourHoursMs) {
          resolve(cachedData.results);
        } else {
          resolve(null); // Cache expired
        }
      } else {
        resolve(null); // No cache
      }
    });
  });
}

/**
 * Cache flight data for a query
 */
function cacheFlightData(query: FlightQuery, results: FlightResult[]): void {
  const cacheKey = `flight_${query.origin}_${query.dest}_${query.depDate}_${query.retDate || 'oneway'}`;
  
  chrome.storage.local.set({
    [cacheKey]: {
      results,
      timestamp: new Date().toISOString()
    }
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
    
    // Generate layover airports and durations if there are stops
    let layoverAirports: string[] = [];
    let layoverDurations: string[] = [];
    
    if (stops > 0) {
      const allAirports = ['ATL', 'ORD', 'DFW', 'DEN', 'FRA', 'AMS', 'CDG', 'MAD', 'DXB'];
      
      for (let j = 0; j < stops; j++) {
        // Choose a random airport that's not the origin or destination
        let layoverAirport;
        do {
          layoverAirport = allAirports[Math.floor(Math.random() * allAirports.length)];
        } while (layoverAirport === query.origin || layoverAirport === query.dest || layoverAirports.includes(layoverAirport));
        
        layoverAirports.push(layoverAirport);
        
        // Generate a random layover duration (30m-3h)
        const layoverMinutes = Math.floor(Math.random() * 150) + 30;
        layoverDurations.push(
          layoverMinutes >= 60 
            ? `${Math.floor(layoverMinutes / 60)}h ${layoverMinutes % 60}m` 
            : `${layoverMinutes}m`
        );
      }
    }
    
    // Choose a cabin class based on query or random
    const cabinClasses = ['Economy', 'Premium Economy', 'Business', 'First'];
    const cabinClass = query.cabinClass 
      ? query.cabinClass.charAt(0).toUpperCase() + query.cabinClass.slice(1) 
      : cabinClasses[Math.floor(Math.random() * cabinClasses.length)];
    
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
      returnDate: query.retDate,
      layoverAirports: stops > 0 ? layoverAirports : undefined,
      layoverDurations: stops > 0 ? layoverDurations : undefined,
      cabinClass
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