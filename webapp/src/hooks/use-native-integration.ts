import { useState, useEffect, useCallback } from 'react';
import { debug, info, error } from '../utils/logger';

// Types for native app integration
interface NativeAppMessage {
  type: 'LOGIN' | 'SEARCH' | 'BOOKING' | 'SHARE' | 'CONFIG';
  payload: any;
}

interface NativeAppInfo {
  platform: 'ios' | 'android' | 'unknown';
  version: string;
  device: string;
  isNative: boolean;
}

interface UseNativeIntegrationReturn {
  isInNativeApp: boolean;
  nativeAppInfo: NativeAppInfo | null;
  sendToNativeApp: (message: NativeAppMessage) => Promise<any>;
  openDeepLink: (path: string, params?: Record<string, string>) => void;
}

/**
 * Hook for integrating with native mobile apps
 * Provides detection of native app webview and methods for communication
 */
export function useNativeIntegration(): UseNativeIntegrationReturn {
  const [isInNativeApp, setIsInNativeApp] = useState(false);
  const [nativeAppInfo, setNativeAppInfo] = useState<NativeAppInfo | null>(null);

  // Detect if running in a native app's webview
  useEffect(() => {
    const detectNativeApp = () => {
      try {
        // Check for native app's specific properties in window or userAgent
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check if a native app identifier is present
        const isIosNative = userAgent.includes('flightfinderapp_ios');
        const isAndroidNative = userAgent.includes('flightfinderapp_android');
        
        // Check if we're running in an app webview
        const isInWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent) || 
                          /Android.*wv/.test(navigator.userAgent);
        
        if (isIosNative || isAndroidNative || (isInWebView && window['ReactNativeWebView'])) {
          setIsInNativeApp(true);
          
          // Determine platform details
          const platform = isIosNative ? 'ios' : 
                         isAndroidNative ? 'android' : 'unknown';
          
          // Extract version if available
          const versionMatch = userAgent.match(/flightfinderapp_(ios|android)\/([0-9.]+)/);
          const version = versionMatch ? versionMatch[2] : '1.0.0';
          
          // Extract device info
          const deviceMatch = userAgent.match(/\(([^)]+)\)/);
          const device = deviceMatch ? deviceMatch[1] : 'Unknown Device';
          
          setNativeAppInfo({
            platform,
            version,
            device,
            isNative: true
          });
          
          info(`Running in native app: ${platform} ${version} on ${device}`);
        } else {
          debug('Not running in native app environment');
        }
      } catch (err) {
        error('Error detecting native app:', err);
      }
    };
    
    detectNativeApp();
  }, []);
  
  // Function to send messages to the native app
  const sendToNativeApp = useCallback(async (message: NativeAppMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!isInNativeApp) {
        debug('Not in native app, message not sent', message);
        reject(new Error('Not running in native app environment'));
        return;
      }
      
      try {
        const messageString = JSON.stringify(message);
        
        // Set up response handler
        const messageHandler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            
            if (response.id === message.type) {
              window.removeEventListener('message', messageHandler);
              resolve(response.data);
            }
          } catch (err) {
            // Ignore non-JSON messages
          }
        };
        
        // Listen for response
        window.addEventListener('message', messageHandler);
        
        // Send message to native app
        if (window['ReactNativeWebView']) {
          // React Native WebView
          window['ReactNativeWebView'].postMessage(messageString);
        } else if (window['webkit'] && window['webkit'].messageHandlers) {
          // iOS WKWebView
          window['webkit'].messageHandlers.flightFinderApp.postMessage(messageString);
        } else if (window['FlightFinderApp']) {
          // Android WebView
          window['FlightFinderApp'].postMessage(messageString);
        } else {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Native app messaging interface not found'));
        }
        
        // Set timeout for response
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Native app message timeout'));
        }, 5000);
        
      } catch (err) {
        error('Error sending message to native app:', err);
        reject(err);
      }
    });
  }, [isInNativeApp]);
  
  // Function to open a deep link
  const openDeepLink = useCallback((path: string, params: Record<string, string> = {}): void => {
    try {
      // Construct deep link URL
      const baseUrl = 'flightfinder://';
      const queryParams = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      const deepLinkUrl = `${baseUrl}${path}${queryParams ? `?${queryParams}` : ''}`;
      
      // If in native app, use native navigation
      if (isInNativeApp) {
        sendToNativeApp({
          type: 'CONFIG',
          payload: { action: 'navigate', path, params }
        }).catch(err => error('Failed to navigate in native app:', err));
        return;
      }
      
      // Otherwise try to open deep link
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLinkUrl;
      document.body.appendChild(iframe);
      
      // Clean up iframe after attempt
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
    } catch (err) {
      error('Error opening deep link:', err);
    }
  }, [isInNativeApp, sendToNativeApp]);
  
  return {
    isInNativeApp,
    nativeAppInfo,
    sendToNativeApp,
    openDeepLink
  };
}