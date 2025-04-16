import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarViewProps {
  results: any[];
}

export function CalendarView({ results }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(addMonths(new Date(), 1));
  
  // Group results by date
  const resultsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    results.forEach(result => {
      const date = result.departureDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(result);
    });
    
    return grouped;
  }, [results]);
  
  // Find the cheapest price for each date
  const cheapestByDate = useMemo(() => {
    const cheapest: Record<string, string> = {};
    
    Object.entries(resultsByDate).forEach(([date, dateResults]) => {
      const prices = dateResults.map(r => parseInt(r.price.replace(/[^0-9]/g, '')));
      const minPrice = Math.min(...prices);
      cheapest[date] = `$${minPrice}`;
    });
    
    return cheapest;
  }, [resultsByDate]);
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setNextMonth(currentMonth);
      setCurrentMonth(addMonths(currentMonth, -1));
    } else {
      setCurrentMonth(nextMonth);
      setNextMonth(addMonths(nextMonth, 1));
    }
  };
  
  const renderCalendar = (month: Date) => {
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
  };
  
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