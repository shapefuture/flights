import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Settings } from 'lucide-react';
import { getUserPreferences, saveUserPreferences, resetUserPreferences, UserPreferences } from '../services/preferenceService';

export function PreferencePanel() {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [isOpen, setIsOpen] = useState(false);

  // Save preferences when they change
  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences]);

  const handleReset = () => {
    resetUserPreferences();
    setPreferences(getUserPreferences());
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Preferences">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Preferences</SheetTitle>
          <SheetDescription>
            Customize your flight search experience. All preferences are saved automatically.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="display" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="display" className="flex-1">Display</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="accessibility" className="flex-1">Accessibility</TabsTrigger>
          </TabsList>
          
          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showPriceInTimeline">Show prices in timeline</Label>
              <Switch 
                id="showPriceInTimeline" 
                checked={preferences.showPriceInTimeline}
                onCheckedChange={(value) => updatePreference('showPriceInTimeline', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Default view</Label>
              <RadioGroup 
                value={preferences.defaultView} 
                onValueChange={(value) => updatePreference('defaultView', value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="view-list" />
                  <Label htmlFor="view-list">List</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calendar" id="view-calendar" />
                  <Label htmlFor="view-calendar">Calendar</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showAirlineLogos">Show airline logos</Label>
              <Switch 
                id="showAirlineLogos" 
                checked={preferences.showAirlineLogos}
                onCheckedChange={(value) => updatePreference('showAirlineLogos', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compactView">Compact view</Label>
              <Switch 
                id="compactView" 
                checked={preferences.compactView}
                onCheckedChange={(value) => updatePreference('compactView', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Results per page</Label>
              <Select
                value={preferences.resultsPerPage.toString()}
                onValueChange={(value) => updatePreference('resultsPerPage', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Default sort order</Label>
              <Select
                value={preferences.sortOrder}
                onValueChange={(value) => updatePreference('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="departureTime">Departure Time</SelectItem>
                  <SelectItem value="arrivalTime">Arrival Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* Search Settings */}
          <TabsContent value="search" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Default maximum stops</Label>
              <Select
                value={preferences.defaultMaxStops.toString()}
                onValueChange={(value) => updatePreference('defaultMaxStops', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nonstop only</SelectItem>
                  <SelectItem value="1">1 stop max</SelectItem>
                  <SelectItem value="2">2 stops max</SelectItem>
                  <SelectItem value="3">Any number of stops</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Default cabin class</Label>
              <Select
                value={preferences.defaultCabinClass}
                onValueChange={(value) => updatePreference('defaultCabinClass', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred departure time range</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm">{formatTime(preferences.preferredDepartureTimeRange[0])}</span>
                <Slider 
                  value={preferences.preferredDepartureTimeRange}
                  min={0}
                  max={24}
                  step={1}
                  onValueChange={(value) => updatePreference('preferredDepartureTimeRange', value)}
                  className="flex-1"
                />
                <span className="text-sm">{formatTime(preferences.preferredDepartureTimeRange[1])}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Minimum connection time (minutes)</Label>
              <Slider 
                value={[preferences.minimumConnectionTime]}
                min={30}
                max={240}
                step={15}
                onValueChange={(value) => updatePreference('minimumConnectionTime', value[0])}
              />
              <div className="text-sm text-center">{preferences.minimumConnectionTime} minutes</div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enablePriceAlerts">Enable price alerts</Label>
              <Switch 
                id="enablePriceAlerts" 
                checked={preferences.enablePriceAlerts}
                onCheckedChange={(value) => updatePreference('enablePriceAlerts', value)}
              />
            </div>
            
            {preferences.enablePriceAlerts && (
              <div className="space-y-2">
                <Label>Alert threshold (% price drop)</Label>
                <Slider 
                  value={[preferences.priceAlertThreshold]}
                  min={5}
                  max={50}
                  step={5}
                  onValueChange={(value) => updatePreference('priceAlertThreshold', value[0])}
                />
                <div className="text-sm text-center">{preferences.priceAlertThreshold}%</div>
              </div>
            )}
          </TabsContent>
          
          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="largeFontSize">Larger text</Label>
              <Switch 
                id="largeFontSize" 
                checked={preferences.largeFontSize}
                onCheckedChange={(value) => updatePreference('largeFontSize', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="highContrast">High contrast</Label>
              <Switch 
                id="highContrast" 
                checked={preferences.highContrast}
                onCheckedChange={(value) => updatePreference('highContrast', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="reducedMotion">Reduced motion</Label>
              <Switch 
                id="reducedMotion" 
                checked={preferences.reducedMotion}
                onCheckedChange={(value) => updatePreference('reducedMotion', value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper function to format time (24h to 12h)
function formatTime(hour: number): string {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}