import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/ui/table'
import { Progress } from './components/ui/progress'
import { ScrollArea } from './components/ui/scroll-area'
import { checkExtensionStatus, sendMessageToExtension, listenForExtensionMessages } from './services/extensionService'
import { callAgentApi } from './services/apiService'
import { generateQueries, FlightQuery } from './utils/queryGenerator'

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
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [extensionStatus, setExtensionStatus] = useState({ installed: false, active: false })
  const [error, setError] = useState<string | null>(null)
  const [cancelRequested, setCancelRequested] = useState(false)
  
  // Check extension status on component mount
  useEffect(() => {
    const checkExtension = async () => {
      const status = await checkExtensionStatus()
      setExtensionStatus(status)
    }
    
    checkExtension()
  }, [])

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
  
  // Calculate summary stats for the displayed flights
  const calculateStats = () => {
    if (results.length === 0) return null;
    
    const prices = results.map(r => parseInt(r.price.replace(/[^0-9]/g, '')));
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    return {
      cheapest: `$${cheapest}`,
      expensive: `$${expensive}`,
      average: `$${average}`,
      totalOptions: results.length
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Flight Finder Agent</h1>
        <p className="text-gray-500 mt-2">Ask in natural language to find your perfect flight</p>
      </header>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Find me a flight from NYC to London next weekend for under $800"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium">
                Extension Status: {' '}
                <span 
                  className={extensionStatus.active 
                    ? "text-green-600" 
                    : "text-amber-500"
                  }
                >
                  {extensionStatus.active 
                    ? "Active" 
                    : extensionStatus.installed 
                      ? "Installed (not active)" 
                      : "Not Installed"
                  }
                </span>
              </p>
            </div>
            
            {(thinking || plan) && (
              <>
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  {thinking && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Thinking:</h3>
                      <p className="text-sm whitespace-pre-line">{thinking}</p>
                    </div>
                  )}
                  
                  {plan && (
                    <div>
                      <h3 className="font-medium mb-2">Plan:</h3>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(plan, null, 2)}
                      </pre>
                    </div>
                  )}
                </ScrollArea>
                
                {generatedQueries.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Generated Queries:</h3>
                    <p className="text-xs text-gray-600">{generatedQueries.length} queries generated</p>
                    <div className="text-xs mt-1">
                      <p className="text-gray-500">
                        Sample: {generatedQueries[0].origin} → {generatedQueries[0].dest} on {generatedQueries[0].depDate}
                        {generatedQueries[0].retDate ? ` (return: ${generatedQueries[0].retDate})` : ' (one-way)'}
                      </p>
                    </div>
                  </div>
                )}
                
                {(progress > 0 && progress < 100) && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Progress:</h3>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {progress}% complete - {generatedQueries.length - pendingQueries.length} of {generatedQueries.length} queries processed
                    </p>
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">Refine Results:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleFeedback('Find cheaper options')}>
                        Find Cheaper
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleFeedback('Need fewer stops')}>
                        Fewer Stops
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleFeedback('Show more options')}>
                        More Options
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Flight Results</CardTitle>
              {stats && (
                <div className="text-sm text-muted-foreground">
                  {stats.totalOptions} options found
                </div>
              )}
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg border p-2 text-center">
                    <div className="text-2xl font-bold">{stats.cheapest}</div>
                    <div className="text-xs text-muted-foreground">Cheapest</div>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <div className="text-2xl font-bold">{stats.average}</div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <div className="text-2xl font-bold">{stats.expensive}</div>
                    <div className="text-xs text-muted-foreground">Most Expensive</div>
                  </div>
                </div>
              )}
            
              {results.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Airline</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Arrival</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((flight, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{flight.price}</TableCell>
                        <TableCell>{flight.duration}</TableCell>
                        <TableCell>{flight.stops}</TableCell>
                        <TableCell>{flight.airline}</TableCell>
                        <TableCell>{flight.departure}</TableCell>
                        <TableCell>{flight.arrival}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {isLoading 
                    ? "Searching for flights..." 
                    : thinking 
                      ? "Processing your request..." 
                      : "No results yet. Start by entering a query above."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App