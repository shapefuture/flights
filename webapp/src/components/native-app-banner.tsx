import React, { useState, useEffect } from 'react';
import { X, Download, ChevronRight, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { useNativeIntegration } from '../hooks/use-native-integration';

interface NativeAppBannerProps {
  className?: string;
}

export function NativeAppBanner({ className }: NativeAppBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { isInNativeApp } = useNativeIntegration();
  
  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  useEffect(() => {
    // Don't show banner if already in native app or not on mobile
    if (isInNativeApp || !isMobile) {
      setShowBanner(false);
      return;
    }
    
    // Check if the banner was previously dismissed
    const bannerDismissed = localStorage.getItem('app-banner-dismissed');
    const dismissedTimestamp = bannerDismissed ? parseInt(bannerDismissed, 10) : 0;
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Show banner if not dismissed or if dismissed more than a day ago
    setShowBanner(!bannerDismissed || dismissedTimestamp < oneDayAgo);
  }, [isInNativeApp, isMobile]);
  
  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    
    // Save dismissal time
    localStorage.setItem('app-banner-dismissed', Date.now().toString());
  };
  
  // Determine app store URL based on device
  const getAppStoreUrl = () => {
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // These would be replaced with your actual app store URLs
    if (isIos) {
      return 'https://apps.apple.com/app/flight-finder/id1234567890';
    } else {
      return 'https://play.google.com/store/apps/details?id=com.flightfinder.app';
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-3 shadow-lg z-50 ${dismissed ? 'animate-slide-down' : 'animate-slide-up'} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="font-medium text-sm">Get the Flight Finder App</h3>
            <p className="text-xs text-muted-foreground">Better experience, offline access & more!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="default"
            className="px-3 text-xs"
            onClick={() => window.open(getAppStoreUrl(), '_blank')}
          >
            <Download className="h-3 w-3 mr-1" /> 
            Get App
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="p-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}