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
            cabinClass: parameters.cabinClass || 'economy'
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
            cabinClass: parameters.cabinClass || 'economy'
          });
        }
      }
    }
  }
  
  return queries;
}