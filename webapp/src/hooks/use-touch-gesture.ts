import { useState, useEffect } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useTouchGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: TouchGestureOptions) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Reset values when component unmounts
  useEffect(() => {
    return () => {
      setTouchStart(null);
      setTouchEnd(null);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touchDown = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setTouchStart(touchDown);
    setTouchEnd(null); // Reset end on new touch
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setTouchEnd(touchPos);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    // Check if the user made a significant swipe
    if (isHorizontalSwipe) {
      if (distanceX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > threshold && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -threshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}