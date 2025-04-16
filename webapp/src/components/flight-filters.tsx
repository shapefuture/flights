import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Briefcase, Wifi, Coffee, Monitor, CreditCard, Calendar } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface FlightFiltersProps {
  results: any[];
  filters: {
    maxPrice: number;
    maxStops: number;
    airlines: string[];
    departureTime: number[];
    arrivalTime: number[];
    luggageFilters: {
      minCheckedBags: number;
      requiresCarryOn: boolean;
      requiresPersonalItem: boolean;
    };
    amenityFilters: {
      requiresWifi: boolean;
      requiresPower: boolean;
      requiresEntertainment: boolean;
      mealTypes: string[];
      minLegroom: 'any' | 'standard' | 'extra' | 'premium';
    };
    cancellationPolicy: 'any' | 'refundable' | 'non-refundable' | 'partial';
    fareTypes: string[];
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    maxPrice: number;
    maxStops: number;
    airlines: string[];
    departureTime: number[];
    arrivalTime: number[];
    luggageFilters: {
      minCheckedBags: number;
      requiresCarryOn: boolean;
      requiresPersonalItem: boolean;
    };
    amenityFilters: {
      requiresWifi: boolean;
      requiresPower: boolean;
      requiresEntertainment: boolean;
      mealTypes: string[];
      minLegroom: 'any' | 'standard' | 'extra' | 'premium';
    };
    cancellationPolicy: 'any' | 'refundable' | 'non-refundable' | 'partial';
    fareTypes: string[];
  }>>;
}

export function FlightFilters({ results, filters, setFilters }: FlightFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [availableFareTypes, setAvailableFareTypes] = useState<string[]>([]);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(filters.maxPrice);
  
  useEffect(() => {
    if (results.length > 0) {
      // Extract unique airlines from results
      const airlines = [...new Set(results.map(r => r.airline))];
      setAvailableAirlines(airlines);
      
      // Extract unique fare types from results
      const fareTypes = [...new Set(results.filter(r => r.fareType).map(r => r.fareType))];
      setAvailableFareTypes(fareTypes);
      
      // Find max price for slider
      const prices = results.map(r => parseInt(r.price.replace(/[^0-9]/g, '')));
      const maxPrice = Math.max(...prices);
      
      // Only update if the current filter is higher or not set
      if (maxPrice > filters.maxPrice || filters.maxPrice === 2000) {
        setFilters(prev => ({ ...prev, maxPrice: Math.ceil(maxPrice / 100) * 100 }));
        setMaxPriceValue(Math.ceil(maxPrice / 100) * 100);
      }
    }
  }, [results]);
  
  const handlePriceChange = (value: number[]) => {
    setMaxPriceValue(value[0]);
  };
  
  const handlePriceCommit = (value: number[]) => {
    setFilters(prev => ({ ...prev, maxPrice: value[0] }));
  };
  
  const handleStopsChange = (stops: number) => {
    setFilters(prev => ({ ...prev, maxStops: stops }));
  };
  
  const handleAirlineChange = (airline: string, checked: boolean) => {
    setFilters(prev => {
      if (checked) {
        return { ...prev, airlines: [...prev.airlines, airline] };
      } else {
        return { ...prev, airlines: prev.airlines.filter(a => a !== airline) };
      }
    });
  };
  
  const handleLuggageFilterChange = (key: keyof typeof filters.luggageFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      luggageFilters: {
        ...prev.luggageFilters,
        [key]: value
      }
    }));
  };
  
  const handleAmenityFilterChange = (key: keyof typeof filters.amenityFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      amenityFilters: {
        ...prev.amenityFilters,
        [key]: value
      }
    }));
  };
  
  const handleMealTypeChange = (mealType: string, checked: boolean) => {
    setFilters(prev => {
      const currentMealTypes = prev.amenityFilters.mealTypes;
      
      if (checked) {
        return {
          ...prev,
          amenityFilters: {
            ...prev.amenityFilters,
            mealTypes: [...currentMealTypes, mealType]
          }
        };
      } else {
        return {
          ...prev,
          amenityFilters: {
            ...prev.amenityFilters,
            mealTypes: currentMealTypes.filter(m => m !== mealType)
          }
        };
      }
    });
  };
  
  const handleFareTypeChange = (fareType: string, checked: boolean) => {
    setFilters(prev => {
      if (checked) {
        return { ...prev, fareTypes: [...prev.fareTypes, fareType] };
      } else {
        return { ...prev, fareTypes: prev.fareTypes.filter(f => f !== fareType) };
      }
    });
  };
  
  const handleCancellationPolicyChange = (policy: typeof filters.cancellationPolicy) => {
    setFilters(prev => ({
      ...prev,
      cancellationPolicy: policy
    }));
  };
  
  const handleResetFilters = () => {
    setFilters({
      maxPrice: 2000,
      maxStops: 2,
      airlines: [],
      departureTime: [0, 24],
      arrivalTime: [0, 24],
      luggageFilters: {
        minCheckedBags: 0,
        requiresCarryOn: false,
        requiresPersonalItem: false
      },
      amenityFilters: {
        requiresWifi: false,
        requiresPower: false,
        requiresEntertainment: false,
        mealTypes: [],
        minLegroom: 'any'
      },
      cancellationPolicy: 'any',
      fareTypes: []
    });
  };
  
  const getFilterCount = () => {
    let count = 0;
    
    // Basic filters
    if (filters.maxPrice < 2000) count++;
    if (filters.maxStops < 2) count++;
    if (filters.airlines.length > 0) count++;
    if (filters.departureTime[0] > 0 || filters.departureTime[1] < 24) count++;
    if (filters.arrivalTime[0] > 0 || filters.arrivalTime[1] < 24) count++;
    
    // Luggage filters
    if (filters.luggageFilters.minCheckedBags > 0) count++;
    if (filters.luggageFilters.requiresCarryOn) count++;
    if (filters.luggageFilters.requiresPersonalItem) count++;
    
    // Amenity filters
    if (filters.amenityFilters.requiresWifi) count++;
    if (filters.amenityFilters.requiresPower) count++;
    if (filters.amenityFilters.requiresEntertainment) count++;
    if (filters.amenityFilters.mealTypes.length > 0) count++;
    if (filters.amenityFilters.minLegroom !== 'any') count++;
    
    // Other filters
    if (filters.cancellationPolicy !== 'any') count++;
    if (filters.fareTypes.length > 0) count++;
    
    return count;
  };
  
  const filterCount = getFilterCount();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs flex items-center"
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {filterCount > 0 && (
            <span className="ml-1.5 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
              {filterCount}
            </span>
          )}
        </Button>
        
        {filterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetFilters}
            className="text-xs flex items-center text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className="border rounded-md p-4 bg-gray-50 animate-fade-in mb-4">
          <Accordion type="multiple" defaultValue={["basic"]}>
            <AccordionItem value="basic">
              <AccordionTrigger className="text-sm font-medium py-2">
                Basic Filters
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  <div>
                    <div className="mb-4">
                      <Label className="mb-2 block text-sm font-medium">Max Price: ${maxPriceValue}</Label>
                      <Slider 
                        defaultValue={[filters.maxPrice]} 
                        max={5000} 
                        step={50} 
                        value={[maxPriceValue]}
                        onValueChange={handlePriceChange}
                        onValueCommit={handlePriceCommit}
                      />
                    </div>
                    
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Maximum Stops</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="nonstop" 
                            checked={filters.maxStops === 0}
                            onCheckedChange={() => handleStopsChange(0)}
                          />
                          <label
                            htmlFor="nonstop"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Nonstop
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="onestop" 
                            checked={filters.maxStops === 1}
                            onCheckedChange={() => handleStopsChange(1)}
                          />
                          <label
                            htmlFor="onestop"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Max 1 Stop
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="twostops" 
                            checked={filters.maxStops === 2}
                            onCheckedChange={() => handleStopsChange(2)}
                          />
                          <label
                            htmlFor="twostops"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Any
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {availableAirlines.length > 0 && (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Airlines</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableAirlines.map(airline => (
                            <div key={airline} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`airline-${airline}`} 
                                checked={filters.airlines.length === 0 || filters.airlines.includes(airline)}
                                onCheckedChange={(checked) => handleAirlineChange(airline, checked as boolean)}
                              />
                              <label
                                htmlFor={`airline-${airline}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {airline}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="luggage">
              <AccordionTrigger className="text-sm font-medium py-2">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Luggage Options
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-2 space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Minimum Checked Bags</Label>
                    <RadioGroup 
                      value={String(filters.luggageFilters.minCheckedBags)}
                      onValueChange={(value) => handleLuggageFilterChange('minCheckedBags', parseInt(value))}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="checked-0" />
                        <label htmlFor="checked-0" className="text-sm">Any</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="checked-1" />
                        <label htmlFor="checked-1" className="text-sm">At least 1</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="checked-2" />
                        <label htmlFor="checked-2" className="text-sm">At least 2</label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="requires-carry-on" 
                        checked={filters.luggageFilters.requiresCarryOn}
                        onCheckedChange={(checked) => handleLuggageFilterChange('requiresCarryOn', !!checked)}
                      />
                      <label
                        htmlFor="requires-carry-on"
                        className="text-sm font-medium leading-none"
                      >
                        Carry-on included
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="requires-personal-item" 
                        checked={filters.luggageFilters.requiresPersonalItem}
                        onCheckedChange={(checked) => handleLuggageFilterChange('requiresPersonalItem', !!checked)}
                      />
                      <label
                        htmlFor="requires-personal-item"
                        className="text-sm font-medium leading-none"
                      >
                        Personal item included
                      </label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="amenities">
              <AccordionTrigger className="text-sm font-medium py-2">
                <div className="flex items-center">
                  <Coffee className="h-4 w-4 mr-2" />
                  Amenities & Comfort
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-2 space-y-4">
                  <div className="flex flex-wrap gap-y-2 gap-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="requires-wifi" 
                        checked={filters.amenityFilters.requiresWifi}
                        onCheckedChange={(checked) => handleAmenityFilterChange('requiresWifi', !!checked)}
                      />
                      <label
                        htmlFor="requires-wifi"
                        className="text-sm font-medium leading-none flex items-center"
                      >
                        <Wifi className="h-3 w-3 mr-1 text-blue-600" />
                        WiFi Available
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="requires-power" 
                        checked={filters.amenityFilters.requiresPower}
                        onCheckedChange={(checked) => handleAmenityFilterChange('requiresPower', !!checked)}
                      />
                      <label
                        htmlFor="requires-power"
                        className="text-sm font-medium leading-none flex items-center"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1 text-green-600">
                          <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Power Outlets
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="requires-entertainment" 
                        checked={filters.amenityFilters.requiresEntertainment}
                        onCheckedChange={(checked) => handleAmenityFilterChange('requiresEntertainment', !!checked)}
                      />
                      <label
                        htmlFor="requires-entertainment"
                        className="text-sm font-medium leading-none flex items-center"
                      >
                        <Monitor className="h-3 w-3 mr-1 text-purple-600" />
                        Entertainment
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Legroom Preference</Label>
                    <RadioGroup 
                      value={filters.amenityFilters.minLegroom}
                      onValueChange={(value) => handleAmenityFilterChange('minLegroom', value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="legroom-any" />
                        <label htmlFor="legroom-any" className="text-sm">Any</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="legroom-standard" />
                        <label htmlFor="legroom-standard" className="text-sm">Standard</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="extra" id="legroom-extra" />
                        <label htmlFor="legroom-extra" className="text-sm">Extra</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="premium" id="legroom-premium" />
                        <label htmlFor="legroom-premium" className="text-sm">Premium</label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Meal Service</Label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="meal-snack" 
                          checked={filters.amenityFilters.mealTypes.includes('snack')}
                          onCheckedChange={(checked) => handleMealTypeChange('snack', !!checked)}
                        />
                        <label
                          htmlFor="meal-snack"
                          className="text-sm font-medium leading-none"
                        >
                          Snack
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="meal-full" 
                          checked={filters.amenityFilters.mealTypes.includes('full')}
                          onCheckedChange={(checked) => handleMealTypeChange('full', !!checked)}
                        />
                        <label
                          htmlFor="meal-full"
                          className="text-sm font-medium leading-none"
                        >
                          Full Meal
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="policies">
              <AccordionTrigger className="text-sm font-medium py-2">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Fare & Policies
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-2 space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Cancellation Policy</Label>
                    <RadioGroup 
                      value={filters.cancellationPolicy}
                      onValueChange={(value) => handleCancellationPolicyChange(value as any)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="cancel-any" />
                        <label htmlFor="cancel-any" className="text-sm">Any</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refundable" id="cancel-refundable" />
                        <label htmlFor="cancel-refundable" className="text-sm">Refundable</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="cancel-partial" />
                        <label htmlFor="cancel-partial" className="text-sm">Partial Refund</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-refundable" id="cancel-non-refundable" />
                        <label htmlFor="cancel-non-refundable" className="text-sm">Non-refundable</label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {availableFareTypes.length > 0 && (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Fare Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableFareTypes.map(fareType => (
                          <div key={fareType} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`fare-${fareType}`} 
                              checked={filters.fareTypes.length === 0 || filters.fareTypes.includes(fareType)}
                              onCheckedChange={(checked) => handleFareTypeChange(fareType, checked as boolean)}
                            />
                            <label
                              htmlFor={`fare-${fareType}`}
                              className="text-sm font-medium leading-none"
                            >
                              {fareType}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="times">
              <AccordionTrigger className="text-sm font-medium py-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Flight Times
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-2 space-y-4">
                  {/* We'll use the existing departure/arrival time filters here,
                      but we could easily add more detailed time preferences here */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      Departure Time: {filters.departureTime[0]}:00 - {filters.departureTime[1]}:00
                    </Label>
                    <Slider 
                      defaultValue={filters.departureTime} 
                      min={0}
                      max={24} 
                      step={1} 
                      value={filters.departureTime}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, departureTime: value }))}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      Arrival Time: {filters.arrivalTime[0]}:00 - {filters.arrivalTime[1]}:00
                    </Label>
                    <Slider 
                      defaultValue={filters.arrivalTime} 
                      min={0}
                      max={24} 
                      step={1} 
                      value={filters.arrivalTime}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, arrivalTime: value }))}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}