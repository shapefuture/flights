import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';

// Your other imports

const App: React.FC = () => {
  // Fixed the String() call
  const appVersion = '1.0.0';
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="flight-finder-theme">
      <div className="app-container">
        {/* Your app content */}
        
        <Routes>
          {/* Your routes */}
        </Routes>
        
        <footer>
          <p>Version: {appVersion}</p>
        </footer>
      </div>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;