import * as protobuf from 'protobufjs';

// Define interfaces for our query and result objects
export interface FlightQuery {
  origin: string;
  dest: string;
  depDate: string;
  retDate?: string;
  numAdults?: number;
  numChildren?: number;
  numInfants?: number;
  cabinClass?: string;
}

export interface FlightResult {
  price: string;
  duration: string;
  stops: number;
  airline: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  layoverAirports?: string[];
  layoverDurations?: string[];
  cabinClass?: string;
}

// This is a simplified implementation of Google Flights protobuf
// In a real implementation, you would need to reverse engineer the actual protobuf schema
// using DevTools and examining the XHR requests to Google Flights

// Create a protobuf root to define our message types
const root = protobuf.Root.fromJSON({
  nested: {
    FlightRequest: {
      fields: {
        origin: { type: "string", id: 1 },
        destination: { type: "string", id: 2 },
        departureDate: { type: "string", id: 3 },
        returnDate: { type: "string", id: 4 },
        adults: { type: "int32", id: 5 },
        children: { type: "int32", id: 6 },
        infants: { type: "int32", id: 7 },
        cabinClass: { type: "int32", id: 8 }
      }
    },
    FlightResponse: {
      fields: {
        results: { rule: "repeated", type: "FlightResult", id: 1 }
      }
    },
    FlightResult: {
      fields: {
        price: { type: "int32", id: 1 }, // price in cents
        currency: { type: "string", id: 2 },
        durationMinutes: { type: "int32", id: 3 },
        stops: { type: "int32", id: 4 },
        airline: { type: "string", id: 5 },
        departureTime: { type: "int64", id: 6 }, // timestamp
        arrivalTime: { type: "int64", id: 7 }, // timestamp
        origin: { type: "string", id: 8 },
        destination: { type: "string", id: 9 },
        departureDate: { type: "string", id: 10 },
        returnDate: { type: "string", id: 11 },
        layoverAirports: { rule: "repeated", type: "string", id: 12 },
        layoverDurations: { rule: "repeated", type: "string", id: 13 },
        cabinClass: { type: "string", id: 14 }
      }
    }
  }
});

// Get the message types
const FlightRequest = root.lookupType("FlightRequest");
const FlightResponse = root.lookupType("FlightResponse");

/**
 * Encode a flight query into a Google Flights compatible protobuf format
 * In reality, the encoding would be much more complex and follow Google's schema
 */
export function encodeFlightQuery(query: FlightQuery): string {
  // Map cabin class string to integer (these are placeholder values)
  const cabinClassMap: Record<string, number> = {
    'economy': 1,
    'premium_economy': 2,
    'business': 3,
    'first': 4
  };
  
  // Create the message payload
  const payload = {
    origin: query.origin,
    destination: query.dest,
    departureDate: query.depDate,
    returnDate: query.retDate || "",
    adults: query.numAdults || 1,
    children: query.numChildren || 0,
    infants: query.numInfants || 0,
    cabinClass: cabinClassMap[query.cabinClass || 'economy'] || 1
  };
  
  // Verify the payload
  const errorMsg = FlightRequest.verify(payload);
  if (errorMsg) {
    throw new Error(`Invalid flight query: ${errorMsg}`);
  }
  
  // Create the message
  const message = FlightRequest.create(payload);
  
  // Encode the message
  const buffer = FlightRequest.encode(message).finish();
  
  // Convert to Base64
  return bufferToBase64(buffer);
}

/**
 * Decode a Google Flights protobuf response
 * In reality, the parsing would be much more complex
 */
export function decodeFlightResponse(data: Uint8Array): FlightResult[] {
  try {
    // Decode the response
    const decodedResponse = FlightResponse.decode(data);
    
    // Convert to plain JavaScript object
    const response = FlightResponse.toObject(decodedResponse, {
      longs: String,
      enums: String,
      bytes: String,
    });
    
    // Format the results
    return (response.results || []).map((result: any) => {
      // Format the price (convert cents to dollars)
      const price = `$${(result.price / 100).toFixed(2)}`;
      
      // Format the duration (convert minutes to hours and minutes)
      const hours = Math.floor(result.durationMinutes / 60);
      const minutes = result.durationMinutes % 60;
      const duration = `${hours}h ${minutes}m`;
      
      // Format departure and arrival times
      const departure = new Date(Number(result.departureTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const arrival = new Date(Number(result.arrivalTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return {
        price,
        duration,
        stops: result.stops,
        airline: result.airline,
        departure,
        arrival,
        origin: result.origin,
        destination: result.destination,
        departureDate: result.departureDate,
        returnDate: result.returnDate,
        layoverAirports: result.layoverAirports,
        layoverDurations: result.layoverDurations,
        cabinClass: result.cabinClass
      };
    });
  } catch (error) {
    console.error('Error decoding flight response:', error);
    throw error;
  }
}

/**
 * Convert a Uint8Array to a Base64 string
 */
function bufferToBase64(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a Base64 string to a Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}