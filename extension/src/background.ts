import { encodeFlightQuery, decodeFlightResponse, FlightQuery, FlightResult } from './protobufService';
import { fetchGoogleFlightsData, generateGoogleFlightsLink } from './googleFlightsApi';

// Enable structured cloning for large messages
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flight Finder Helper Extension Installed/Updated');
  
  // Initialize storage with version info
  chrome.storage.local.set({ 
    version: '0.1.0',
    lastUpdated: new Date().toISOString(),
    searchesCompleted: 0,
    errors: []
  }).then(() => {
    console.log('Extension storage initialized');
  }).catch(error => {
    console.error('Failed to initialize extension storage:', error);
  });
});

// Keep track of active fetches to allow cancellation
let activeFetches: AbortController[] = [];
let isProcessingBatch = false;

// Maximum number of stored errors
const MAX_STORED_ERRORS = 50;

/**
 * Log error to storage for debugging
 */
function logError(error: any, context: string = 'unknown'): void {
  const errorObj = {
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    data: error
  };
  
  console.error(`[${context}] Error:`, errorObj);
  
  chrome.storage.local.get(['errors']).then(result => {
    let errors = result.errors || [];
    errors.unshift(errorObj);
    
    // Keep only the most recent MAX_STORED_ERRORS
    if (errors.length > MAX_STORED_ERRORS) {
      errors = errors.slice(0, MAX_STORED_ERRORS);
    }
    
    chrome.storage.local.set({ errors });
  }).catch(storageError => {
    console.error('Failed to store error in storage:', storageError);
  });
}

/**
 * Send message to a specific tab with error handling
 */
async function sendMessageToTab(tabId: number, message: any): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    console.log(`Message sent to tab ${tabId}:`, message);
  } catch (error) {
    console.error(`Failed to send message to tab ${tabId}:`, error);
    logError(error, 'sendMessageToTab');
  }
}

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Received message from web app:', message, 'from:', sender);
  
  // Immediately respond to acknowledge receipt
  sendResponse({ received: true });
  
  // Process message based on type
  try {
    if (message.type === 'CHECK_EXTENSION_STATUS') {
      handleStatusCheck(sender, sendResponse);
      return true; // Keep messaging channel open
    }
    
    if (message.type === 'EXECUTE_FETCH') {
      handleExecuteFetch(message.payload.queries, sender.tab?.id);
      return true; // Keep messaging channel open
    }
    
    if (message.type === 'CANCEL_FETCH') {
      handleCancelFetch();
      return true; // Keep messaging channel open
    }
    
    // Unknown message type
    console.warn('Unknown message type:', message.type);
    return false;
  } catch (error) {
    logError(error, 'onMessageExternalListener');
    return false;
  }
});

/**
 * Handle extension status check
 */
function handleStatusCheck(sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void {
  try {
    sendResponse({
      payload: {
        installed: true,
        active: true,
        version: chrome.runtime.getManifest().version
      }
    });
    
    console.log('Sent extension status to:', sender);
  } catch (error) {
    logError(error, 'handleStatusCheck');
    sendResponse({
      payload: {
        installed: true,
        active: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Handle flight fetch execution
 */
async function handleExecuteFetch(queries: FlightQuery[], tabId?: number): Promise<void> {
  if (!tabId) {
    console.error('No tab ID provided, cannot send results back');
    return;
  }
  
  console.log(`Starting batch processing for ${queries.length} queries`);
  
  // If already processing, don't start a new batch
  if (isProcessingBatch) {
    console.warn('Already processing a batch, cannot start a new one');
    await sendMessageToTab(tabId, {
      type: 'FETCH_ERROR',
      payload: {
        error: 'Already processing a batch of queries, please wait or cancel the current batch'
      }
    });
    return;
  }
  
  isProcessingBatch = true;
  
  try {
    // Process the batch
    await processBatch(queries, tabId);
    
  } catch (error) {
    logError(error, 'handleExecuteFetch');
    
    // Send error back to the tab
    await sendMessageToTab(tabId, {
      type: 'FETCH_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error processing batch'
      }
    });
  } finally {
    isProcessingBatch = false;
  }
}

/**
 * Handle fetch cancellation
 */
function handleCancelFetch(): void {
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
  isProcessingBatch = false;
  
  console.log('All fetches cancelled');
}

/**
 * Process a batch of flight queries
 */
async function processBatch(queries: FlightQuery[], tabId: number): Promise<void> {
  console.log(`Processing batch of ${queries.length} queries for tab ${tabId}`);
  
  // Increment search count
  incrementSearchCount();
  
  // Process each query sequentially with delay between requests
  for (let i = 0; i < queries.length; i++) {
    // Exit early if processing was cancelled
    if (activeFetches.length === 0 && !isProcessingBatch) {
      console.log('Batch processing was cancelled, exiting early');
      break;
    }
    
    const query = queries[i];
    console.log(`Processing query ${i+1}/${queries.length}:`, query);
    
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
        await sendMessageToTab(tabId, {
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
        await cacheFlightData(query, results);
        
        // Remove this controller from the active fetches
        activeFetches = activeFetches.filter(c => c !== controller);
        
        // Send the results back to the web app
        await sendMessageToTab(tabId, {
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
      
      // Log the error
      logError(error, `processBatch:${query.origin}-${query.dest}`);
      
      // Send error back to the web app
      await sendMessageToTab(tabId, {
        type: 'FETCH_ERROR',
        payload: {
          query,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
  
  // Send batch complete message
  await sendMessageToTab(tabId, {
    type: 'BATCH_COMPLETE'
  });
  
  console.log('Batch processing complete');
}

/**
 * Increment the search count in storage
 */
async function incrementSearchCount(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['searchesCompleted']);
    const searchesCompleted = (result.searchesCompleted || 0) + 1;
    await chrome.storage.local.set({ searchesCompleted });
    console.log(`Search count incremented to ${searchesCompleted}`);
  } catch (error) {
    console.error('Failed to increment search count:', error);
  }
}

/**
 * Get cached flight data for a query
 */
async function getCachedFlightData(query: FlightQuery): Promise<FlightResult[] | null> {
  try {
    const cacheKey = `flight_${query.origin}_${query.dest}_${query.depDate}_${query.retDate || 'oneway'}`;
    
    const result = await chrome.storage.local.get([cacheKey]);
    if (result && result[cacheKey]) {
      const cachedData = result[cacheKey];
      
      // Check if the cache is still valid (less than 4 hours old)
      const cacheTime = new Date(cachedData.timestamp).getTime();
      const now = new Date().getTime();
      const fourHoursMs = 4 * 60 * 60 * 1000;
      
      if (now - cacheTime < fourHoursMs) {
        console.log(`Cache hit for ${cacheKey}, ${((now - cacheTime) / 60000).toFixed(2)} minutes old`);
        return cachedData.results;
      } else {
        console.log(`Cache expired for ${cacheKey}, ${((now - cacheTime) / 3600000).toFixed(2)} hours old`);
        return null; // Cache expired
      }
    } else {
      console.log(`Cache miss for ${cacheKey}`);
      return null; // No cache
    }
  } catch (error) {
    logError(error, 'getCachedFlightData');
    console.error('Error getting cached flight data:', error);
    return null; // Return null on error
  }
}

/**
 * Cache flight data for a query
 */
async function cacheFlightData(query: FlightQuery, results: FlightResult[]): Promise<void> {
  try {
    const cacheKey = `flight_${query.origin}_${query.dest}_${query.depDate}_${query.retDate || 'oneway'}`;
    
    await chrome.storage.local.set({
      [cacheKey]: {
        results,
        timestamp: new Date().toISOString(),
        query
      }
    });
    
    console.log(`Cached results for ${cacheKey}`);
  } catch (error) {
    logError(error, 'cacheFlightData');
    console.error('Error caching flight data:', error);
  }
}

/**
 * Fetch flight data for a single query
 * In development/testing mode, returns simulated data
 */
async function fetchFlightData(query: FlightQuery, signal?: AbortSignal): Promise<FlightResult[]> {
  console.log('Fetching flight data for:', query);
  
  try {
    // Simulate network delay
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 1500 + Math.random() * 1500);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Fetch aborted by the user', 'AbortError'));
        });
      }
    });
    
    // Check if aborted during delay
    if (signal?.aborted) {
      throw new DOMException('Fetch aborted by the user', 'AbortError');
    }
    
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
    // Don't log abort errors as they're expected
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      logError(error, 'fetchFlightData');
    }
    
    console.error('Error in fetchFlightData:', error);
    throw error;
  }
}

/**
 * Generate mock flight results for testing
 */
function generateMockResults(query: FlightQuery): FlightResult[] {
  console.log('Generating mock results for:', query);
  
  try {
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
    
  } catch (error) {
    logError(error, 'generateMockResults');
    console.error('Error generating mock results:', error);
    
    // Return a minimal valid result set on error
    return [{
      price: `$500`,
      duration: `5h 0m`,
      stops: 0,
      airline: 'Error Airways',
      departure: '12:00',
      arrival: '17:00',
      origin: query.origin,
      destination: query.dest,
      departureDate: query.depDate,
      returnDate: query.retDate
    }];
  }
}

/**
 * Generate link as a fallback
 */
function getFallbackLink(query: FlightQuery): string {
  try {
    return generateGoogleFlightsLink({
      origin: query.origin,
      dest: query.dest,
      depDate: query.depDate,
      retDate: query.retDate,
      numAdults: query.numAdults
    });
  } catch (error) {
    logError(error, 'getFallbackLink');
    console.error('Error generating fallback link:', error);
    
    // Return a basic link on error
    return `https://www.google.com/flights?q=flights+from+${query.origin}+to+${query.dest}`;
  }
}