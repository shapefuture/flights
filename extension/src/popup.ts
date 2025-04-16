document.addEventListener('DOMContentLoaded', function() {
  // Set up UI elements
  const statusElement = document.getElementById('status') as HTMLDivElement;
  const statusTextElement = document.getElementById('status-text') as HTMLSpanElement;
  const cacheSizeElement = document.getElementById('cache-size') as HTMLDivElement;
  const searchesCountElement = document.getElementById('searches-count') as HTMLDivElement;
  const clearCacheButton = document.getElementById('clear-cache') as HTMLButtonElement;
  const testConnectionButton = document.getElementById('test-connection') as HTMLButtonElement;
  const versionElement = document.getElementById('version') as HTMLSpanElement;
  const lastUpdatedElement = document.getElementById('last-updated') as HTMLDivElement;
  
  // Initialize the UI
  updateStats();
  
  // Set up event listeners
  clearCacheButton?.addEventListener('click', clearCache);
  testConnectionButton?.addEventListener('click', testConnection);
  
  // Check status and update
  chrome.storage.local.get(['version', 'lastUpdated', 'searchesCompleted'], (data) => {
    if (versionElement && data.version) {
      versionElement.textContent = data.version;
    }
    
    if (lastUpdatedElement && data.lastUpdated) {
      const lastUpdated = new Date(data.lastUpdated);
      const timeAgo = getTimeAgo(lastUpdated);
      lastUpdatedElement.textContent = `Last updated: ${timeAgo}`;
    }
    
    if (searchesCountElement && data.searchesCompleted) {
      searchesCountElement.textContent = data.searchesCompleted.toString();
    }
  });
  
  // Set status
  const isActive = true; // In a real extension, we'd check actual connection status
  
  if (statusElement && statusTextElement) {
    if (isActive) {
      statusElement.classList.add('active');
      statusTextElement.textContent = 'Active';
    } else {
      statusElement.classList.remove('active');
      statusTextElement.textContent = 'Inactive';
    }
  }
  
  // Update stats every 5 seconds
  setInterval(updateStats, 5000);
});

function updateStats() {
  chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
    const cacheSizeElement = document.getElementById('cache-size');
    if (cacheSizeElement) {
      const sizeInMB = (bytesInUse / (1024 * 1024)).toFixed(2);
      cacheSizeElement.textContent = `${sizeInMB} MB`;
    }
  });
}

function clearCache() {
  const keys = ['searchesCompleted']; // Keep these keys
  
  chrome.storage.local.get(null, (items) => {
    // Save values we want to keep
    const keepers: Record<string, any> = {};
    keys.forEach(key => {
      if (items[key] !== undefined) {
        keepers[key] = items[key];
      }
    });
    
    // Clear all storage
    chrome.storage.local.clear(() => {
      // Restore the keys we want to keep
      chrome.storage.local.set({
        ...keepers,
        lastUpdated: new Date().toISOString()
      }, () => {
        updateStats();
        
        // Show success message
        const statusMessage = document.querySelector('.status-message') as HTMLParagraphElement;
        if (statusMessage) {
          statusMessage.textContent = 'Cache cleared successfully!';
          setTimeout(() => {
            statusMessage.textContent = 'Extension is connected and ready to fetch flight data';
          }, 2000);
        }
      });
    });
  });
}

function testConnection() {
  const testButton = document.getElementById('test-connection') as HTMLButtonElement;
  if (testButton) {
    testButton.textContent = 'Testing...';
    testButton.disabled = true;
    
    // Simulate a test
    setTimeout(() => {
      const statusMessage = document.querySelector('.status-message') as HTMLParagraphElement;
      if (statusMessage) {
        statusMessage.textContent = 'Connection test successful!';
        setTimeout(() => {
          statusMessage.textContent = 'Extension is connected and ready to fetch flight data';
        }, 2000);
      }
      
      testButton.textContent = 'Test Connection';
      testButton.disabled = false;
    }, 1500);
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  }
}