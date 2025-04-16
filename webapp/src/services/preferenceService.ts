import { debug } from '../utils/logger';

export interface UserPreferences {
  // Display preferences
  showPriceInTimeline: boolean;
  defaultView: 'list' | 'calendar';
  showAirlineLogos: boolean;
  compactView: boolean;
  resultsPerPage: number;
  sortOrder: 'price' | 'duration' | 'departureTime' | 'arrivalTime';
  
  // Filter defaults
  defaultMaxStops: number;
  defaultCabinClass: 'economy' | 'premium' | 'business' | 'first';
  preferredAirlines: string[];
  avoidConnections: string[]; // airports to avoid for connections
  
  // Time preferences
  preferredDepartureTimeRange: [number, number]; // 24h format, e.g. [8, 12] for 8am-12pm
  preferredArrivalTimeRange: [number, number];
  minimumConnectionTime: number; // in minutes
  
  // Notifications
  enablePriceAlerts: boolean;
  priceAlertThreshold: number; // percentage drop to trigger alert
  
  // Accessibility
  largeFontSize: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showPriceInTimeline: true,
  defaultView: 'list',
  showAirlineLogos: true,
  compactView: false,
  resultsPerPage: 20,
  sortOrder: 'price',
  
  defaultMaxStops: 1,
  defaultCabinClass: 'economy',
  preferredAirlines: [],
  avoidConnections: [],
  
  preferredDepartureTimeRange: [7, 22], // 7am to 10pm
  preferredArrivalTimeRange: [7, 23],
  minimumConnectionTime: 90,
  
  enablePriceAlerts: false,
  priceAlertThreshold: 15,
  
  largeFontSize: false,
  highContrast: false,
  reducedMotion: false,
};

const STORAGE_KEY = 'flight-finder-preferences';

export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs));
    debug('Saved user preferences', updatedPrefs);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

export function getUserPreferences(): UserPreferences {
  try {
    const storedPrefs = localStorage.getItem(STORAGE_KEY);
    if (!storedPrefs) {
      return DEFAULT_PREFERENCES;
    }
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) };
  } catch (error) {
    console.error('Failed to retrieve user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export function resetUserPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    debug('Reset user preferences to defaults');
  } catch (error) {
    console.error('Failed to reset user preferences:', error);
  }
}

// Apply preferences that affect the CSS/layout
export function applyPreferencesToUI(preferences: UserPreferences): void {
  const root = document.documentElement;
  
  // Apply accessibility preferences
  if (preferences.largeFontSize) {
    root.style.fontSize = '18px'; // Increase from default 16px
  } else {
    root.style.fontSize = '';
  }
  
  if (preferences.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  if (preferences.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
}