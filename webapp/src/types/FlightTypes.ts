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

export interface FlightResult {
  id: string;
  segments: FlightSegment[];
  price: PriceInfo;
  totalDuration: number; // in minutes
  layovers?: number;
  flightNumber?: string; // Optional in FlightResult
}

export interface DetailedFlightInfo extends Omit<FlightResult, 'flightNumber'> {
  flightNumber: string; // Required in DetailedFlightInfo
  baggage: {
    checkedBags: number;
    carryOn: number;
  };
  refundable: boolean;
  seatsAvailable: number;
  bookingLink?: string;
}

// Query-related types
export interface DateRange {
  start: string;
  end: string;
}

export interface QueryParameters {
  origins: string[];
  destinations: string[];
  departureDateRange: DateRange;
  returnDateRange?: DateRange;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  adults?: number;
  children?: number;
  infants?: number;
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