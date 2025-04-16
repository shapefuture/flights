// Extension ID will be provided at runtime or during development.
// For testing, we can leave it undefined to match any extension with the right host permissions
const EXTENSION_ID = undefined;

/**
 * Check if the browser extension is installed and active
 * 
 * @returns Object indicating if extension is installed and active
 */
export function checkExtensionStatus(): Promise<{ installed: boolean; active: boolean }> {
  // If we're not in a browser with the chrome extension API, return immediately
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return Promise.resolve({ installed: false, active: false });
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: 'CHECK_EXTENSION_STATUS' },
      (response) => {
        if (chrome.runtime.lastError) {
          // Extension not installed or not accessible
          resolve({ installed: false, active: false });
        } else {
          // Extension responded
          resolve(response?.payload || { installed: true, active: false });
        }
      }
    );

    // Add timeout in case extension doesn't respond
    setTimeout(() => resolve({ installed: false, active: false }), 500);
  });
}

/**
 * Send a message to the browser extension
 * 
 * @param message - The message object to send
 * @returns Promise that resolves when message is sent
 */
export function sendMessageToExtension(message: object): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      reject(new Error('Chrome extension API not available'));
      return;
    }

    chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Set up a listener for messages from the extension
 * 
 * @param callback - Function to call when a message is received
 * @returns Function to remove the listener
 */
export function listenForExtensionMessages(callback: (message: any) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
    console.warn('Chrome extension API not available');
    return () => {}; // No-op cleanup
  }

  const listener = (message: any, sender: any, sendResponse: any) => {
    callback(message);
    sendResponse({ received: true });
    return true; // Keep the message channel open for async response
  };

  chrome.runtime.onMessage.addListener(listener);

  // Return a cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}