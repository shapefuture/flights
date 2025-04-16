import React from 'react';
import { useTouchGesture } from '../hooks/use-touch-gesture';
import { cn } from '../lib/utils';

interface TouchControlsProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TouchControls({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  className,
}: TouchControlsProps) {
  const touchHandlers = useTouchGesture({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold: 50, // minimum distance for a swipe
  });

  return (
    <div className={cn('touch-container', className)} {...touchHandlers}>
      {children}
    </div>
  );
}

// Specialized touch-optimized flight card component
export function TouchFlightCard({ flight, onSelect, className }) {
  return (
    <TouchControls 
      onSwipeLeft={() => onSelect(flight)} 
      onSwipeRight={() => {/* dismiss */}}
      className={cn('flight-card-touch rounded-lg p-4 shadow-md', className)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">{flight.airline}</h3>
          <span className="text-xl font-bold text-blue-600">{flight.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-semibold">{flight.departure}</p>
            <p>{flight.origin}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-500">{flight.duration}</p>
            <div className="w-24 h-px bg-gray-300 my-1"></div>
            <p className="text-xs text-gray-500">{flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</p>
          </div>
          <div>
            <p className="font-semibold">{flight.arrival}</p>
            <p>{flight.destination}</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">Swipe left to select • Swipe right to dismiss</p>
      </div>
    </TouchControls>
  );
}