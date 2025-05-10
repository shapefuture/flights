export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string; // ISO/Date String
  returnDate: string;    // ISO/Date String
  passengers: number;
  cabinClass: string;
}

// Add missing types mentioned in error messages
export interface DetailedFlightInfo {
  price: string;
  duration: string;
  stops: number;
  airline: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  flightNumber?: string;
  operatingAirline?: string;
  aircraftType?: string;
  cabinClass?: string;
  fareType?: string;
  distance?: string;
  layovers?: {
    airport: string;
    duration: string;
    arrivalTime: string;
    departureTime: string;
  }[];
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
  notes?: string;
}

// Add FlightResult type for virtualized-flight-list component
export interface FlightResult extends DetailedFlightInfo {
  id?: string;
}

// Add FlightQuery type for priceAlertService
export interface FlightQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
}