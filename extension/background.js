// Listen for extension installation/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flight Finder Helper Extension Installed/Updated');
});

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Received message from web app:', message);
  
  // Check extension status
  if (message.type === 'CHECK_EXTENSION_STATUS') {
    sendResponse({
      payload: {
        installed: true,
        active: true
      }
    });
    return true; // Required for async response
  }
  
  // Handle flight data fetch requests (to be implemented in Phase 3)
  if (message.type === 'EXECUTE_FETCH') {
    console.log('Fetch request received:', message.payload);
    
    // Placeholder - will be implemented in Phase 3
    setTimeout(() => {
      // Send a dummy response back to the web app
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'FETCH_RESULT',
        payload: {
          query: message.payload.queries[0],
          results: [
            {
              price: '$450',
              duration: '8h 30m',
              stops: 1,
              airline: 'Sample Airline',
              departure: '10:00 AM',
              arrival: '6:30 PM'
            }
          ]
        }
      });
    }, 2000);
    
    sendResponse({ received: true });
    return true;
  }
  
  return false;
});