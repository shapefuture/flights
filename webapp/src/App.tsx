import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './components/ui/table'
import { Progress } from './components/ui/progress'
import { ScrollArea } from './components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { checkExtensionStatus, sendMessageToExtension, listenForExtensionMessages } from './services/extensionService'
import { callAgentApi } from './services/apiService'
import { generateQueries, FlightQuery } from './utils/queryGenerator'
import { format, formatDistanceToNow, addMinutes, parseISO } from 'date-fns'
import { Plane, Calendar, Clock, Zap, User, ChevronDown, Check, X, Filter, RotateCcw, Star } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
import { Badge } from './components/ui/badge'
import { CalendarView } from './components/calendar-view'
import { SavedSearches } from './components/saved-searches'
import { FlightFilters } from './components/flight-filters'

// Type for flight results
interface FlightResult {
  price: string;
  duration: string;
  stops: number;
  airline: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  layoverAirports?: string[];
  layoverDurations?: string[];
  cabinClass?: string;
}

function App() {
  const [query, setQuery] = useState('')
  const [thinking, setThinking] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [generatedQueries, setGeneratedQueries] = useState<FlightQuery[]>([])
  const [pendingQueries, setPendingQueries] = useState<FlightQuery[]>([])
  const [batchSize, setBatchSize] = useState(5)
  const [results, setResults] = useState<FlightResult[]>([])
  const [filteredResults, setFilteredResults] = useState<FlightResult[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState({ installed: false, active: false })
  const [error, setError] = useState<string | null>(null)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [savedSearches, setSavedSearches] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('list')
  const [filters, setFilters] = useState({
    maxPrice: 2000,
    maxStops: 2,
    airlines: [] as string[],
    departureTime: [0, 24], // Hours
    arrivalTime: [0, 24]    // Hours
  })
  
  // Check extension status on component mount
  useEffect(() => {
    const checkExtension = async () => {
      const status = await checkExtensionStatus()
      setExtensionStatus(status)
    }
    
    checkExtension()
    
    // Load saved searches from localStorage
    const savedSearchesFromStorage = localStorage.getItem('savedSearches')
    if (savedSearchesFromStorage) {
      try {
        setSavedSearches(JSON.parse(savedSearchesFromStorage))
      } catch (e) {
        console.error('Error loading saved searches:', e)
      }
    }
  }, [])
  
  // Apply filters when filters or results change
  useEffect(() => {
    filterResults()
  }, [filters, results])

  // Listen for messages from the extension
  useEffect(() => {
    const cleanup = listenForExtensionMessages((message) => {
      console.log('Received message from extension:', message);
      
      if (message.type === 'FETCH_RESULT') {
        // Update state with new results only if not canceled
        if (!cancelRequested) {
          // Add the new results
          setResults(prev => [...prev, ...message.payload.results]);
          
          // Update progress based on total generated queries
          if (generatedQueries.length > 0) {
            const newProgress = Math.min(
              100, 
              Math.round(((generatedQueries.length - pendingQueries.length + 1) / generatedQueries.length) * 100)
            );
            setProgress(newProgress);
          }
        }
      }
      
      if (message.type === 'FETCH_ERROR') {
        if (!cancelRequested) {
          setError(`Error fetching flight data: ${message.payload.error}`);
        }
      }
      
      if (message.type === 'BATCH_COMPLETE') {
        // If we have pending queries and are not canceled, send the next batch
        if (pendingQueries.length > 0 && !cancelRequested) {
          sendNextBatch();
        } else if (pendingQueries.length === 0 && !cancelRequested) {
          // All queries complete, move to next step if there is one
          if (plan && currentStepIndex < plan.steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
          }
        }
      }
    });
    
    return cleanup;
  }, [generatedQueries.length, pendingQueries, plan, currentStepIndex, cancelRequested]);

  // Function to send the next batch of queries to the extension
  const sendNextBatch = async () => {
    if (pendingQueries.length === 0 || cancelRequested) return;
    
    const batch = pendingQueries.slice(0, batchSize);
    const remaining = pendingQueries.slice(batchSize);
    
    try {
      await sendMessageToExtension({
        type: 'EXECUTE_FETCH',
        payload: {
          queries: batch,
          batchId: Date.now()
        }
      });
      
      // Update pending queries
      setPendingQueries(remaining);
    } catch (e) {
      setError(`Failed to communicate with extension: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  
  // Execute current plan step when it changes
  useEffect(() => {
    if (!plan || !plan.steps || plan.steps.length === 0) return;
    if (cancelRequested) return;
    
    const executeCurrentStep = async () => {
      const step = plan.steps[currentStepIndex];
      
      if (!step) return;
      
      try {
        if (step.action === 'generate_search_queries') {
          // Use our query generator to handle complex date/location logic
          const queries = generateQueries(step.parameters);
          
          setGeneratedQueries(queries);
          setPendingQueries(queries); // All queries are pending initially
          setCurrentStepIndex(currentStepIndex + 1);
        }
        
        else if (step.action === 'execute_flight_fetch') {
          // If extension is not available, show error and skip
          if (!extensionStatus.active) {
            setError('Browser extension is not active. Please install the extension for real-time flight data.');
            
            // Skip to next step if there is one
            if (currentStepIndex < plan.steps.length - 1) {
              setCurrentStepIndex(currentStepIndex + 1);
            }
            return;
          }
          
          // Start the batch processing
          sendNextBatch();
          
          // Note: The rest of this step is handled by the message listener
          // which will move to the next step when all batches are complete
        }
        
        else if (step.action === 'summarize_results') {
          // For now we'll just sort the results
          // In a real implementation, this would call back to the LLM
          // to generate a summary of the results
          
          setResults(prev => {
            const sorted = [...prev].sort((a, b) => {
              const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
              const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
              return priceA - priceB;
            });
            
            // If there's a limit parameter, apply it
            if (step.parameters.limit && typeof step.parameters.limit === 'number') {
              return sorted.slice(0, step.parameters.limit);
            }
            
            return sorted;
          });
          
          // Mark as complete
          setProgress(100);
        }
        
      } catch (e) {
        console.error('Error executing step:', e);
        setError(`Error executing step: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    
    executeCurrentStep();
  }, [plan, currentStepIndex, extensionStatus.active, cancelRequested]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setThinking('');
    setPlan(null);
    setResults([]);
    setFilteredResults([]);
    setProgress(0);
    setError(null);
    setGeneratedQueries([]);
    setPendingQueries([]);
    setCurrentStepIndex(0);
    setCancelRequested(false);
    
    try {
      const response = await callAgentApi(query);
      
      if (response.error) {
        setError(response.error);
      } else {
        setThinking(response.thinking || '');
        setPlan(response.plan);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to process query: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFeedback = async (feedback: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await callAgentApi(query, {
        originalQuery: query,
        previousPlan: plan,
        currentResultsSample: results.slice(0, 3), // Send a sample of current results
        userFeedback: feedback
      });
      
      if (response.error) {
        setError(response.error);
      } else {
        setThinking(response.thinking || '');
        setPlan(response.plan);
        // Reset execution state
        setResults([]);
        setFilteredResults([]);
        setProgress(0);
        setCurrentStepIndex(0);
        setGeneratedQueries([]);
        setPendingQueries([]);
        setCancelRequested(false);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(`Failed to process feedback: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setCancelRequested(true);
    // Send cancel message to extension
    try {
      sendMessageToExtension({
        type: 'CANCEL_FETCH'
      });
    } catch (e) {
      console.error('Error sending cancel message:', e);
    }
  };
  
  const filterResults = () => {
    if (!results.length) {
      setFilteredResults([]);
      return;
    }
    
    const filtered = results.filter(flight => {
      // Filter by price
      const flightPrice = parseInt(flight.price.replace(/[^0-9]/g, ''));
      if (flightPrice > filters.maxPrice) return false;
      
      // Filter by stops
      if (flight.stops > filters.maxStops) return false;
      
      // Filter by airlines
      if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) return false;
      
      // Filter by departure time
      const depHour = parseInt(flight.departure.split(':')[0]);
      if (depHour < filters.departureTime[0] || depHour > filters.departureTime[1]) return false;
      
      // Filter by arrival time
      const arrHour = parseInt(flight.arrival.split(':')[0]);
      if (arrHour < filters.arrivalTime[0] || arrHour > filters.arrivalTime[1]) return false;
      
      return true;
    });
    
    setFilteredResults(filtered);
  };
  
  const saveSearch = () => {
    if (!query) return;
    
    const updatedSearches = [...savedSearches];
    if (!updatedSearches.includes(query)) {
      updatedSearches.push(query);
      setSavedSearches(updatedSearches);
      localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
    }
  };
  
  const loadSavedSearch = (savedQuery: string) => {
    setQuery(savedQuery);
  };
  
  // Calculate summary stats for the displayed flights
  const calculateStats = () => {
    if (filteredResults.length === 0) return null;
    
    const prices = filteredResults.map(r => parseInt(r.price.replace(/[^0-9]/g, '')));
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    return {
      cheapest: `$${cheapest}`,
      expensive: `$${expensive}`,
      average: `$${average}`,
      totalOptions: filteredResults.length
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="min-h-screen pb-12">
      <header className="py-8 mb-8 border-b relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center mb-3 animate-float">
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold gradient-heading">Flight Finder Agent</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-xl">
              Your AI-powered assistant for finding the perfect flights using natural language
            </p>
            
            <div className="w-full max-w-3xl mt-6">
              <form onSubmit={handleSubmit} className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="E.g., Find me a flight from NYC to London next weekend for under $800"
                  className="pr-36 glass-effect shadow-lg text-base py-6"
                  disabled={isLoading}
                />
                <div className="absolute right-1.5 top-1.5 flex gap-2">
                  {query && results.length > 0 && (
                    <Button 
                      type="button" 
                      size="sm"
                      variant="outline"
                      onClick={saveSearch}
                      className="flex items-center"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="button-glow"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Zap className="mr-1 h-4 w-4" />
                        Search Flights
                      </span>
                    )}
                  </Button>
                </div>
              </form>
              
              <div className="flex items-center justify-center mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <Badge variant={extensionStatus.active ? "success" : "secondary"} className="text-xs">
                    {extensionStatus.active 
                      ? "Extension Active" 
                      : extensionStatus.installed 
                        ? "Extension Installed" 
                        : "Extension Not Installed"}
                  </Badge>
                </span>
                
                {savedSearches.length > 0 && (
                  <div className="ml-4 flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      {savedSearches.length} Saved {savedSearches.length === 1 ? 'Search' : 'Searches'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100 rounded-full opacity-20 -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100 rounded-full opacity-20 translate-y-1/3 -translate-x-1/3"></div>
      </header>

      {error && (
        <div className="container mx-auto px-4 max-w-6xl mb-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 animate-fade-in">
            <div className="flex items-start">
              <X className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        {(thinking || plan || results.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="card-highlight h-full overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16.01V16M12 8V12M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  {(thinking || plan) && (
                    <>
                      <ScrollArea className="h-[400px] border rounded-md p-4 overflow-hidden">
                        {thinking && (
                          <div className="mb-4 animate-fade-in">
                            <h3 className="text-sm font-medium mb-2 text-blue-700">Thinking Process:</h3>
                            <p className="text-sm whitespace-pre-line text-gray-700">{thinking}</p>
                          </div>
                        )}
                        
                        {plan && (
                          <div className="animate-fade-in">
                            <h3 className="text-sm font-medium mb-2 text-blue-700">Execution Plan:</h3>
                            <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto border text-gray-700">
                              {JSON.stringify(plan, null, 2)}
                            </pre>
                          </div>
                        )}
                      </ScrollArea>
                      
                      {generatedQueries.length > 0 && (
                        <div className="mt-4 animate-fade-in">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-700">Search Parameters:</h3>
                            <Badge variant="outline" className="text-xs">
                              {generatedQueries.length} {generatedQueries.length === 1 ? 'query' : 'queries'}
                            </Badge>
                          </div>
                          <div className="text-xs p-3 bg-gray-50 rounded-md border">
                            <div className="grid grid-cols-2 gap-y-1 text-gray-600">
                              <div className="flex items-center">
                                <Plane className="h-3 w-3 mr-1 rotate-45" />
                                From: <span className="ml-1 font-medium">{generatedQueries[0].origin}</span>
                              </div>
                              <div className="flex items-center">
                                <Plane className="h-3 w-3 mr-1 -rotate-45" />
                                To: <span className="ml-1 font-medium">{generatedQueries[0].dest}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Depart: <span className="ml-1 font-medium">{generatedQueries[0].depDate}</span>
                              </div>
                              {generatedQueries[0].retDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Return: <span className="ml-1 font-medium">{generatedQueries[0].retDate}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                Passengers: <span className="ml-1 font-medium">
                                  {generatedQueries[0].numAdults || 1}
                                  {(generatedQueries[0].numChildren || 0) > 0 ? ` + ${generatedQueries[0].numChildren} child` : ''}
                                  {(generatedQueries[0].numInfants || 0) > 0 ? ` + ${generatedQueries[0].numInfants} infant` : ''}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1">
                                  <path d="M3.5 12H5m11 0h4.5m-15-4H15m-4.5 8H19" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Class: <span className="ml-1 font-medium capitalize">
                                  {generatedQueries[0].cabinClass || 'Economy'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(progress > 0 && progress < 100) && (
                        <div className="mt-4 animate-fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Search Progress:</h3>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancel}
                              className="h-7 text-xs flex items-center"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {progress}% complete - {generatedQueries.length - pendingQueries.length} of {generatedQueries.length} searches processed
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {results.length > 0 && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                      <h3 className="text-sm font-medium text-gray-700">Refine Results:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleFeedback('Find cheaper options')} className="flex items-center justify-center text-xs">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1.5">
                            <path d="M6 19L19 6M6 6l13 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Cheaper Options
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleFeedback('Need fewer stops')} className="flex items-center justify-center text-xs">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1.5">
                            <path d="M5 12h14M5 12a2 2 0 104 0V6.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Fewer Stops
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleFeedback('Show more options')} className="flex items-center justify-center text-xs">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3 mr-1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          More Options
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleFeedback('Show earlier flights')} className="flex items-center justify-center text-xs">
                          <Clock className="h-3 w-3 mr-1.5" />
                          Earlier Flights
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  {results.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs flex items-center justify-center" 
                      onClick={saveSearch}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      Save This Search
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="card-highlight overflow-hidden">
                <CardHeader className="pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-xl flex items-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 21V15a2 2 0 00-2-2H6a2 2 0 00-2 2v6m10-6h7m-3 3V6m0 0L15 9m3-3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      Flight Results
                    </CardTitle>
                    
                    {stats && (
                      <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                        {filteredResults.length} of {results.length} options shown
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-3">
                  {results.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <Tabs defaultValue="list" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="mb-2 grid grid-cols-3 gap-x-1">
                            <TabsTrigger value="list" className="text-xs sm:text-sm">List View</TabsTrigger>
                            <TabsTrigger value="calendar" className="text-xs sm:text-sm">Calendar View</TabsTrigger>
                            <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved Searches</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="list" className="animate-fade-in">
                            {stats && (
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="rounded-lg border p-2 text-center glass-effect">
                                  <div className="text-2xl font-bold text-blue-600">{stats.cheapest}</div>
                                  <div className="text-xs text-muted-foreground">Cheapest Option</div>
                                </div>
                                <div className="rounded-lg border p-2 text-center glass-effect">
                                  <div className="text-2xl font-bold text-gray-700">{stats.average}</div>
                                  <div className="text-xs text-muted-foreground">Average Price</div>
                                </div>
                                <div className="rounded-lg border p-2 text-center glass-effect">
                                  <div className="text-2xl font-bold text-pink-600">{stats.expensive}</div>
                                  <div className="text-xs text-muted-foreground">Most Expensive</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="mb-4">
                              <FlightFilters 
                                results={results}
                                filters={filters}
                                setFilters={setFilters}
                              />
                            </div>
                            
                            {filteredResults.length > 0 ? (
                              <div className="rounded-lg border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[120px]">Price</TableHead>
                                      <TableHead>Airline</TableHead>
                                      <TableHead>Duration</TableHead>
                                      <TableHead>Departure</TableHead>
                                      <TableHead>Arrival</TableHead>
                                      <TableHead className="text-right">Stops</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredResults.map((flight, i) => (
                                      <TableRow key={i} className="cursor-pointer hover:bg-blue-50/50">
                                        <TableCell className="font-medium text-blue-600">{flight.price}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 mr-2 flex items-center justify-center overflow-hidden">
                                              {flight.airline.charAt(0)}
                                            </div>
                                            <span>{flight.airline}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>{flight.duration}</TableCell>
                                        <TableCell>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{flight.departure}</span>
                                                  <span className="text-xs text-gray-500">{flight.origin}</span>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Departure: {flight.departureDate}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{flight.arrival}</span>
                                                  <span className="text-xs text-gray-500">{flight.destination}</span>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Arrival: {flight.returnDate || flight.departureDate}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant={flight.stops === 0 ? "success" : flight.stops === 1 ? "outline" : "secondary"} className="ml-auto">
                                            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops !== 1 ? 's' : ''}`}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-12 border rounded-lg bg-gray-50/50">
                                <Filter className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <h3 className="text-lg font-medium text-gray-500">No matching flights</h3>
                                <p className="text-sm text-gray-400">Try adjusting your filters</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setFilters({
                                    maxPrice: 2000,
                                    maxStops: 2,
                                    airlines: [],
                                    departureTime: [0, 24],
                                    arrivalTime: [0, 24]
                                  })}
                                  className="mt-3"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  Reset Filters
                                </Button>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="calendar" className="animate-fade-in">
                            <CalendarView results={results} />
                          </TabsContent>
                          
                          <TabsContent value="saved" className="animate-fade-in">
                            <SavedSearches 
                              searches={savedSearches} 
                              onSelect={loadSavedSearch} 
                              onDelete={(search) => {
                                const updated = savedSearches.filter(s => s !== search);
                                setSavedSearches(updated);
                                localStorage.setItem('savedSearches', JSON.stringify(updated));
                              }}
                            />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50/50 animate-fade-in">
                      {isLoading ? (
                        <div className="space-y-3">
                          <div className="inline-block p-3 rounded-full bg-blue-100/50">
                            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Searching for flights...</h3>
                          <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            Our AI agent is analyzing your query and searching for the best flight options
                          </p>
                        </div>
                      ) : thinking ? (
                        <div className="space-y-3">
                          <div className="inline-block p-3 rounded-full bg-blue-100/50">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10 text-blue-600">
                              <path d="M9.25 7A.25.25 0 019.5 6.75h5a.25.25 0 01.25.25v1.5a.25.25 0 01-.25.25h-5a.25.25 0 01-.25-.25V7zm0 4A.25.25 0 019.5 10.75h5a.25.25 0 01.25.25v1.5a.25.25 0 01-.25.25h-5a.25.25 0 01-.25-.25V11zm0 4A.25.25 0 019.5 14.75h5a.25.25 0 01.25.25v1.5a.25.25 0 01-.25.25h-5a.25.25 0 01-.25-.25V15zM4 5.75A.75.75 0 014.75 5h14.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75V5.75z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Processing your request...</h3>
                          <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            Our AI agent is analyzing your query and preparing to search for flights
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-block p-3 rounded-full bg-gray-100">
                            <Plane className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-500">No results yet</h3>
                          <p className="text-sm text-gray-400 max-w-sm mx-auto">
                            Enter a natural language query above to search for flights
                          </p>
                          <div className="text-left max-w-sm mx-auto mt-6 bg-gray-50 p-3 rounded-md border text-sm text-gray-500">
                            <p className="font-medium mb-1">Example queries:</p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>Find me a flight from NYC to London next weekend</li>
                              <li>I need a cheap flight from SFO to Tokyo in December</li>
                              <li>Show flights from Miami to Cancun for 4 people in March</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="inline-block p-4 rounded-full bg-blue-100/30 mb-4 animate-float">
              <Plane className="h-12 w-12 text-blue-600 animate-pulse-slow" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Ready to Plan Your Trip?</h2>
            <p className="text-gray-600 max-w-xl">
              Enter a natural language query above to find flights that match your preferences.
              Our AI agent will understand your needs and search for the best options.
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <Card className="card-highlight">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 mb-2 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600">
                      <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <CardTitle className="text-lg">Natural Language</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Ask for flights just like you would a travel agent. Specify dates, locations, and preferences in plain language.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-highlight">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 mb-2 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <CardTitle className="text-lg">Flexible Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Search across multiple dates, airports, and preferences to find the perfect flight options.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-highlight">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 mb-2 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <CardTitle className="text-lg">Smart Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    View results in list or calendar format, with smart filtering and sorting options.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-100 text-gray-500 text-sm">
              <p>Install the browser extension for enhanced flight search capabilities</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App