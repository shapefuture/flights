import { debug, info, error as logError } from '../utils/logger';
import { getUserPreferences } from './preferenceService';
import { FlightQuery } from '../types';

interface PriceAlert {
  id: string;
  query: FlightQuery;
  basePrice: number;
  threshold: number;
  createdAt: number;
  lastChecked: number;
  email?: string;
  notificationsEnabled: boolean;
}

const STORAGE_KEY = 'flight-finder-price-alerts';
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Service to manage price alerts for flight queries
 */
export class PriceAlertService {
  private alerts: PriceAlert[] = [];
  private checkIntervalId: number | null = null;
  
  constructor() {
    this.loadAlerts();
    this.startPeriodicCheck();
  }
  
  /**
   * Create a new price alert
   */
  createAlert(query: FlightQuery, basePrice: number, email?: string): string {
    try {
      // Generate a unique ID
      const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Get price threshold from user preferences
      const { priceAlertThreshold } = getUserPreferences();
      
      // Create the alert object
      const alert: PriceAlert = {
        id,
        query,
        basePrice,
        threshold: priceAlertThreshold,
        createdAt: Date.now(),
        lastChecked: Date.now(),
        email,
        notificationsEnabled: !!email
      };
      
      // Add to alerts array
      this.alerts.push(alert);
      
      // Save to storage
      this.saveAlerts();
      
      info(`Created price alert ${id} for ${query.origin} to ${query.dest}`);
      return id;
    } catch (err) {
      logError('Error creating price alert:', err);
      throw new Error('Failed to create price alert');
    }
  }
  
  /**
   * Get all price alerts
   */
  getAlerts(): PriceAlert[] {
    return [...this.alerts];
  }
  
  /**
   * Delete a price alert by ID
   */
  deleteAlert(id: string): boolean {
    try {
      const initialLength = this.alerts.length;
      this.alerts = this.alerts.filter(alert => alert.id !== id);
      
      if (this.alerts.length < initialLength) {
        this.saveAlerts();
        info(`Deleted price alert ${id}`);
        return true;
      }
      
      return false;
    } catch (err) {
      logError('Error deleting price alert:', err);
      return false;
    }
  }
  
  /**
   * Update a price alert's properties
   */
  updateAlert(id: string, properties: Partial<PriceAlert>): boolean {
    try {
      const alertIndex = this.alerts.findIndex(alert => alert.id === id);
      if (alertIndex === -1) return false;
      
      // Update the alert
      this.alerts[alertIndex] = {
        ...this.alerts[alertIndex],
        ...properties
      };
      
      // Save to storage
      this.saveAlerts();
      
      info(`Updated price alert ${id}`);
      return true;
    } catch (err) {
      logError('Error updating price alert:', err);
      return false;
    }
  }
  
  /**
   * Check all alerts for price drops
   */
  async checkAlerts(): Promise<Array<{ id: string; oldPrice: number; newPrice: number; percentDrop: number }>> {
    const results: Array<{ id: string; oldPrice: number; newPrice: number; percentDrop: number }> = [];
    
    info(`Checking ${this.alerts.length} price alerts`);
    
    // For each alert
    for (const alert of this.alerts) {
      try {
        // Skip if checked recently
        if (Date.now() - alert.lastChecked < CHECK_INTERVAL) {
          debug(`Skipping recent check for alert ${alert.id}`);
          continue;
        }
        
        // Update last checked timestamp
        this.updateAlert(alert.id, { lastChecked: Date.now() });
        
        // Mock the price check for now
        // In a real implementation, this would call the flight search API
        const mockPrice = this.mockPriceCheck(alert.basePrice);
        
        // Calculate price drop percentage
        const percentDrop = ((alert.basePrice - mockPrice) / alert.basePrice) * 100;
        
        // If price dropped enough
        if (percentDrop >= alert.threshold) {
          info(`Price drop detected for alert ${alert.id}: ${alert.basePrice} -> ${mockPrice} (${percentDrop.toFixed(1)}%)`);
          
          // Add to results
          results.push({
            id: alert.id,
            oldPrice: alert.basePrice,
            newPrice: mockPrice,
            percentDrop
          });
          
          // Send notification if enabled
          if (alert.notificationsEnabled && alert.email) {
            this.sendNotification(alert, mockPrice, percentDrop);
          }
          
          // Update the base price
          this.updateAlert(alert.id, { basePrice: mockPrice });
        }
      } catch (err) {
        logError(`Error checking alert ${alert.id}:`, err);
      }
    }
    
    return results;
  }
  
  /**
   * Start periodic checking of alerts
   */
  startPeriodicCheck(): void {
    if (this.checkIntervalId !== null) return;
    
    // Check alerts every 6 hours
    this.checkIntervalId = window.setInterval(() => {
      this.checkAlerts();
    }, CHECK_INTERVAL);
    
    debug('Started periodic price alert checking');
  }
  
  /**
   * Stop periodic checking of alerts
   */
  stopPeriodicCheck(): void {
    if (this.checkIntervalId === null) return;
    
    window.clearInterval(this.checkIntervalId);
    this.checkIntervalId = null;
    
    debug('Stopped periodic price alert checking');
  }
  
  /**
   * Load alerts from localStorage
   */
  private loadAlerts(): void {
    try {
      const storedAlerts = localStorage.getItem(STORAGE_KEY);
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
        info(`Loaded ${this.alerts.length} price alerts from storage`);
      }
    } catch (err) {
      logError('Error loading price alerts:', err);
      this.alerts = [];
    }
  }
  
  /**
   * Save alerts to localStorage
   */
  private saveAlerts(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
      debug(`Saved ${this.alerts.length} price alerts to storage`);
    } catch (err) {
      logError('Error saving price alerts:', err);
    }
  }
  
  /**
   * Mock a price check
   * In a real implementation, this would call the flight search API
   */
  private mockPriceCheck(basePrice: number): number {
    // Randomly fluctuate price by +/- 20%
    const fluctuation = (Math.random() * 0.4) - 0.2;
    const newPrice = Math.round(basePrice * (1 + fluctuation));
    return Math.max(newPrice, Math.round(basePrice * 0.7)); // Ensure at least 30% below base price is possible
  }
  
  /**
   * Send a notification about a price drop
   * In a real implementation, this would send an email or push notification
   */
  private sendNotification(alert: PriceAlert, newPrice: number, percentDrop: number): void {
    info(`[NOTIFICATION] Price Alert for ${alert.query.origin} to ${alert.query.dest}: Price dropped ${percentDrop.toFixed(1)}% from ${alert.basePrice} to ${newPrice}`);
    
    // In a real implementation, this would integrate with an email service
    // or push notification system
    if (alert.email) {
      debug(`Would send email to ${alert.email}`);
    }
    
    // Show a browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Flight Price Alert', {
        body: `Price for ${alert.query.origin} to ${alert.query.dest} dropped ${percentDrop.toFixed(1)}% to ${newPrice}!`,
        icon: '/favicon.ico'
      });
    }
  }
}

// Export a singleton instance
export const priceAlertService = new PriceAlertService();