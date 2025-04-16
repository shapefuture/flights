import { useMemo, useState, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import logger from '../utils/logger';

interface CalendarViewProps {
  results: any[];
}

export function CalendarView({ results }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(addMonths(new Date(), 1));
  const [error, setError] = useState<string | null>(null);
  
  // Group results by date
  const resultsByDate = useMemo(() => {
    try {
      logger.debug('Grouping flight results by date');
      const grouped: Record<string, any[]> = {};
      
      results.forEach(result => {
        if (!result.departureDate) {
          logger.warn('Found result without departureDate:', result);
          return;
        }
        
        const date = result.departureDate;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(result);
      });
      
      return grouped;
    } catch (error) {
      logger.error('Error grouping results by date:', error);
      setError('Error processing flight dates');
      return {};
    }
  }, [results]);
  
  // Find the cheapest price for each date
  const cheapestByDate = useMemo(() => {
    try {
      logger.debug('Calculating cheapest prices by date');
      const cheapest: Record<string, string> = {};
      
      Object.entries(resultsByDate).forEach(([date, dateResults]) => {
        if (!dateResults || dateResults.length === 0) {
          logger.warn('No results for date:', date);
          return;
        }
        
        const prices = dateResults.map(r => {
          const priceStr = r.price?.replace(/[^0-9]/g, '');
          if (!priceStr) {
            logger.warn('Found result with invalid price:', r);
            return Number.MAX_SAFE_INTEGER;
          }
          return parseInt(priceStr);
        });
        
        const validPrices = prices.filter(p => !isNaN(p) && p !== Number.MAX_SAFE_INTEGER);
        
        if (validPrices.length === 0) {
          logger.warn('No valid prices for date:', date);
          return;
        }
        
        const minPrice = Math.min(...validPrices);
        cheapest[date] = `$${minPrice}`;
      });
      
      return cheapest;
    } catch (error) {
      logger.error('Error calculating cheapest prices:', error);
      setError('Error calculating flight prices');
      return {};
    }
  }, [resultsByDate]);
  
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    try {
      logger.debug(`Navigating calendar ${direction}`);
      if (direction === 'prev') {
        setNextMonth(currentMonth);
        setCurrentMonth(addMonths(currentMonth, -1));
      } else {
        setCurrentMonth(nextMonth);
        setNextMonth(addMonths(nextMonth, 1));
      }
    } catch (error) {
      logger.error('Error navigating calendar:', error);
      setError('Error navigating calendar');
    }
  }, [currentMonth, nextMonth]);
  
  const renderCalendar = useCallback((month: Date) => {
    try {
      logger.debug(`Rendering calendar for ${format(month, 'MMMM yyyy')}`);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Calculate the starting day of the week (0 = Sunday, 6 = Saturday)
      const startingDayOfWeek = monthStart.getDay();
      
      // Create empty slots for days before the first day of the month
      const emptyStartSlots = Array.from({ length: startingDayOfWeek }, (_, i) => (
        <div key={`empty-start-${i}`} className="h-14 sm:h-24 p-1"></div>
      ));
      
      // Days of the week headers
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      return (
        <Card className="card-highlight">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{format(month, 'MMMM yyyy')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center py-1 text-xs font-medium bg-gray-50">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {emptyStartSlots}
              {days.map(day => {
                const dateString = format(day, 'yyyy-MM-dd');
                const hasResults = !!resultsByDate[dateString]?.length;
                const cheapestPrice = cheapestByDate[dateString];
                
                return (
                  <div 
                    key={dateString} 
                    className={`h-14 sm:h-24 p-1 relative bg-white hover:bg-gray-50 transition-colors ${
                      hasResults ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="text-xs font-medium">{format(day, 'd')}</div>
                    {hasResults && (
                      <div className="absolute bottom-1 right-1 left-1">
                        <div className="bg-blue-50 border border-blue-100 rounded p-1 text-center">
                          <div className="text-xs font-semibold text-blue-700">{cheapestPrice}</div>
                          <div className="text-[10px] text-gray-500">
                            {resultsByDate[dateString].length} {resultsByDate[dateString].length === 1 ? 'flight' : 'flights'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    } catch (error) {
      logger.error('Error rendering calendar:', error);
      return (
        <Card className="card-highlight">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Error Rendering Calendar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">There was a problem displaying the calendar view.</p>
          </CardContent>
        </Card>
      );
    }
  }, [resultsByDate, cheapestByDate]);
  
  if (error) {
    return (
      <Card className="card-highlight">
        <CardHeader className="bg-red-50 pb-3">
          <CardTitle className="text-lg text-red-700 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-gray-700">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)} 
            className="mt-3"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderCalendar(currentMonth)}
        {renderCalendar(nextMonth)}
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Click on a date with pricing to see detailed flight options</p>
      </div>
    </div>
  );
}