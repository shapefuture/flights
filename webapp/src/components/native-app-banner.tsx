import React from 'react';
import { Button } from './ui/button';

export const NativeAppBanner = () => {
  // Your component implementation
  
  const openAppStore = () => window.open('https://apps.apple.com/app/yourapp', '_blank');
  const dismissBanner = () => {
    // Your dismiss logic
  };
  
  return (
    <div className="native-app-banner">
      <p>Get our mobile app for a better experience!</p>
      
      {/* Update Button component usage */}
      <Button 
        variant="default" 
        className="download-button" 
        onClick={openAppStore}
      >
        <span>Download App</span>
        <span>📱</span>
      </Button>
      
      <Button 
        variant="ghost" 
        className="dismiss-button" 
        onClick={dismissBanner}
      >
        <span>×</span>
      </Button>
    </div>
  );
};

export default NativeAppBanner;