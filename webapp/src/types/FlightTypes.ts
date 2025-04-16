// Common flight-related type definitions

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightDate {
  date: string;
  time?: string;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  formatted: string;
}

export interface Airline {
  code: string;
  name: string;
  logo?: string;
}

export interface FlightSegment {
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureDate: FlightDate;
  arrivalDate: FlightDate;
  flightNumber: string;
  airline: Airline;
  duration: number; // in minutes
  cabin: string;
}

// Simplified FlightQuery interface (from the original flightTypes.ts)
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

// Base FlightResult interface that works with both legacy and new implementations
export interface FlightResult {
  // Required fields
  id?: string;
  price: string | PriceInfo;
  flightNumber?: string;
  
  // Fields used in the mock implementation
  origin?: string;
  destination?: string;
  departure?: string;
  arrival?: string;
  airline?: string;
  duration?: string;
  departureDate?: string;
  returnDate?: string;
  stops?: number;
  
  // Fields used in the new implementation
  segments?: FlightSegment[];
  totalDuration?: number;
  layovers?: number | any[];
}

// Enhanced DetailedFlightInfo with all fields from mock implementation
export interface DetailedFlightInfo extends FlightResult {
  // Original required fields
  id?: string;
  flightNumber: string;
  
  // New required fields from the type definition
  baggage?: {
    checkedBags: number;
    carryOn: number;
  };
  refundable?: boolean;
  seatsAvailable?: number;
  bookingLink?: string;
  
  // Additional fields used in the app
  operatingAirline?: string;
  aircraftType?: string;
  cabinClass?: string;
  fareType?: string;
  distance?: string;
  layovers?: any[];
  luggage?: {
    carryOn: string;
    checkedBags: string;
  };
  amenities?: {
    wifi: boolean;
    powerOutlets: boolean;
    seatPitch: string;
    entertainment: string;
    meals: string;
  };
  environmentalImpact?: string;
  cancellationPolicy?: string;
  changePolicy?: string;
}

// Query-related types
export interface DateRange {
  start: string;
  end: string;
}

export interface QueryParameters {
  origins: string[];
  destinations: string[];
  departureDateRange: DateRange | string;
  returnDateRange?: DateRange | string;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  adults?: number;
  numAdults?: number; // Alias for backward compatibility
  children?: number;
  numChildren?: number; // Alias for backward compatibility
  infants?: number;
  numInfants?: number; // Alias for backward compatibility
  directOnly?: boolean;
  maxStops?: number;
  maxPrice?: number;
}

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

// API related types
export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface APIErrorResponse {
  message: string;
  status: number;
  code?: string;
}

export class APIError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}