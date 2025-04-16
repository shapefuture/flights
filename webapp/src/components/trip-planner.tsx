import React, { useState } from 'react';
import { Calendar, MapPin, Hotel, Car, Ticket, Plus, X, Briefcase } from 'lucide-react';
import { useTranslations } from '../hooks/use-translations';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { DetailedFlightInfo } from '../types';

interface TripPlannerProps {
  selectedFlight?: DetailedFlightInfo;
}

interface TripItem {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'activity';
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  price?: string;
  notes?: string;
  confirmed: boolean;
  details: Record<string, any>;
}

export function TripPlanner({ selectedFlight }: TripPlannerProps) {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [tripName, setTripName] = useState('My Trip');
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [newItemType, setNewItemType] = useState<TripItem['type']>('hotel');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemStartDate, setNewItemStartDate] = useState('');
  const [newItemEndDate, setNewItemEndDate] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  
  // Add selected flight to trip items
  const addSelectedFlight = () => {
    if (!selectedFlight) return;
    
    const flightItem: TripItem = {
      id: `flight-${Date.now()}`,
      type: 'flight',
      title: `Flight to ${selectedFlight.destination}`,
      location: `${selectedFlight.origin} → ${selectedFlight.destination}`,
      startDate: selectedFlight.departureDate,
      endDate: selectedFlight.returnDate,
      price: selectedFlight.price,
      confirmed: false,
      details: {
        airline: selectedFlight.airline,
        flightNumber: selectedFlight.flightNumber,
        departureTime: selectedFlight.departure,
        arrivalTime: selectedFlight.arrival,
        cabin: selectedFlight.cabinClass,
      }
    };
    
    setTripItems(prev => [...prev, flightItem]);
  };
  
  // Add new custom item to trip
  const addNewItem = () => {
    if (!newItemTitle || !newItemLocation || !newItemStartDate) return;
    
    const newItem: TripItem = {
      id: `${newItemType}-${Date.now()}`,
      type: newItemType,
      title: newItemTitle,
      location: newItemLocation,
      startDate: newItemStartDate,
      endDate: newItemEndDate || undefined,
      price: newItemPrice || undefined,
      notes: newItemNotes || undefined,
      confirmed: false,
      details: {}
    };
    
    setTripItems(prev => [...prev, newItem]);
    
    // Reset form
    setNewItemTitle('');
    setNewItemLocation('');
    setNewItemStartDate('');
    setNewItemEndDate('');
    setNewItemPrice('');
    setNewItemNotes('');
  };
  
  // Remove item from trip
  const removeItem = (id: string) => {
    setTripItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Toggle item confirmation status
  const toggleItemConfirmation = (id: string) => {
    setTripItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, confirmed: !item.confirmed } : item
      )
    );
  };
  
  // Calculate total trip cost
  const calculateTotalCost = (): string => {
    let total = 0;
    
    tripItems.forEach(item => {
      if (item.price) {
        // Extract numeric value from price string (e.g., "$300" -> 300)
        const priceValue = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(priceValue)) {
          total += priceValue;
        }
      }
    });
    
    return `$${total.toFixed(2)}`;
  };
  
  // Get item icon based on type
  const getItemIcon = (type: TripItem['type']) => {
    switch (type) {
      case 'flight':
        return <Ticket className="h-4 w-4" />;
      case 'hotel':
        return <Hotel className="h-4 w-4" />;
      case 'car':
        return <Car className="h-4 w-4" />;
      case 'activity':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{tripName}</CardTitle>
        <CardDescription>
          Plan your entire trip in one place
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
          <TabsTrigger value="add" className="flex-1">Add Items</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addSelectedFlight} 
                  disabled={!selectedFlight}
                  className="w-full md:w-auto"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Add Selected Flight
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Flights</h3>
                </div>
                <p className="text-2xl font-bold">
                  {tripItems.filter(item => item.type === 'flight').length}
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Hotel className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Accommodations</h3>
                </div>
                <p className="text-2xl font-bold">
                  {tripItems.filter(item => item.type === 'hotel').length}
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-medium">Activities & Transport</h3>
                </div>
                <p className="text-2xl font-bold">
                  {tripItems.filter(item => item.type === 'activity' || item.type === 'car').length}
                </p>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Total Estimated Cost</h3>
                <p className="text-2xl font-bold">{calculateTotalCost()}</p>
              </div>
            </div>
            
            {tripItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Your trip is empty</p>
                <p className="text-sm">Add your flight or other items to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="p-4">
          {tripItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No items in your itinerary yet</p>
              <p className="text-sm">Add your flight or other items to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Group items by date */}
                {Array.from(new Set(tripItems.map(item => item.startDate))).sort().map(date => (
                  <div key={date} className="space-y-2">
                    <h3 className="font-medium text-sm uppercase text-muted-foreground">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    
                    {/* Items for this date */}
                    {tripItems
                      .filter(item => item.startDate === date)
                      .map(item => (
                        <div 
                          key={item.id} 
                          className={`p-3 border rounded-md ${
                            item.confirmed ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${
                                item.type === 'flight' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                item.type === 'hotel' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                                item.type === 'car' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              }`}>
                                {getItemIcon(item.type)}
                              </div>
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {item.location}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleItemConfirmation(item.id)}
                              >
                                {item.confirmed ? 'Confirmed' : 'Confirm'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Show price if available */}
                          {item.price && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Price:</span> {item.price}
                            </div>
                          )}
                          
                          {/* Show notes if available */}
                          {item.notes && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Notes:</span> {item.notes}
                            </div>
                          )}
                          
                          {/* Show end date if available */}
                          {item.endDate && item.endDate !== item.startDate && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Until:</span> {new Date(item.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        {/* Add Items Tab */}
        <TabsContent value="add" className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant={newItemType === 'hotel' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNewItemType('hotel')}
              >
                <Hotel className="h-4 w-4 mr-2" />
                Hotel
              </Button>
              <Button
                variant={newItemType === 'car' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNewItemType('car')}
              >
                <Car className="h-4 w-4 mr-2" />
                Car Rental
              </Button>
              <Button
                variant={newItemType === 'activity' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNewItemType('activity')}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Activity
              </Button>
              <Button
                variant={newItemType === 'flight' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNewItemType('flight')}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Flight
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={
                    newItemType === 'hotel' ? 'Hotel Name' :
                    newItemType === 'car' ? 'Car Rental Company' :
                    newItemType === 'activity' ? 'Activity Name' :
                    'Flight Details'
                  }
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  placeholder={
                    newItemType === 'hotel' ? 'Hotel Address' :
                    newItemType === 'car' ? 'Pickup Location' :
                    newItemType === 'activity' ? 'Activity Location' :
                    'Origin → Destination'
                  }
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    {newItemType === 'hotel' ? 'Check-in Date' :
                     newItemType === 'car' ? 'Pickup Date' :
                     newItemType === 'activity' ? 'Date' :
                     'Departure Date'}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newItemStartDate}
                    onChange={(e) => setNewItemStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">
                    {newItemType === 'hotel' ? 'Check-out Date' :
                     newItemType === 'car' ? 'Return Date' :
                     newItemType === 'activity' ? 'End Date (if multi-day)' :
                     'Return Date (if round-trip)'}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newItemEndDate}
                    onChange={(e) => setNewItemEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="e.g. $100"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Any additional details"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-4">
        {activeTab === 'add' ? (
          <Button onClick={addNewItem} disabled={!newItemTitle || !newItemLocation || !newItemStartDate}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Trip
          </Button>
        ) : (
          <Button 
            variant="default" 
            disabled={tripItems.length === 0}
            onClick={() => console.log('Would save or export trip:', { name: tripName, items: tripItems })}
          >
            Save Trip
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}