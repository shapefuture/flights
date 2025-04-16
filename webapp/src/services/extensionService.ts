import logger from '../utils/logger';

/**
 * Extension Error class for structured error handling
 */
export class ExtensionError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Extension connection status
 */
export interface ExtensionStatus {
  installed: boolean;
  active: boolean;
  version?: string;
  error?: string;
}

// Constants
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || 'flight-finder-extension';
const CONNECTION_TIMEOUT = 5000; // 5 seconds

/**
 * Check if the extension is installed and active
 * @returns Extension status object
 */
export async function checkExtensionStatus(): Promise<ExtensionStatus> {
  logger.debug('Checking extension status...');
  
  try {
    // First check if the browser supports extensions
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      logger.warn('Browser does not support chrome extension API');
      return {
        installed: false,
        active: false,
        error: 'Browser does not support extensions'
      };
    }
    
    // Create a promise that will timeout
    const timeoutPromise = new Promise<ExtensionStatus>((_, reject) => {
      setTimeout(() => {
        reject(new ExtensionError('Extension communication timed out', 'TIMEOUT'));
      }, CONNECTION_TIMEOUT);
    });
    
    // Create a promise for the actual check
    const checkPromise = new Promise<ExtensionStatus>((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'CHECK_EXTENSION_STATUS' },
          (response) => {
            const lastError = chrome.runtime.lastError;
            
            if (lastError) {
              logger.warn('Extension check error:', lastError.message);
              
              // Check if the error indicates that the extension is not installed
              if (lastError.message.includes('not exist') || 
                  lastError.message.includes('Invalid extension id')) {
                resolve({
                  installed: false,
                  active: false,
                  error: 'Extension not installed'
                });
              } else {
                resolve({
                  installed: true,
                  active: false,
                  error: lastError.message
                });
              }
            } else if (!response) {
              logger.warn('No response from extension');
              resolve({
                installed: true,
                active: false,
                error: 'No response from extension'
              });
            } else {
              logger.debug('Extension is active:', response);
              resolve({
                installed: true,
                active: true,
                version: response.payload?.version
              });
            }
          }
        );
      } catch (error) {
        logger.error('Error checking extension status:', error);
        resolve({
          installed: false,
          active: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Race the timeout and the check
    return await Promise.race([checkPromise, timeoutPromise]);
    
  } catch (error) {
    // Handle timeout or other errors
    if (error instanceof ExtensionError && error.code === 'TIMEOUT') {
      logger.warn('Extension status check timed out');
      return {
        installed: true, // We assume it's installed but not responding
        active: false,
        error: 'Communication timeout'
      };
    }
    
    logger.error('Unexpected error checking extension status:', error);
    return {
      installed: false,
      active: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a message to the extension with error handling
 * @param message Message to send to the extension
 * @returns Promise that resolves with the response
 */
export async function sendMessageToExtension(message: any): Promise<any> {
  logger.debug('Sending message to extension:', message);
  
  try {
    // Check if the browser supports extensions
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      throw new ExtensionError(
        'Browser does not support extensions', 
        'UNSUPPORTED_BROWSER'
      );
    }
    
    // Create a promise that will timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ExtensionError('Extension communication timed out', 'TIMEOUT'));
      }, CONNECTION_TIMEOUT);
    });
    
    // Create a promise for the actual message
    const messagePromise = new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          message,
          (response) => {
            const lastError = chrome.runtime.lastError;
            
            if (lastError) {
              logger.warn('Extension message error:', lastError.message);
              reject(new ExtensionError(
                lastError.message,
                'EXTENSION_ERROR'
              ));
            } else if (!response) {
              logger.warn('No response from extension for message:', message);
              reject(new ExtensionError(
                'No response from extension',
                'NO_RESPONSE'
              ));
            } else {
              logger.debug('Extension response:', response);
              resolve(response);
            }
          }
        );
      } catch (error) {
        logger.error('Error sending message to extension:', error);
        reject(new ExtensionError(
          error instanceof Error ? error.message : 'Unknown error',
          'SEND_ERROR'
        ));
      }
    });
    
    // Race the timeout and the message
    return await Promise.race([messagePromise, timeoutPromise]);
    
  } catch (error) {
    // Standardize the error format
    if (error instanceof ExtensionError) {
      logger.error(`Extension Error (${error.code}):`, error.message);
      throw error;
    }
    
    logger.error('Unexpected error sending message to extension:', error);
    throw new ExtensionError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Listen for messages from the extension, with error handling
 * @param callback Function to call when a message is received
 * @returns Cleanup function to remove the listener
 */
export function listenForExtensionMessages(callback: (message: any) => void): () => void {
  logger.debug('Setting up extension message listener');
  
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    logger.warn('Browser does not support extensions, cannot set up listener');
    return () => {}; // Return empty cleanup function
  }
  
  // For content script messages
  const messageListener = (message: any) => {
    try {
      logger.debug('Received message from extension:', message);
      callback(message);
    } catch (error) {
      logger.error('Error processing extension message:', error);
    }
  };
  
  // Add listener
  try {
    chrome.runtime.onMessage.addListener(messageListener);
    logger.debug('Extension message listener added');
  } catch (error) {
    logger.error('Failed to add extension message listener:', error);
  }
  
  // Return cleanup function
  return () => {
    try {
      chrome.runtime.onMessage.removeListener(messageListener);
      logger.debug('Extension message listener removed');
    } catch (error) {
      logger.error('Failed to remove extension message listener:', error);
    }
  };
}

/**
 * Check if the extension is installed
 * @returns Boolean indicating whether the extension is installed
 */
export function isExtensionInstalled(): boolean {
  try {
    return typeof chrome !== 'undefined' && 
           !!chrome.runtime && 
           typeof chrome.runtime.sendMessage === 'function';
  } catch (error) {
    logger.warn('Error checking if extension is installed:', error);
    return false;
  }
}

// Export a default object with all methods
const extensionService = {
  checkExtensionStatus,
  sendMessageToExtension,
  listenForExtensionMessages,
  isExtensionInstalled
};

export default extensionService;