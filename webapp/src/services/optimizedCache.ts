import { debug, error } from '../utils/logger';

interface CacheOptions {
  maxSize?: number;      // Maximum number of items to store
  ttl?: number;          // Time to live in milliseconds
  storagePrefix?: string // Prefix for localStorage keys
}

/**
 * An optimized caching service with LRU eviction, TTL, and persistence
 */
export class OptimizedCache<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly storagePrefix: string;
  
  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 4 * 60 * 60 * 1000; // 4 hours default
    this.storagePrefix = options.storagePrefix || 'flight-finder-cache-';
    
    // Load from localStorage on initialization
    this.loadFromStorage();
    
    // Cleanup on initialization
    this.cleanup();
  }
  
  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    try {
      // If cache is at max size, remove the oldest item
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
        this.removeFromStorage(oldestKey);
      }
      
      // Add new item
      const timestamp = Date.now();
      this.cache.set(key, { value, timestamp });
      
      // Save to localStorage
      this.saveToStorage(key, { value, timestamp });
      
      debug(`Cache: Set "${key}"`);
    } catch (err) {
      error(`Cache error setting "${key}":`, err);
    }
  }
  
  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    try {
      const item = this.cache.get(key);
      
      // Return undefined if not found
      if (!item) {
        return undefined;
      }
      
      // Check if expired
      if (Date.now() - item.timestamp > this.ttl) {
        this.delete(key);
        return undefined;
      }
      
      // Update position in the Map to make it "recently used"
      this.cache.delete(key);
      this.cache.set(key, item);
      
      debug(`Cache: Hit "${key}"`);
      return item.value;
    } catch (err) {
      error(`Cache error getting "${key}":`, err);
      return undefined;
    }
  }
  
  /**
   * Delete a value from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromStorage(key);
    debug(`Cache: Deleted "${key}"`);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    this.clearAllFromStorage();
    debug('Cache: Cleared all items');
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get all valid (non-expired) keys
   */
  keys(): string[] {
    const validKeys: string[] = [];
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() - item.timestamp <= this.ttl) {
        validKeys.push(key);
      }
    }
    return validKeys;
  }
  
  /**
   * Get the size of the cache (only counting non-expired items)
   */
  size(): number {
    return this.keys().length;
  }
  
  /**
   * Remove expired items from the cache
   */
  cleanup(): void {
    try {
      const now = Date.now();
      
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > this.ttl) {
          this.cache.delete(key);
          this.removeFromStorage(key);
        }
      }
      
      debug(`Cache: Cleaned up expired items. Current size: ${this.cache.size}`);
    } catch (err) {
      error('Cache cleanup error:', err);
    }
  }
  
  // Private methods for localStorage persistence
  
  private saveToStorage(key: string, data: { value: T; timestamp: number }): void {
    try {
      localStorage.setItem(
        this.storagePrefix + key,
        JSON.stringify(data)
      );
    } catch (err) {
      error(`Error saving to localStorage: ${key}`, err);
      // If localStorage fails (e.g., quota exceeded), just continue with in-memory cache
    }
  }
  
  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (err) {
      error(`Error removing from localStorage: ${key}`, err);
    }
  }
  
  private clearAllFromStorage(): void {
    try {
      // Only remove items with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      error('Error clearing localStorage cache', err);
    }
  }
  
  private loadFromStorage(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const data = JSON.parse(rawData);
            const cacheKey = key.substring(this.storagePrefix.length);
            this.cache.set(cacheKey, data);
          }
        }
      }
      debug(`Cache: Loaded ${this.cache.size} items from localStorage`);
    } catch (err) {
      error('Error loading cache from localStorage', err);
    }
  }
}

// Create and export instances for different cache types
export const flightResultsCache = new OptimizedCache<any>({
  maxSize: 50,
  ttl: 4 * 60 * 60 * 1000, // 4 hours
  storagePrefix: 'flight-finder-results-'
});

export const queryCache = new OptimizedCache<any>({
  maxSize: 100,
  ttl: 1 * 60 * 60 * 1000, // 1 hour
  storagePrefix: 'flight-finder-queries-'
});

export const airportDataCache = new OptimizedCache<any>({
  maxSize: 500,
  ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
  storagePrefix: 'flight-finder-airports-'
});