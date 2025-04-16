import React from 'react';
import { formatDuration, format, addMinutes, differenceInMinutes } from 'date-fns';
import { Airplane, Wifi, Coffee, Map, Utensils, Globe, Clock, Briefcase, ShieldCheck, CalendarClock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './theme-provider';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { DetailedFlightInfo } from '../types';

interface DetailedFlightViewProps {
  flight: DetailedFlightInfo;
  onClose: () => void;
  onBook: (flight: DetailedFlightInfo) => void;
  className?: string;
}

export function DetailedFlightView({ 
  flight, 
  onClose,
  onBook,
  className 
}: DetailedFlightViewProps) {
  const { theme } = useTheme();
  
  // Helper function to parse time strings into Date objects
  const parseTime = (timeStr: string, dateStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };
  
  // Parse departure and arrival times
  const departureTime = parseTime(flight.departure, flight.departureDate);
  const arrivalTime = parseTime(flight.arrival, flight.departureDate);
  
  // Adjust arrival date if flight arrives the next day
  if (departureTime.getTime() > arrivalTime.getTime()) {
    arrivalTime.setDate(arrivalTime.getDate() + 1);
  }
  
  // Calculate total duration in minutes
  const durationMinutes = differenceInMinutes(arrivalTime, departureTime);
  
  return (
    <Card className={cn('flight-detail-card w-full max-w-4xl', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            {flight.origin} to {flight.destination}
          </CardTitle>
          <div className="text-2xl font-bold text-primary">{flight.price}</div>
        </div>
        <CardDescription className="flex flex-wrap gap-2">
          <Badge variant="outline">{flight.airline}</Badge>
          <Badge variant="outline">{flight.aircraftType || 'Aircraft'}</Badge>
          {flight.cabinClass && <Badge variant="outline">{flight.cabinClass}</Badge>}
          {flight.fareType && <Badge variant="outline">{flight.fareType}</Badge>}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
            <TabsTrigger value="amenities" className="flex-1">Amenities</TabsTrigger>
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          </TabsList>
          
          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-4 mt-4">
            <div className="grid grid-cols-[1fr_3fr_1fr] gap-2">
              {/* Timeline */}
              <div className="text-right font-medium space-y-12">
                <div>{flight.departure}</div>
                {flight.stops > 0 && flight.layovers?.map((layover, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    {layover.arrivalTime}
                  </div>
                ))}
                <div>{flight.arrival}</div>
              </div>
              
              <div className="relative">
                <div className="absolute left-0 top-2 bottom-2 w-px bg-border"></div>
                
                {/* Departure */}
                <div className="relative pl-6 pb-12">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <div className="font-medium">{flight.origin}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(departureTime, 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                {/* Layovers */}
                {flight.stops > 0 && flight.layovers?.map((layover, i) => (
                  <div key={i} className="relative pl-6 pb-12">
                    <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <div>
                      <div className="font-medium">{layover.airport}</div>
                      <div className="text-sm text-muted-foreground">{layover.duration} layover</div>
                    </div>
                  </div>
                ))}
                
                {/* Arrival */}
                <div className="relative pl-6">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <div className="font-medium">{flight.destination}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(arrivalTime, 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-12">
                <div></div>
                {flight.stops > 0 && flight.layovers?.map((layover, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    {layover.departureTime}
                  </div>
                ))}
                <div></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground p-2 rounded bg-muted">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Total duration: {formatDuration({ minutes: durationMinutes })}</span>
              </div>
              <div>
                {flight.stops === 0 ? (
                  'Nonstop'
                ) : (
                  `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Amenities Tab */}
          <TabsContent value="amenities" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium">Onboard</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span>{flight.amenities?.wifi ? 'WiFi available' : 'No WiFi'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <span>{flight.amenities?.meals || 'Meals not included'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Airplane className="h-4 w-4 text-muted-foreground" />
                    <span>Seat pitch: {flight.amenities?.seatPitch || 'Standard'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{flight.amenities?.entertainment || 'Entertainment not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <span>{flight.amenities?.powerOutlets ? 'Power outlets available' : 'No power outlets'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Luggage</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Carry-on: {flight.luggage?.carryOn || 'Not included'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Checked bags: {flight.luggage?.checkedBags || 'Not included'}</span>
                  </div>
                </div>
                
                <h4 className="font-medium mt-4">Fare Conditions</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {flight.cancellationPolicy ? 
                        `Cancellation: ${flight.cancellationPolicy}` : 
                        'No cancellation information'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {flight.changePolicy ? 
                        `Changes: ${flight.changePolicy}` : 
                        'No change information'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Flight Number</h4>
                  <p>{flight.flightNumber || 'Not available'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Operating Airline</h4>
                  <p>{flight.operatingAirline || flight.airline}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Aircraft Type</h4>
                  <p>{flight.aircraftType || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Distance</h4>
                  <p>{flight.distance || 'Not available'}</p>
                </div>
              </div>
              
              {flight.environmentalImpact && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Environmental Impact</h4>
                  <div className="mt-2 p-3 rounded bg-muted">
                    <div className="text-sm">{flight.environmentalImpact}</div>
                  </div>
                </div>
              )}
              
              {flight.notes && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Additional Notes</h4>
                  <div className="mt-2 p-3 rounded bg-muted">
                    <div className="text-sm">{flight.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" onClick={onClose}>
          Back to results
        </Button>
        <Button onClick={() => onBook(flight)}>
          Book this flight
        </Button>
      </CardFooter>
    </Card>
  );
}