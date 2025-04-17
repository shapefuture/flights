import React, { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Settings, ArrowRight, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { VoiceSearch } from './components/voice-search';
import { useTheme } from './components/theme-provider';
import { LanguageSwitcher } from './components/language-switcher';
import { ThemeToggle } from './components/theme-toggle';
import { UserAccountNav } from './components/auth/user-account-nav';
import { useTranslations } from './hooks/use-translations';
import { useAuth } from './context/auth-context';
import { AuthDialog } from './components/auth/auth-dialog';
import { NativeAppBanner } from './components/native-app-banner';
import { useNativeIntegration } from './hooks/use-native-integration';
import { saveSearchToHistory } from './services/searchService';
import { FilterContext, FilterProvider } from './context/filter-context';
import { FlightSearch } from './types';
import { info, error as logError } from './utils/logger';

function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [flightResults, setFlightResults] = useState([]);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { t } = useTranslations();
  const { isAppInstalled, showAppBanner } = useNativeIntegration();
  const { user, status } = useAuth();
  
  useEffect(() => {
    // Check if we're already on the results page
    if (location.pathname === '/results') {
      setSearchPerformed(true);
    }
  }, [location]);
  
  const handleVoiceSearch = (voiceText: string) => {
    // Simple parsing of voice commands
    const originRegex = /from\s+([a-zA-Z\s]+)/i;
    const destRegex = /to\s+([a-zA-Z\s]+)/i;
    
    const originMatch = voiceText.match(originRegex);
    const destMatch = voiceText.match(destRegex);
    
    if (originMatch && originMatch[1]) {
      setOrigin(originMatch[1].trim());
    }
    
    if (destMatch && destMatch[1]) {
      setDestination(destMatch[1].trim());
    }
    
    // Could add more sophisticated parsing for dates as well
  };
  
  const handleSearch = async () => {
    if (!origin || !destination) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Log the search
      info('Flight search initiated', { 
        origin, 
        destination, 
        departDate: departDate ? format(departDate, 'yyyy-MM-dd') : null,
        returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : null 
      });
      
      // Create a search object
      const search: FlightSearch = {
        origin,
        destination,
        departureDate: departDate ? format(departDate, 'yyyy-MM-dd') : '',
        returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : '',
        passengers: 1,
        cabinClass: 'economy'
      };
      
      // Save to search history if user is logged in
      if (user) {
        await saveSearchToHistory(search);
      }
      
      // Navigate to results page with search params
      const searchParams = new URLSearchParams();
      searchParams.append('origin', origin);
      searchParams.append('destination', destination);
      if (departDate) {
        searchParams.append('departDate', format(departDate, 'yyyy-MM-dd'));
      }
      if (returnDate) {
        searchParams.append('returnDate', format(returnDate, 'yyyy-MM-dd'));
      }
      
      navigate(`/results?${searchParams.toString()}`);
      setSearchPerformed(true);
    } catch (err) {
      logError('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openCalendarView = () => {
    setShowCalendarView(true);
  };
  
  const getFormattedDateRange = () => {
    if (departDate && returnDate) {
      return `${format(departDate, 'MMM d')} - ${format(returnDate, 'MMM d')}`;
    } else if (departDate) {
      return `${format(departDate, 'MMM d')}`;
    } else {
      return t('search.selectDates');
    }
  };
  
  return (
    <FilterProvider>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b sticky top-0 z-10 bg-background">
          <div className="container py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">Flight Finder</span>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              {status === 'authenticated' ? (
                <UserAccountNav />
              ) : (
                <Button variant="default" onClick={() => setAuthDialogOpen(true)}>
                  {t('auth.signIn')}
                </Button>
              )}
            </div>
          </div>
        </header>
        
        {/* Show app banner if applicable */}
        {showAppBanner && !isAppInstalled && <NativeAppBanner />}
        
        {/* Main Content */}
        <main className="flex-1 container py-8">
          {!searchPerformed ? (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-6 text-center">
                {t('search.headline')}
              </h1>
              
              <div className="bg-card rounded-xl shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('search.origin')}</label>
                    <input 
                      type="text" 
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder={t('search.originPlaceholder')}
                      className="w-full rounded-md border border-input py-2 px-3"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('search.destination')}</label>
                    <input 
                      type="text" 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder={t('search.destinationPlaceholder')}
                      className="w-full rounded-md border border-input py-2 px-3"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('search.dates')}</label>
                  <button 
                    onClick={openCalendarView}
                    className="w-full flex items-center justify-between rounded-md border border-input py-2 px-3 text-left"
                  >
                    <span>
                      {getFormattedDateRange()}
                    </span>
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button onClick={() => setShowVoiceSearch(true)} variant="outline">
                    <Mic className="mr-2 h-4 w-4" /> {t('search.voiceSearch')}
                  </Button>
                  
                  <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? t('search.searching') : t('search.search')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">{t('search.popularDestinations')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['London', 'New York', 'Tokyo', 'Paris'].map((city) => (
                    <div 
                      key={city}
                      className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setDestination(city)}
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <span className="text-2xl">{city.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium">{city}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('search.explore')} {city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Flight results will be rendered through the router */}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="border-t py-6 bg-background">
          <div className="container text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Flight Finder. {t('footer.allRightsReserved')}</p>
          </div>
        </footer>
        
        {/* Dialogs and Modals */}
        <VoiceSearch 
          open={showVoiceSearch} 
          onClose={() => setShowVoiceSearch(false)}
          onSearch={handleVoiceSearch}
        />
        
        <AuthDialog 
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
        />
      </div>
    </FilterProvider>
  );
}

export default App;