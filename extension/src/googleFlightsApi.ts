import { base64ToBuffer } from './protobufService';

/**
 * Fetch flight data from Google Flights
 * This is a simplified implementation that would need to be expanded based on actual
 * Google Flights API behavior discovered through reverse engineering
 */
export async function fetchGoogleFlightsData(tfsParam: string): Promise<Uint8Array> {
  try {
    // Construct the URL with the encoded parameters
    const url = `https://www.google.com/travel/flights/search?tfs=${tfsParam}&hl=en&gl=us`;
    
    // Fetch the page
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    // Get the response text
    const text = await response.text();
    
    // This is where the real implementation would parse the HTML response
    // to locate the embedded protobuf data. For this example, we'll simulate
    // finding the data and decoding it.
    
    // Example: Extract data from a specific script tag with a known pattern
    const dataMatch = text.match(/AF_initDataCallback\({key: 'ds:0', isError: false, data: "([^"]+)"}/);
    
    if (!dataMatch || !dataMatch[1]) {
      throw new Error('Could not find flight data in the response');
    }
    
    // The extracted data might be encoded in various ways (base64, escaped JSON, etc.)
    // For this example, we'll assume it's base64 encoded
    return base64ToBuffer(dataMatch[1]);
    
  } catch (error) {
    console.error('Error fetching Google Flights data:', error);
    throw error;
  }
}

/**
 * Generate a direct URL to Google Flights for a specific query
 * This provides a fallback option when the extension can't fetch protobuf data
 */
export function generateGoogleFlightsLink(query: {
  origin: string,
  dest: string,
  depDate: string,
  retDate?: string,
  numAdults?: number
}): string {
  // Determine if this is a one-way or round-trip
  const isRoundTrip = !!query.retDate;
  
  // Build the URL parameters
  const params = new URLSearchParams();
  params.set('hl', 'en'); // Language
  params.set('gl', 'us'); // Region
  
  if (isRoundTrip) {
    params.set('curr', 'USD');
    params.set('tfs', 'r'); // Round trip
    params.set(`f.${query.origin}.${query.dest}.${query.depDate}`); // Outbound
    params.set(`f.${query.dest}.${query.origin}.${query.retDate}`); // Return
  } else {
    params.set('curr', 'USD');
    params.set('tfs', 'o'); // One way
    params.set(`f.${query.origin}.${query.dest}.${query.depDate}`); // Outbound
  }
  
  // Add passenger count if provided
  if (query.numAdults && query.numAdults > 1) {
    params.set('tfs', `p${query.numAdults}`);
  }
  
  return `https://www.google.com/travel/flights?${params.toString()}`;
}