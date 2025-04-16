import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './context/auth-context';
import { ThemeToggle } from './components/theme-toggle';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { PreferencesProvider } from './hooks/use-preferences';
import { LanguageSwitcher } from './components/language-switcher';
import { PreferencePanel } from './components/preference-panel';
import { VirtualizedFlightList } from './components/virtualized-flight-list';
import { DetailedFlightView } from './components/detailed-flight-view';
import { TouchControls } from './components/touch-controls';
import { VoiceSearch } from './components/voice-search';
import { PriceAlertPanel } from './components/price-alert-panel';
import { TripPlanner } from './components/trip-planner';
import { NativeAppBanner } from './components/native-app-banner';
import { UserAccountNav } from './components/auth/user-account-nav';
import { AuthDialog } from './components/auth/auth-dialog';
import { UsageMeter } from './components/subscription/usage-meter';
import { callAgentApi } from './services/apiService';
import { incrementQueriesUsed } from './lib/supabase';
import { initializeI18n } from './i18n';
import { debug, info, error } from './utils/logger';
import { FlightResult, DetailedFlightInfo } from './types';
import './styles/globals.css';
import './styles/mobile-enhancements.css';

// Initialize i18n system
initializeI18n().catch(err => {
  error('Failed to initialize i18n:', err);
});

// Main app wrapper with providers
function AppWrapper() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PreferencesProvider>
          <AppContent />
        </PreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, user, canPerformSearch, remainingQueries } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<DetailedFlightInfo | null>(null);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // Check if user is authenticated for paid search
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }
    
    // Check if user has remaining queries
    if (!canPerformSearch) {
      setError("You've reached your monthly search limit. Please upgrade your plan for more searches.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      info('Executing search query:', query);
      const response = await callAgentApi(query);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setResult(response);
      
      // Mock flight results for demonstration
      const mockResults = generateMockFlightResults();
      setFlightResults(mockResults);
      
      // Increment the user's query count
      if (user) {
        await incrementQueriesUsed(user.id);
      }
      
    } catch (err) {
      error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
    setShowVoiceSearch(false);
    
    // Auto-search after voice input
    setTimeout(() => {
      handleSearch();
    }, 500);
  };
  
  const generateMockFlightResults = (): FlightResult[] => {
    // Generate some realistic mock flight results
    const airlines = ['Delta', 'United', 'American Airlines', 'JetBlue', 'Southwest', 'British Airways'];
    const airports = query.match(/([A-Z]{3})/g) || ['JFK', 'LAX'];
    const origin = airports[0] || 'JFK';
    const destination = airports[1] || 'LAX';
    
    const today = new Date();
    const departureDate = new Date(today);
    departureDate.setDate(departureDate.getDate() + 7);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 7);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    return Array.from({ length: 15 }, (_, i) => {
      const isNonstop = Math.random() > 0.3;
      const stops = isNonstop ? 0 : Math.floor(Math.random() * 2) + 1;
      const price = Math.floor(300 + Math.random() * 700);
      const durationHours = 3 + Math.floor(Math.random() * 5);
      const durationMinutes = Math.floor(Math.random() * 60);
      
      const departureHour = 6 + Math.floor(Math.random() * 12);
      const departureMinute = Math.floor(Math.random() * 60);
      const arrivalHour = (departureHour + durationHours) % 24;
      const arrivalMinute = (departureMinute + durationMinutes) % 60;
      
      const formatTime = (hour: number, minute: number) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      };
      
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = `${airline.slice(0, 2).toUpperCase()}${100 + Math.floor(Math.random() * 900)}`;
      
      const hasLayovers = stops > 0;
      const layovers = hasLayovers
        ? Array.from({ length: stops }, (_, j) => {
            const layoverDuration = 45 + Math.floor(Math.random() * 120);
            const layoverAirports = ['ORD', 'ATL', 'DFW', 'DEN', 'PHX'];
            return {
              airport: layoverAirports[Math.floor(Math.random() * layoverAirports.length)],
              duration: `${layoverDuration} min`,
              arrivalTime: formatTime(
                (departureHour + 1 + j) % 24,
                (departureMinute + 30) % 60
              ),
              departureTime: formatTime(
                (departureHour + 2 + j) % 24,
                (departureMinute + 15) % 60
              )
            };
          })
        : [];
      
      return {
        price: `$${price}`,
        duration: `${durationHours}h ${durationMinutes}m`,
        stops,
        airline,
        departure: formatTime(departureHour, departureMinute),
        arrival: formatTime(arrivalHour, arrivalMinute),
        origin,
        destination,
        departureDate: formatDate(departureDate),
        returnDate: formatDate(returnDate),
        flightNumber,
        operatingAirline: airline,
        aircraftType: ['Boeing 737', 'Airbus A320', 'Boeing 787', 'Airbus A350'][Math.floor(Math.random() * 4)],
        cabinClass: ['economy', 'premium', 'business', 'first'][Math.floor(Math.random() * 4)],
        fareType: ['Basic Economy', 'Economy', 'Premium Economy', 'Business', 'First'][Math.floor(Math.random() * 5)],
        distance: `${1000 + Math.floor(Math.random() * 3000)} miles`,
        layovers,
        luggage: {
          carryOn: Math.random() > 0.3 ? 'Included' : 'Fees apply',
          checkedBags: Math.random() > 0.5 ? 'First bag free' : `$${30 + Math.floor(Math.random() * 20)} per bag`
        },
        amenities: {
          wifi: Math.random() > 0.3,
          powerOutlets: Math.random() > 0.2,
          seatPitch: `${30 + Math.floor(Math.random() * 8)}"`,
          entertainment: Math.random() > 0.4 ? 'Personal screens' : 'No personal entertainment',
          meals: ['Full meal service', 'Snacks for purchase', 'Beverages only', 'No service'][Math.floor(Math.random() * 4)]
        },
        environmentalImpact: Math.random() > 0.5 ? `${100 + Math.floor(Math.random() * 150)}kg CO2 per passenger` : undefined,
        cancellationPolicy: ['Non-refundable', 'Refundable with fee', 'Fully refundable'][Math.floor(Math.random() * 3)],
        changePolicy: ['Changes not allowed', 'Changes with fee', 'Free changes'][Math.floor(Math.random() * 3)]
      } as DetailedFlightInfo;
    });
  };
  
  const handleFlightSelect = (flight: DetailedFlightInfo) => {
    setSelectedFlight(flight);
  };
  
  const handleCloseDetailView = () => {
    setSelectedFlight(null);
  };
  
  const handleBookFlight = (flight: DetailedFlightInfo) => {
    // In a real app, this would navigate to booking flow
    alert(`Booking flight: ${flight.flightNumber} from ${flight.origin} to ${flight.destination}`);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container flex justify-between items-center py-4">
          <h1 className="text-xl font-bold">Flight Finder Agent</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <PreferencePanel />
            {isAuthenticated ? (
              <UserAccountNav />
            ) : (
              <Button variant="default" onClick={() => setAuthDialogOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Your AI-powered assistant for finding the perfect flights</h2>
          
          {isAuthenticated && (
            <UsageMeter className="mb-4" />
          )}
          
          {showVoiceSearch ? (
            <VoiceSearch 
              onTranscript={handleVoiceTranscript}
              className="mb-4"
            />
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Find me a flight from NYC to London next weekend with a return one week later"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={() => setShowVoiceSearch(true)} variant="outline">
                Voice
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search Flights'}
              </Button>
            </div>
          )}
          
          {error && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="p-4 rounded-md bg-muted">
              <h3 className="font-bold">Sign in to search flights</h3>
              <p className="text-sm text-muted-foreground">
                Create an account or sign in to access our AI-powered flight search.
              </p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setAuthDialogOpen(true)}
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </div>
        
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {selectedFlight ? (
                <DetailedFlightView 
                  flight={selectedFlight} 
                  onClose={handleCloseDetailView}
                  onBook={handleBookFlight}
                />
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Flight Results</h2>
                  <TouchControls>
                    <VirtualizedFlightList 
                      flights={flightResults} 
                      onSelect={handleFlightSelect}
                      className="min-h-[500px]"
                    />
                  </TouchControls>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Agent status panel */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Agent Status</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Thinking</h4>
                    <p className="text-sm mt-1">{result.thinking}</p>
                  </div>
                  
                  {result.plan && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Plan</h4>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.plan, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Price Alert Panel */}
              <PriceAlertPanel />
              
              {/* Trip Planner */}
              <TripPlanner selectedFlight={selectedFlight || undefined} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-12">
        <div className="container">
          <p>© 2023 Flight Finder. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/pricing" className="hover:underline">Pricing</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
          </div>
        </div>
      </footer>
      
      {/* Native App Promotion Banner */}
      <NativeAppBanner />
      
      {/* Authentication Dialog */}
      <AuthDialog 
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />
    </div>
  );
}

export default AppWrapper;