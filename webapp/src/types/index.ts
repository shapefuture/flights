// Define enhanced types with more detailed flight information

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
  
  // Enhanced data
  flightNumber?: string;
  operatingAirline?: string;
  aircraftType?: string;
  cabinClass?: string;
  fareType?: string;
  distance?: string;
  
  // Layover information
  layovers?: LayoverInfo[];
  
  // Additional detailed information
  luggage?: LuggageInfo;
  amenities?: AmenitiesInfo;
  environmentalImpact?: string;
  cancellationPolicy?: string;
  changePolicy?: string;
  notes?: string;
}

export interface DetailedFlightInfo extends FlightResult {
  // Added to ensure we have required fields for detailed view
  flightNumber: string;
  operatingAirline: string;
  aircraftType: string;
  layovers: LayoverInfo[];
  luggage: LuggageInfo;
  amenities: AmenitiesInfo;
}

export interface LayoverInfo {
  airport: string;
  duration: string;
  arrivalTime: string;
  departureTime: string;
  terminal?: string;
  gate?: string;
}

export interface LuggageInfo {
  carryOn: string;
  checkedBags: string;
  overweight?: string;
  extraBagCost?: string;
}

export interface AmenitiesInfo {
  wifi: boolean;
  powerOutlets: boolean;
  seatPitch: string;
  entertainment: string;
  meals: string;
  legroom?: string;
  seatRecline?: string;
}

export interface FlightQuery {
  origin: string;
  dest: string;
  depDate: string;
  retDate?: string;
  numAdults: number;
  numChildren?: number;
  numInfants?: number;
  cabinClass?: 'economy' | 'premium' | 'business' | 'first';
  
  // Enhanced query parameters
  preferredAirlines?: string[];
  maxStops?: number;
  maxPrice?: number;
  timeRange?: {
    departure?: [number, number]; // 24h format, e.g. [8, 12] for 8am-12pm
    arrival?: [number, number];
  };
  
  // Advanced preferences
  luggage?: {
    carryOn?: number;
    checkedBags?: number;
  };
  seatPreference?: {
    extraLegroom?: boolean;
    exitRow?: boolean;
    window?: boolean;
    aisle?: boolean;
  };
  amenities?: {
    wifi?: boolean;
    power?: boolean;
    entertainment?: boolean;
    mealPreference?: string;
  };
  cancellationPolicy?: 'refundable' | 'changeable' | 'any';
}