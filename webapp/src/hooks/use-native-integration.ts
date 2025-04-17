import { useState, useEffect } from 'react';

export interface UseNativeIntegrationReturn {
  isAppInstalled: boolean;
  showAppBanner: boolean;
  appVersion: string | null;
  isNativeApp: boolean;
  openAppStore: () => void;
  dismissBanner: () => void;
}

/**
 * Hook to handle native app integration
 * Detects if the website is running in a native app wrapper
 * and provides functionality for app banner management
 */
export function useNativeIntegration(): UseNativeIntegrationReturn {
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showAppBanner, setShowAppBanner] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);

  // Check if running in a native app context
  useEffect(() => {
    // Check for native app by looking for custom user agent or injected properties
    const userAgent = navigator.userAgent.toLowerCase();
    const isRunningInApp = 
      userAgent.includes('flightfinder') || 
      typeof (window as any).FlightFinderApp !== 'undefined';
    
    setIsNativeApp(isRunningInApp);
    
    // Try to get app version if available
    if (isRunningInApp && (window as any).FlightFinderApp?.getVersion) {
      setAppVersion((window as any).FlightFinderApp.getVersion());
    }
    
    // Check if app is installed (using local storage to remember user's preference)
    const appInstalledStatus = localStorage.getItem('app_installed');
    setIsAppInstalled(appInstalledStatus === 'true');
    
    // Determine if we should show the app banner
    // Don't show if already in the app or if user has dismissed it
    const bannerDismissed = localStorage.getItem('app_banner_dismissed');
    setShowAppBanner(!isRunningInApp && bannerDismissed !== 'true');
  }, []);

  // Function to open app store
  const openAppStore = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Determine platform and open appropriate store
    if (userAgent.includes('android')) {
      window.open('https://play.google.com/store/apps/details?id=com.flightfinder.app', '_blank');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      window.open('https://apps.apple.com/app/flightfinder/id123456789', '_blank');
    } else {
      // Default to website app page
      window.open('/download-app', '_blank');
    }
  };

  // Function to dismiss app banner
  const dismissBanner = () => {
    setShowAppBanner(false);
    localStorage.setItem('app_banner_dismissed', 'true');
  };

  return {
    isAppInstalled,
    showAppBanner,
    appVersion,
    isNativeApp,
    openAppStore,
    dismissBanner
  };
}

export default useNativeIntegration;