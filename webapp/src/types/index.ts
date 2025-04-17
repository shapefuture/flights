export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string; // ISO/Date String
  returnDate: string;    // ISO/Date String
  passengers: number;
  cabinClass: string;
}