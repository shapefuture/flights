import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { vi } from 'vitest';
import * as apiService from '../services/apiService';
import * as extensionService from '../services/extensionService';

// Mock the API service
vi.mock('../services/apiService', () => ({
  callAgentApi: vi.fn(),
  checkApiHealth: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock the extension service
vi.mock('../services/extensionService', () => ({
  checkExtensionStatus: vi.fn(),
  sendMessageToExtension: vi.fn(),
  listenForExtensionMessages: vi.fn().mockReturnValue(() => {}),
  isExtensionInstalled: vi.fn().mockReturnValue(true)
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
    });
    
    // Default mock responses
    vi.mocked(extensionService.checkExtensionStatus).mockResolvedValue({
      installed: true,
      active: true,
      version: '1.0.0'
    });
    
    vi.mocked(apiService.callAgentApi).mockResolvedValue({
      thinking: 'Test thinking',
      plan: {
        steps: [
          {
            action: 'generate_search_queries',
            parameters: {
              origins: ['JFK'],
              destinations: ['LAX'],
              departureDateRange: '2023-06-01',
              returnDateRange: '2023-06-08'
            }
          }
        ]
      }
    });
  });

  it('should render the search form', () => {
    render(<App />);
    
    expect(screen.getByText('Flight Finder Agent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Find me a flight/i)).toBeInTheDocument();
    expect(screen.getByText('Search Flights')).toBeInTheDocument();
  });

  it('should check extension status on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(extensionService.checkExtensionStatus).toHaveBeenCalled();
    });
  });

  it('should submit a search query and display results', async () => {
    render(<App />);
    
    // Enter a query
    const inputElement = screen.getByPlaceholderText(/Find me a flight/i);
    fireEvent.change(inputElement, { target: { value: 'Flight from NYC to LA' } });
    
    // Submit the form
    const submitButton = screen.getByText('Search Flights');
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText('Searching')).toBeInTheDocument();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(apiService.callAgentApi).toHaveBeenCalledWith('Flight from NYC to LA');
    });
    
    // Check results display
    await waitFor(() => {
      expect(screen.getByText('Agent Status')).toBeInTheDocument();
      expect(screen.getByText('Test thinking')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(apiService.callAgentApi).mockResolvedValue({
      error: 'Test error message'
    });
    
    render(<App />);
    
    // Enter a query
    const inputElement = screen.getByPlaceholderText(/Find me a flight/i);
    fireEvent.change(inputElement, { target: { value: 'Flight from NYC to LA' } });
    
    // Submit the form
    const submitButton = screen.getByText('Search Flights');
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('should save a search to localStorage', async () => {
    render(<App />);
    
    // Enter a query
    const inputElement = screen.getByPlaceholderText(/Find me a flight/i);
    fireEvent.change(inputElement, { target: { value: 'Flight from NYC to LA' } });
    
    // Submit the form
    const submitButton = screen.getByText('Search Flights');
    fireEvent.click(submitButton);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(apiService.callAgentApi).toHaveBeenCalled();
    });
    
    // Mock some results
    // This part is tricky because the App component uses internal state
    // We'll mock the listenForExtensionMessages callback to simulate results
    let savedCallback: Function;
    vi.mocked(extensionService.listenForExtensionMessages).mockImplementation((callback) => {
      savedCallback = callback;
      return () => {};
    });
    
    // Wait for the component to set up the listener
    await waitFor(() => {
      expect(extensionService.listenForExtensionMessages).toHaveBeenCalled();
    });
    
    // Simulate a message from the extension with flight results
    savedCallback({
      type: 'FETCH_RESULT',
      payload: {
        query: { origin: 'JFK', dest: 'LAX' },
        results: [
          {
            price: '$300',
            duration: '3h',
            stops: 0,
            airline: 'Delta',
            departure: '09:00',
            arrival: '12:00',
            origin: 'JFK',
            destination: 'LAX',
            departureDate: '2023-06-01',
            returnDate: '2023-06-08'
          }
        ]
      }
    });
    
    // Wait for the results to be processed
    await waitFor(() => {
      // Now look for the Save button
      const saveButton = screen.getByText('Save This Search');
      fireEvent.click(saveButton);
      
      // Check localStorage was called
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.any(String)
      );
    });
  });

  it('should apply filters to flight results', async () => {
    render(<App />);
    
    // Setup same as previous test
    const inputElement = screen.getByPlaceholderText(/Find me a flight/i);
    fireEvent.change(inputElement, { target: { value: 'Flight from NYC to LA' } });
    const submitButton = screen.getByText('Search Flights');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiService.callAgentApi).toHaveBeenCalled();
    });
    
    // Mock flight results
    let savedCallback: Function;
    vi.mocked(extensionService.listenForExtensionMessages).mockImplementation((callback) => {
      savedCallback = callback;
      return () => {};
    });
    
    await waitFor(() => {
      expect(extensionService.listenForExtensionMessages).toHaveBeenCalled();
    });
    
    // Send multiple flight results
    savedCallback({
      type: 'FETCH_RESULT',
      payload: {
        query: { origin: 'JFK', dest: 'LAX' },
        results: [
          {
            price: '$300',
            duration: '3h',
            stops: 0,
            airline: 'Delta',
            departure: '09:00',
            arrival: '12:00',
            origin: 'JFK',
            destination: 'LAX',
            departureDate: '2023-06-01',
            returnDate: '2023-06-08'
          },
          {
            price: '$500',
            duration: '5h',
            stops: 2,
            airline: 'United',
            departure: '10:00',
            arrival: '15:00',
            origin: 'JFK',
            destination: 'LAX',
            departureDate: '2023-06-01',
            returnDate: '2023-06-08'
          }
        ]
      }
    });
    
    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Flight Results')).toBeInTheDocument();
    });
    
    // Find and open the filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // Find the nonstop filter and apply it
    await waitFor(() => {
      const nonstopCheckbox = screen.getByLabelText('Nonstop');
      fireEvent.click(nonstopCheckbox);
    });
    
    // Check that only the nonstop flight is displayed
    await waitFor(() => {
      expect(screen.getByText('$300')).toBeInTheDocument();
      expect(screen.queryByText('$500')).not.toBeInTheDocument();
    });
  });
});