import React from 'react';

// Define the PriceInfo type to fix the type error
interface PriceInfo {
  amount: number;
  currency: string;
  formatted: string;
}

// Update DetailedFlightInfo interface to include notes
interface DetailedFlightInfo {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  price: PriceInfo;
  duration: string;
  stops: number;
  stopDetails?: {
    airport: string;
    duration: string;
  }[];
  notes?: string; // Add notes field
}

// Rest of your component logic...

export const DetailedFlightView: React.FC<{ flight: DetailedFlightInfo }> = ({ flight }) => {
  // Your component implementation
  
  return (
    <div className="detailed-flight-view">
      {/* Use type checking to safely display the price */}
      <div className="price-display">
        {typeof flight.price === 'string' 
          ? flight.price 
          : flight.price?.formatted || 'Price unavailable'}
      </div>
      
      {/* Safely access the notes field */}
      {flight.notes && (
        <div className="flight-notes">
          <h4>Notes</h4>
          <p>{flight.notes}</p>
        </div>
      )}
      
      {/* Rest of your JSX */}
    </div>
  );
};

export default DetailedFlightView;