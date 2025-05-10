import { FlightSearch } from '../types';

/**
 * Saves a flight search to history for the user/session.
 */
export function saveSearchToHistory(search: FlightSearch): Promise<void> {
  // Stub implementation - you should connect to a backend or storage here.
  // For now, just resolve immediately.
  return Promise.resolve();
}