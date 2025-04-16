import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch errors in the component tree
 * and display a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state to include the error info
    this.setState({
      errorInfo
    });
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <Card className="my-4 mx-auto max-w-md">
          <CardHeader className="bg-red-50 text-red-700 py-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </CardHeader>
          <CardContent className="py-4">
            <div className="text-sm">
              <p className="mb-2">
                An error occurred in the application. Please try again or contact support if the problem persists.
              </p>
              
              {this.state.error && (
                <div className="mt-4 p-3 bg-gray-100 rounded overflow-auto text-xs">
                  <strong>Error:</strong> {this.state.error.toString()}
                </div>
              )}
              
              {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Stack Trace</summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 py-3 flex justify-end">
            <Button onClick={this.handleReset}>Try Again</Button>
          </CardFooter>
        </Card>
      );
    }

    // Render children if there's no error
    return this.props.children;
  }
}