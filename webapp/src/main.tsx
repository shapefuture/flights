import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/error-boundary.tsx'
import logger from './utils/logger.ts'

// Initialize error tracking
logger.initializeErrorTracking();

// Log initialization
logger.info('Application initializing...');

// Render the app with an error boundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary 
      onError={(error, info) => {
        logger.error('Root Error Boundary caught error:', error, info);
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)