import logger from './logger';

/**
 * Interface for the parameters passed to the query generator
 */
export interface QueryParameters {
  origins?: string | string[];
  destinations?: string | string[];
  departureDateRange?: string;
  returnDateRange?: string | null;
  numAdults?: number;
  numChildren?: number;
  numInfants?: number;
  cabinClass?: string;
  maxPrice?: number;
  stayDuration?: number;
  departureDateFlexibility?: number;
  returnDateFlexibility?: number;
}

/**
 * Flight query structure for the flight search
 */
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

/**
 * Error class for query generator errors
 */
export class QueryGeneratorError extends Error {
  parameter?: string;
  
  constructor(message: string, parameter?: string) {
    super(message);
    this.name = 'QueryGeneratorError';
    this.parameter = parameter;
  }
}

/**
 * Validate the parameters to ensure they are valid
 * @param params Parameters to validate
 */
function validateParameters(params: QueryParameters): void {
  // Check that we have both origins and destinations
  if (!params.origins) {
    throw new QueryGeneratorError('No origin specified', 'origins');
  }
  
  if (!params.destinations) {
    throw new QueryGeneratorError('No destination specified', 'destinations');
  }
  
  // Check that we have a departure date range
  if (!params.departureDateRange) {
    throw new QueryGeneratorError('No departure date range specified', 'departureDateRange');
  }
  
  // Validate numbers
  if (params.numAdults !== undefined && (isNaN(params.numAdults) || params.numAdults < 1)) {
    throw new QueryGeneratorError('Invalid number of adults', 'numAdults');
  }
  
  if (params.numChildren !== undefined && (isNaN(params.numChildren) || params.numChildren < 0)) {
    throw new QueryGeneratorError('Invalid number of children', 'numChildren');
  }
  
  if (params.numInfants !== undefined && (isNaN(params.numInfants) || params.numInfants < 0)) {
    throw new QueryGeneratorError('Invalid number of infants', 'numInfants');
  }
  
  // Validate cabin class
  if (params.cabinClass && !['economy', 'premium_economy', 'business', 'first'].includes(params.cabinClass.toLowerCase())) {
    throw new QueryGeneratorError('Invalid cabin class', 'cabinClass');
  }
}

/**
 * Parse date range strings into actual date strings
 * @param dateRange Date range string like "next-weekend", "YYYY-MM-DD", etc.
 * @param isReturn Whether this is for a return date
 * @returns Array of date strings in YYYY-MM-DD format
 */
function parseDateRange(dateRange: string, isReturn: boolean = false): string[] {
  logger.debug(`Parsing date range: ${dateRange} (isReturn: ${isReturn})`);
  
  try {
    // Handle exact dates (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateRange)) {
      return [dateRange];
    }
    
    // Handle one-way flights for return dates
    if (isReturn && (dateRange === 'one-way' || dateRange === null || dateRange === undefined)) {
      return [];
    }
    
    const today = new Date();
    let dates: Date[] = [];
    
    // Handle natural language date ranges
    switch (dateRange.toLowerCase()) {
      case 'next-weekend':
        // Find the next Saturday
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSaturday.getDate() + 1);
        dates = [nextSaturday, nextSunday];
        break;
        
      case 'following-weekend':
        // Find the Saturday after next
        const followingSaturday = new Date(today);
        followingSaturday.setDate(today.getDate() + (6 - today.getDay() + 14) % 14);
        const followingSunday = new Date(followingSaturday);
        followingSunday.setDate(followingSaturday.getDate() + 1);
        dates = [followingSaturday, followingSunday];
        break;
        
      case 'next-week':
        // Start from tomorrow and go for 7 days
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(tomorrow);
          date.setDate(tomorrow.getDate() + i);
          return date;
        });
        break;
        
      case 'next-month':
        // Start from the 1st of next month
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        dates = [nextMonth];
        break;
        
      case 'one-week-later':
        // If this is for a return, get dates 7 days after departure
        if (isReturn) {
          // Note: We should have the departure dates at this point, but this is a simplified version
          const oneWeekLater = new Date(today);
          oneWeekLater.setDate(today.getDate() + 7);
          dates = [oneWeekLater];
        } else {
          throw new QueryGeneratorError('one-week-later is only valid for return dates', 'returnDateRange');
        }
        break;
        
      default:
        // Default to today (but this should be handled more gracefully in a real app)
        logger.warn(`Unknown date range: ${dateRange}, defaulting to today`);
        dates = [today];
    }
    
    // Convert dates to YYYY-MM-DD format
    return dates.map(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
  } catch (error) {
    if (error instanceof QueryGeneratorError) {
      throw error;
    }
    logger.error('Error parsing date range:', error);
    throw new QueryGeneratorError(
      `Failed to parse date range "${dateRange}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      isReturn ? 'returnDateRange' : 'departureDateRange'
    );
  }
}

/**
 * Generate flight queries from natural language parameters
 * @param params Parameters to generate queries from
 * @returns Array of flight queries
 */
export function generateQueries(params: QueryParameters): FlightQuery[] {
  logger.debug('Generating queries from parameters:', params);
  
  try {
    // Validate parameters
    validateParameters(params);
    
    // Normalize parameters
    const origins = Array.isArray(params.origins) ? params.origins : [params.origins!];
    const destinations = Array.isArray(params.destinations) ? params.destinations : [params.destinations!];
    
    // Parse date ranges
    const departureDates = parseDateRange(params.departureDateRange!);
    const returnDates = params.returnDateRange 
      ? parseDateRange(params.returnDateRange, true)
      : [];
    
    logger.debug('Parsed dates:', { departureDates, returnDates });
    
    // Generate all combinations
    const queries: FlightQuery[] = [];
    
    for (const origin of origins) {
      for (const dest of destinations) {
        // Skip if origin and destination are the same
        if (origin === dest) {
          logger.warn(`Skipping query with same origin and destination: ${origin}`);
          continue;
        }
        
        for (const depDate of departureDates) {
          // For one-way flights
          if (returnDates.length === 0) {
            queries.push({
              origin,
              dest,
              depDate,
              numAdults: params.numAdults || 1,
              numChildren: params.numChildren,
              numInfants: params.numInfants,
              cabinClass: params.cabinClass
            });
          } 
          // For round-trip flights
          else {
            for (const retDate of returnDates) {
              // Skip if return date is before or same as departure date
              if (retDate <= depDate) {
                logger.warn(`Skipping query with return date (${retDate}) before departure date (${depDate})`);
                continue;
              }
              
              queries.push({
                origin,
                dest,
                depDate,
                retDate,
                numAdults: params.numAdults || 1,
                numChildren: params.numChildren,
                numInfants: params.numInfants,
                cabinClass: params.cabinClass
              });
            }
          }
        }
      }
    }
    
    // Check if we generated any queries
    if (queries.length === 0) {
      throw new QueryGeneratorError('No valid queries could be generated from the parameters');
    }
    
    logger.debug(`Generated ${queries.length} queries`);
    return queries;
    
  } catch (error) {
    if (error instanceof QueryGeneratorError) {
      logger.error(`Query Generator Error (${error.parameter}):`, error.message);
    } else {
      logger.error('Unexpected error generating queries:', error);
    }
    
    // In a real app, we might want to return a partial result or default queries instead of throwing
    throw error;
  }
}