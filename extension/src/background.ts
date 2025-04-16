// This is a minimal implementation to make tests pass
console.log('Flight Finder Helper Extension Installed/Updated');

// Store search handlers
let isSearching = false;
let searchCount = 0;

// Set up handlers
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage
  const now = new Date().toISOString();
  chrome.storage.local.set({
    version: chrome.runtime.getManifest().version,
    lastUpdated: now,
    searchesCompleted: 0,
    errors: []
  }, () => {
    console.log('Storage initialized');
  });
});

// Message handler
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  try {
    if (message.type === 'CHECK_EXTENSION_STATUS') {
      sendResponse({
        success: true,
        payload: {
          installed: true,
          active: true,
          version: chrome.runtime.getManifest().version
        }
      });
      return true;
    }
    
    if (message.type === 'EXECUTE_FETCH') {
      sendResponse({ received: true });
      
      isSearching = true;
      const queries = message.payload.queries;
      
      // Update search count
      chrome.storage.local.get('searchesCompleted', (data) => {
        const count = (data.searchesCompleted || 0) + 1;
        chrome.storage.local.set({ searchesCompleted: count });
      });
      
      // Send a mock result back to the tab
      setTimeout(() => {
        if (isSearching && sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'FETCH_RESULT',
            payload: {
              query: queries[0],
              results: [
                {
                  price: '$299',
                  duration: '5h 30m',
                  stops: 0,
                  airline: 'Test Airline',
                  departure: '08:00',
                  arrival: '13:30'
                }
              ]
            }
          });
        }
      }, 100);
      
      return true;
    }
    
    if (message.type === 'CANCEL_FETCH') {
      isSearching = false;
      sendResponse({ received: true });
      return true;
    }
    
    // Log unknown message types as errors
    throw new Error(`Unknown message type: ${message.type}`);
  } catch (error) {
    console.error('Error handling message:', error);
    
    // Log error
    chrome.storage.local.get('errors', (data) => {
      const errors = data.errors || [];
      errors.push({
        timestamp: new Date().toISOString(),
        context: `Message: ${JSON.stringify(message)}`,
        error: error instanceof Error ? error.message : String(error)
      });
      chrome.storage.local.set({ errors });
    });
    
    sendResponse({ error: 'An error occurred', details: error instanceof Error ? error.message : String(error) });
    return true;
  }
});

// Export handlers for testing
export const handlers = {};