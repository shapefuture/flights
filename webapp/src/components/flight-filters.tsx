import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Filter, RotateCcw } from 'lucide-react';

interface FlightFiltersProps {
  results: any[];
  filters: {
    maxPrice: number;
    maxStops: number;
    airlines: string[];
    departureTime: number[];
    arrivalTime: number[];
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    maxPrice: number;
    maxStops: number;
    airlines: string[];
    departureTime: number[];
    arrivalTime: number[];
  }>>;
}

export function FlightFilters({ results, filters, setFilters }: FlightFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(filters.maxPrice);
  
  useEffect(() => {
    // Extract unique airlines from results
    if (results.length > 0) {
      const airlines = [...new Set(results.map(r => r.airline))];
      setAvailableAirlines(airlines);
    }
    
    // Find max price for slider
    const prices = results.map(r => parseInt(r.price.replace(/[^0-9]/g, '')));
    const maxPrice = Math.max(...prices);
    
    // Only update if the current filter is higher or not set
    if (maxPrice > filters.maxPrice || filters.maxPrice === 2000) {
      setFilters(prev => ({ ...prev, maxPrice: Math.ceil(maxPrice / 100) * 100 }));
      setMaxPriceValue(Math.ceil(maxPrice / 100) * 100);
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
  
  const handleResetFilters = () => {
    setFilters({
      maxPrice: 2000,
      maxStops: 2,
      airlines: [],
      departureTime: [0, 24],
      arrivalTime: [0, 24]
    });
  };
  
  const filterCount = (
    (filters.maxPrice < 2000 ? 1 : 0) +
    (filters.maxStops < 2 ? 1 : 0) +
    (filters.airlines.length > 0 ? 1 : 0) +
    (filters.departureTime[0] > 0 || filters.departureTime[1] < 24 ? 1 : 0) +
    (filters.arrivalTime[0] > 0 || filters.arrivalTime[1] < 24 ? 1 : 0)
  );
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      )}
    </div>
  );
}