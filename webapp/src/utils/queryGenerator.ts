import { addDays, format, parse, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Type for flight search queries
export interface FlightQuery {
  origin: string;
  dest: string;
  depDate: string;
  retDate?: string;
  numAdults?: number;
  numChildren?: number;
  numInfants?: number;
  cabinClass?: string;
  // Enhanced preferences
  maxPrice?: number;
  maxStops?: number;
  preferredAirlines?: string[];
  excludedAirlines?: string[];
  luggagePreference?: LuggagePreference;
  seatPreference?: SeatPreference;
  mealPreference?: string;
  minLayoverTime?: number; // In minutes
  maxLayoverTime?: number; // In minutes
  preferredAirports?: string[];
  excludedAirports?: string[];
  timePreferences?: TimePreferences;
  flexibleDates?: boolean;
  priorityBoarding?: boolean;
  refundable?: boolean;
  directFlightsOnly?: boolean;
}

// Types for luggage preferences
export interface LuggagePreference {
  checkedBags?: number;
  carryOn?: boolean;
  personalItem?: boolean;
  extraWeight?: boolean; // For travelers needing extra baggage weight
  sportEquipment?: string; // For special equipment like skis, golf clubs, etc.
}

// Types for seat preferences
export interface SeatPreference {
  position?: 'window' | 'aisle' | 'middle';
  section?: 'front' | 'middle' | 'back' | 'emergency' | 'bulkhead';
  extraLegroom?: boolean;
  prefersTogether?: boolean; // For group travel, prefer seats together
}

// Types for time preferences
export interface TimePreferences {
  departureTimeRange?: [number, number]; // 24 hour format, e.g. [8, 12] for 8 AM to 12 PM
  arrivalTimeRange?: [number, number];
  returnDepartureTimeRange?: [number, number];
  returnArrivalTimeRange?: [number, number];
  avoidOvernight?: boolean;
  preferWeekday?: boolean;
  preferWeekend?: boolean;
}

// Helper function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Helper function to parse relative date references
function parseRelativeDateRange(dateRange: string): { startDate: Date, endDate: Date } {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  
  switch (dateRange.toLowerCase()) {
    case 'today':
      return { startDate: today, endDate: today };
    
    case 'tomorrow':
      const tomorrow = addDays(today, 1);
      return { startDate: tomorrow, endDate: tomorrow };
    
    case 'this-week':
      return { startDate: thisWeekStart, endDate: thisWeekEnd };
    
    case 'this-weekend':
      const thisWeekendStart = addDays(thisWeekEnd, -2); // Friday
      return { startDate: thisWeekendStart, endDate: thisWeekEnd };
    
    case 'next-week':
      return { 
        startDate: addDays(thisWeekStart, 7), 
        endDate: addDays(thisWeekEnd, 7) 
      };
    
    case 'next-weekend':
      const nextWeekend = addDays(thisWeekEnd, 7);
      const nextWeekendStart = addDays(nextWeekend, -2); // Friday
      return { startDate: nextWeekendStart, endDate: nextWeekend };
    
    case 'following-weekend':
      const followingWeekend = addDays(thisWeekEnd, 14);
      const followingWeekendStart = addDays(followingWeekend, -2); // Friday
      return { startDate: followingWeekendStart, endDate: followingWeekend };
    
    case 'this-month':
      return { startDate: thisMonthStart, endDate: thisMonthEnd };
    
    case 'next-month':
      const nextMonthStart = addDays(thisMonthEnd, 1);
      const nextMonthEnd = endOfMonth(nextMonthStart);
      return { startDate: nextMonthStart, endDate: nextMonthEnd };
    
    default:
      // If it's a specific date in YYYY-MM-DD format
      const specificDate = parse(dateRange, 'yyyy-MM-dd', new Date());
      if (isValid(specificDate)) {
        return { startDate: specificDate, endDate: specificDate };
      }
      
      // Default to today if can't parse
      return { startDate: today, endDate: today };
  }
}

// Helper function to add flexibility around a date
function addFlexibility(date: Date, flexibility: number): Date[] {
  const dates: Date[] = [date];
  
  for (let i = 1; i <= flexibility; i++) {
    dates.push(addDays(date, i));
    dates.push(addDays(date, -i));
  }
  
  // Sort dates chronologically
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

// Helper function to parse natural language preferences
export function parsePreferences(parameters: any): Partial<FlightQuery> {
  const preferences: Partial<FlightQuery> = {};
  
  // Parse cabin class with alternate forms
  if (parameters.cabinClass) {
    preferences.cabinClass = mapCabinClass(parameters.cabinClass);
  }
  
  // Parse price constraints
  if (parameters.maxPrice && typeof parameters.maxPrice === 'number') {
    preferences.maxPrice = parameters.maxPrice;
  }
  
  // Parse stop preferences
  if (parameters.directFlightsOnly === true || 
      parameters.nonstop === true || 
      parameters.direct === true) {
    preferences.directFlightsOnly = true;
    preferences.maxStops = 0;
  } else if (parameters.maxStops !== undefined) {
    preferences.maxStops = parameters.maxStops;
  }
  
  // Parse airline preferences
  if (parameters.preferredAirlines) {
    preferences.preferredAirlines = Array.isArray(parameters.preferredAirlines) 
      ? parameters.preferredAirlines 
      : [parameters.preferredAirlines];
  }
  
  if (parameters.excludedAirlines) {
    preferences.excludedAirlines = Array.isArray(parameters.excludedAirlines) 
      ? parameters.excludedAirlines 
      : [parameters.excludedAirlines];
  }
  
  // Parse luggage preferences
  const luggagePreference: LuggagePreference = {};
  
  if (parameters.checkedBags !== undefined) {
    luggagePreference.checkedBags = parameters.checkedBags;
  }
  
  if (parameters.carryOn !== undefined) {
    luggagePreference.carryOn = parameters.carryOn;
  }
  
  if (parameters.personalItem !== undefined) {
    luggagePreference.personalItem = parameters.personalItem;
  }
  
  if (parameters.extraWeight !== undefined) {
    luggagePreference.extraWeight = parameters.extraWeight;
  }
  
  if (parameters.sportEquipment) {
    luggagePreference.sportEquipment = parameters.sportEquipment;
  }
  
  // Only set if we have any luggage preferences
  if (Object.keys(luggagePreference).length > 0) {
    preferences.luggagePreference = luggagePreference;
  }
  
  // Parse seat preferences
  const seatPreference: SeatPreference = {};
  
  if (parameters.seatPosition) {
    seatPreference.position = parameters.seatPosition;
  }
  
  if (parameters.seatSection) {
    seatPreference.section = parameters.seatSection;
  }
  
  if (parameters.extraLegroom !== undefined) {
    seatPreference.extraLegroom = parameters.extraLegroom;
  }
  
  if (parameters.seatsTogether !== undefined) {
    seatPreference.prefersTogether = parameters.seatsTogether;
  }
  
  // Only set if we have any seat preferences
  if (Object.keys(seatPreference).length > 0) {
    preferences.seatPreference = seatPreference;
  }
  
  // Parse time preferences
  const timePreferences: TimePreferences = {};
  
  if (parameters.departureTimeRange) {
    timePreferences.departureTimeRange = parameters.departureTimeRange;
  }
  
  if (parameters.arrivalTimeRange) {
    timePreferences.arrivalTimeRange = parameters.arrivalTimeRange;
  }
  
  if (parameters.returnDepartureTimeRange) {
    timePreferences.returnDepartureTimeRange = parameters.returnDepartureTimeRange;
  }
  
  if (parameters.returnArrivalTimeRange) {
    timePreferences.returnArrivalTimeRange = parameters.returnArrivalTimeRange;
  }
  
  if (parameters.avoidOvernight !== undefined) {
    timePreferences.avoidOvernight = parameters.avoidOvernight;
  }
  
  if (parameters.preferWeekday !== undefined) {
    timePreferences.preferWeekday = parameters.preferWeekday;
  }
  
  if (parameters.preferWeekend !== undefined) {
    timePreferences.preferWeekend = parameters.preferWeekend;
  }
  
  // Only set if we have any time preferences
  if (Object.keys(timePreferences).length > 0) {
    preferences.timePreferences = timePreferences;
  }
  
  // Parse other preferences
  if (parameters.mealPreference) {
    preferences.mealPreference = parameters.mealPreference;
  }
  
  if (parameters.minLayoverTime) {
    preferences.minLayoverTime = parameters.minLayoverTime;
  }
  
  if (parameters.maxLayoverTime) {
    preferences.maxLayoverTime = parameters.maxLayoverTime;
  }
  
  if (parameters.preferredAirports) {
    preferences.preferredAirports = Array.isArray(parameters.preferredAirports) 
      ? parameters.preferredAirports 
      : [parameters.preferredAirports];
  }
  
  if (parameters.excludedAirports) {
    preferences.excludedAirports = Array.isArray(parameters.excludedAirports) 
      ? parameters.excludedAirports 
      : [parameters.excludedAirports];
  }
  
  if (parameters.flexibleDates !== undefined) {
    preferences.flexibleDates = parameters.flexibleDates;
  }
  
  if (parameters.priorityBoarding !== undefined) {
    preferences.priorityBoarding = parameters.priorityBoarding;
  }
  
  if (parameters.refundable !== undefined) {
    preferences.refundable = parameters.refundable;
  }
  
  return preferences;
}

// Helper function to map cabin class strings to standardized values
function mapCabinClass(cabinClass: string): string {
  const cabinClassLower = cabinClass.toLowerCase();
  
  if (['economy', 'coach', 'standard', 'basic'].includes(cabinClassLower)) {
    return 'economy';
  }
  
  if (['premium economy', 'premium', 'economy plus'].includes(cabinClassLower)) {
    return 'premium_economy';
  }
  
  if (['business', 'business class'].includes(cabinClassLower)) {
    return 'business';
  }
  
  if (['first', 'first class'].includes(cabinClassLower)) {
    return 'first';
  }
  
  return cabinClassLower;
}

// Main function to generate all flight queries based on parameters
export function generateQueries(parameters: any): FlightQuery[] {
  const queries: FlightQuery[] = [];
  
  // Handle origin(s)
  const origins = parameters.origins || [parameters.origin || 'JFK'];
  
  // Handle destination(s)
  const destinations = parameters.destinations || [parameters.destination || 'LHR'];
  
  // Handle departure date(s)
  let departureDates: Date[] = [];
  
  if (parameters.departureDate) {
    // Single specific date
    const parsedDate = parse(parameters.departureDate, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      departureDates = [parsedDate];
    }
  } else if (parameters.departureDateRange) {
    // Date range (like "next-weekend")
    const { startDate, endDate } = parseRelativeDateRange(parameters.departureDateRange);
    
    // Generate all dates in the range
    let currentDate = startDate;
    while (currentDate <= endDate) {
      departureDates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
  } else {
    // Default to today
    departureDates = [new Date()];
  }
  
  // Add departure date flexibility if specified
  if (parameters.departureDateFlexibility && typeof parameters.departureDateFlexibility === 'number') {
    const flexibility = parameters.departureDateFlexibility;
    const flexibleDates: Date[] = [];
    
    for (const date of departureDates) {
      flexibleDates.push(...addFlexibility(date, flexibility));
    }
    
    // Deduplicate dates
    departureDates = Array.from(new Set(flexibleDates.map(d => d.getTime())))
      .map(time => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());
  }
  
  // Handle return date(s) for round trips
  let returnDates: (Date | null)[] = [null]; // Default to one-way
  
  if (parameters.returnDate) {
    // Single specific date
    const parsedDate = parse(parameters.returnDate, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      returnDates = [parsedDate];
    }
  } else if (parameters.returnDateRange) {
    // Date range (like "following-weekend")
    const { startDate, endDate } = parseRelativeDateRange(parameters.returnDateRange);
    
    // Generate all dates in the range
    let currentDate = startDate;
    returnDates = [];
    while (currentDate <= endDate) {
      returnDates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
  } else if (parameters.stayDuration) {
    // Calculate return dates based on stay duration
    // Will be applied per departure date below
    returnDates = []; // Empty the array, will populate based on departures
  }
  
  // Add return date flexibility if specified
  if (
    parameters.returnDateFlexibility && 
    typeof parameters.returnDateFlexibility === 'number' &&
    returnDates[0] !== null // Only if return dates are specified
  ) {
    const flexibility = parameters.returnDateFlexibility;
    const flexibleDates: Date[] = [];
    
    for (const date of returnDates as Date[]) {
      flexibleDates.push(...addFlexibility(date, flexibility));
    }
    
    // Deduplicate dates
    returnDates = Array.from(new Set(flexibleDates.map(d => d.getTime())))
      .map(time => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());
  }
  
  // Parse all preference parameters
  const preferences = parsePreferences(parameters);
  
  // Generate all combinations
  for (const origin of origins) {
    for (const destination of destinations) {
      for (const departureDate of departureDates) {
        // For stay duration logic
        if (parameters.stayDuration && typeof parameters.stayDuration === 'number') {
          const returnDate = addDays(departureDate, parameters.stayDuration);
          queries.push({
            origin,
            dest: destination,
            depDate: formatDate(departureDate),
            retDate: formatDate(returnDate),
            numAdults: parameters.numAdults || 1,
            numChildren: parameters.numChildren || 0,
            numInfants: parameters.numInfants || 0,
            cabinClass: parameters.cabinClass || 'economy',
            ...preferences
          });
          continue;
        }
        
        // For all other return date logic
        for (const returnDate of returnDates) {
          // Skip invalid combinations (return before departure)
          if (returnDate !== null && returnDate <= departureDate) continue;
          
          queries.push({
            origin,
            dest: destination,
            depDate: formatDate(departureDate),
            retDate: returnDate ? formatDate(returnDate) : undefined,
            numAdults: parameters.numAdults || 1,
            numChildren: parameters.numChildren || 0,
            numInfants: parameters.numInfants || 0,
            cabinClass: parameters.cabinClass || 'economy',
            ...preferences
          });
        }
      }
    }
  }
  
  return queries;
}