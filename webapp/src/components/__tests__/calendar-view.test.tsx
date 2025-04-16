import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../calendar-view';
import { format, addMonths } from 'date-fns';

const mockResults = [
  {
    price: '$300',
    duration: '3h 30m',
    stops: 0,
    airline: 'Delta',
    departure: '09:00',
    arrival: '12:30',
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2023-05-15',
    returnDate: '2023-05-22'
  },
  {
    price: '$450',
    duration: '5h 45m',
    stops: 1,
    airline: 'American Airlines',
    departure: '14:00',
    arrival: '19:45',
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2023-05-16',
    returnDate: '2023-05-23'
  },
  {
    price: '$250',
    duration: '6h 15m',
    stops: 2,
    airline: 'United',
    departure: '07:30',
    arrival: '13:45',
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2023-05-15', // Same date as first result
    returnDate: '2023-05-22'
  }
];

describe('CalendarView', () => {
  beforeEach(() => {
    // Mock date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-05-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render current and next month calendars', () => {
    render(<CalendarView results={mockResults} />);
    
    // Check that both months are displayed
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const nextMonth = format(addMonths(new Date(), 1), 'MMMM yyyy');
    
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    expect(screen.getByText(nextMonth)).toBeInTheDocument();
  });

  it('should show flight prices on days with results', () => {
    render(<CalendarView results={mockResults} />);
    
    // Look for the price displayed on calendar days
    // Note: This assumes the price is displayed directly.
    // You might need to adjust this test based on how your calendar displays prices.
    expect(screen.getByText('$250')).toBeInTheDocument();
  });

  it('should navigate to previous months when Previous button is clicked', () => {
    render(<CalendarView results={mockResults} />);
    
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const nextMonth = format(addMonths(new Date(), 1), 'MMMM yyyy');
    const previousMonth = format(addMonths(new Date(), -1), 'MMMM yyyy');
    
    // Check initial state
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    expect(screen.getByText(nextMonth)).toBeInTheDocument();
    
    // Click Previous button
    fireEvent.click(screen.getByText('Previous'));
    
    // Check that display shifted back one month
    expect(screen.getByText(previousMonth)).toBeInTheDocument();
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    expect(screen.queryByText(nextMonth)).not.toBeInTheDocument();
  });

  it('should navigate to next months when Next button is clicked', () => {
    render(<CalendarView results={mockResults} />);
    
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const nextMonth = format(addMonths(new Date(), 1), 'MMMM yyyy');
    const twoMonthsAhead = format(addMonths(new Date(), 2), 'MMMM yyyy');
    
    // Check initial state
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    expect(screen.getByText(nextMonth)).toBeInTheDocument();
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Check that display shifted forward one month
    expect(screen.queryByText(currentMonth)).not.toBeInTheDocument();
    expect(screen.getByText(nextMonth)).toBeInTheDocument();
    expect(screen.getByText(twoMonthsAhead)).toBeInTheDocument();
  });

  it('should handle errors gracefully', () => {
    // Force an error by providing invalid data
    console.error = jest.fn(); // Suppress error output
    
    render(<CalendarView results={[{ departureDate: 'invalid-date' }] as any} />);
    
    // Component should render without crashing
    expect(screen.getByText(/Click on a date with pricing/i)).toBeInTheDocument();
  });

  it('should display number of flights on days with multiple results', () => {
    render(<CalendarView results={mockResults} />);
    
    // There are 2 flights on 2023-05-15
    // Find elements that might contain the flight count information
    const countElements = screen.getAllByText('2 flights');
    expect(countElements.length).toBeGreaterThan(0);
  });

  it('should show instructional text at the bottom', () => {
    render(<CalendarView results={mockResults} />);
    
    expect(screen.getByText(/Click on a date with pricing to see detailed flight options/i)).toBeInTheDocument();
  });
});