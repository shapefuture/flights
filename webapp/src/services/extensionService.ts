// This file handles communication with the browser extension

let extensionConnection: any = null;
let messageQueue: any[] = [];
let isConnected = false;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Function to connect to the extension
export const connectToExtension = () => {
  if (!isBrowser) return;
  
  try {
    // Get the extension URL from environment variables or use a default
    const extensionUrl = import.meta.env?.VITE_EXTENSION_URL || "chrome-extension://[extension-id]";
    
    if (extensionUrl && extensionUrl !== "chrome-extension://[extension-id]") {
      // Attempt to connect to the extension
      console.log("Attempting to connect to extension at:", extensionUrl);
      
      // Logic to connect to the extension would go here
      // This is placeholder code
      isConnected = true;
      
      // Process any messages that were queued while disconnected
      while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        sendMessageToExtension(message);
      }
    }
  } catch (error) {
    console.error("Failed to connect to extension:", error);
  }
};

// Function to send a message to the extension
export const sendMessageToExtension = (message: any) => {
  if (!isBrowser) return Promise.resolve(null);
  
  if (!isConnected) {
    // Queue the message for later if not connected
    messageQueue.push(message);
    return Promise.resolve(null);
  }
  
  try {
    // Actual implementation would use chrome.runtime.sendMessage or similar
    console.log("Sending message to extension:", message);
    return Promise.resolve({ success: true });
  } catch (error) {
    console.error("Error sending message to extension:", error);
    return Promise.resolve(null);
  }
};

// Function to check if extension is installed
export const isExtensionInstalled = () => {
  if (!isBrowser) return false;
  
  // Logic to check if extension is installed
  // This is placeholder code
  return isConnected;
};

// Initialize connection when this module is imported
if (isBrowser) {
  window.addEventListener('load', connectToExtension);
}

export default {
  connectToExtension,
  sendMessageToExtension,
  isExtensionInstalled
};