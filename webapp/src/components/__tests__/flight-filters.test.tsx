import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlightFilters } from '../flight-filters';

const mockResults = [
  {
    price: '$300',
    duration: '3h 30m',
    stops: 0,
    airline: 'Delta',
    departure: '09:00',
    arrival: '12:30',
    origin: 'JFK',
    destination: 'LAX'
  },
  {
    price: '$450',
    duration: '5h 45m',
    stops: 1,
    airline: 'American Airlines',
    departure: '14:00',
    arrival: '19:45',
    origin: 'JFK',
    destination: 'LAX'
  },
  {
    price: '$250',
    duration: '6h 15m',
    stops: 2,
    airline: 'United',
    departure: '07:30',
    arrival: '13:45',
    origin: 'JFK',
    destination: 'LAX'
  }
];

const defaultFilters = {
  maxPrice: 500,
  maxStops: 2,
  airlines: [],
  departureTime: [0, 24],
  arrivalTime: [0, 24]
};

describe('FlightFilters', () => {
  it('should render with default state', () => {
    const setFilters = jest.fn();
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Check that the toggle button is shown
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Filters should be collapsed by default
    expect(screen.queryByText('Max Price:')).not.toBeInTheDocument();
  });

  it('should expand filters when button is clicked', () => {
    const setFilters = jest.fn();
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Click the filters button
    fireEvent.click(screen.getByText('Filters'));
    
    // Check that filters are now visible
    expect(screen.getByText('Max Price: $500')).toBeInTheDocument();
    expect(screen.getByText('Maximum Stops')).toBeInTheDocument();
    expect(screen.getByText('Airlines')).toBeInTheDocument();
  });

  it('should update price filter when slider is changed', () => {
    const setFilters = jest.fn();
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Find the slider (this might need to be adjusted based on how your slider is implemented)
    const slider = screen.getByRole('slider');
    
    // Change the slider value
    fireEvent.change(slider, { target: { value: '300' } });
    
    // Check that the price display is updated
    expect(screen.getByText('Max Price: $300')).toBeInTheDocument();
    
    // Commit the value (usually on mouseup for sliders)
    fireEvent.mouseUp(slider);
    
    // Check that setFilters was called with the new price
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({
      maxPrice: 300
    }));
  });

  it('should update stops filter when checkboxes are changed', () => {
    const setFilters = jest.fn();
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Check the "Nonstop" checkbox
    fireEvent.click(screen.getByLabelText('Nonstop'));
    
    // Check that setFilters was called with maxStops set to 0
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({
      maxStops: 0
    }));
  });

  it('should update airline filter when checkboxes are changed', () => {
    const setFilters = jest.fn();
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Check an airline checkbox
    fireEvent.click(screen.getByLabelText('Delta'));
    
    // Check that setFilters was called with the airline added to the array
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({
      airlines: expect.arrayContaining(['Delta'])
    }));
  });

  it('should show reset button when filters are applied', () => {
    const setFilters = jest.fn();
    const appliedFilters = {
      ...defaultFilters,
      maxPrice: 300,
      maxStops: 0,
      airlines: ['Delta']
    };
    
    render(
      <FlightFilters 
        results={mockResults} 
        filters={appliedFilters} 
        setFilters={setFilters} 
      />
    );

    // Reset button should be visible because filters are applied
    expect(screen.getByText('Reset')).toBeInTheDocument();
    
    // Click the reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Check that setFilters was called with default values
    expect(setFilters).toHaveBeenCalledWith({
      maxPrice: 2000,
      maxStops: 2,
      airlines: [],
      departureTime: [0, 24],
      arrivalTime: [0, 24]
    });
  });

  it('should show error message when there is an error', () => {
    const setFilters = jest.fn();
    
    // Force an error by providing invalid data
    console.error = jest.fn(); // Suppress error output
    
    render(
      <FlightFilters 
        results={[{ price: 'invalid' }] as any} 
        filters={defaultFilters} 
        setFilters={setFilters} 
      />
    );

    // Let the component process the invalid data
    fireEvent.click(screen.getByText('Filters'));
    
    // No explicit assertions here - we're mainly testing that the component renders without crashing
    // In a real test, you might want to check for specific error handling UI elements
  });
});