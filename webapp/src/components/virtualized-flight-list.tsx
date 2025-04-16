import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePreferences } from '../hooks/use-preferences';
import { FlightResult } from '../types';
import { TouchFlightCard } from './touch-controls';

interface VirtualizedFlightListProps {
  flights: FlightResult[];
  onSelect: (flight: FlightResult) => void;
  className?: string;
}

export function VirtualizedFlightList({ 
  flights, 
  onSelect,
  className 
}: VirtualizedFlightListProps) {
  const { preferences } = usePreferences();
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(0);
  
  // Update height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (parentRef.current) {
        setParentHeight(parentRef.current.offsetHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate item height based on compact view preference
  const estimateSize = useCallback(() => {
    return preferences.compactView ? 120 : 180;
  }, [preferences.compactView]);

  const rowVirtualizer = useVirtualizer({
    count: flights.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // number of items to render before/after the visible area
  });

  return (
    <div 
      ref={parentRef}
      className={`flight-list-container relative overflow-auto ${className}`}
      style={{ height: '100%', maxHeight: 'calc(100vh - 250px)' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const flight = flights[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="p-2 h-full">
                <TouchFlightCard 
                  flight={flight} 
                  onSelect={onSelect}
                  className={preferences.compactView ? 'compact-card' : ''}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {flights.length === 0 && (
        <div className="flex items-center justify-center h-full p-8 text-center text-gray-500">
          No flights found matching your search criteria.
        </div>
      )}
    </div>
  );
}