import { createClient } from '@supabase/supabase-js';
import { debug, error as logError, info } from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logError('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  throw new Error('Missing Supabase credentials. See console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

// User subscription status
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export type UserSubscription = {
  tier: SubscriptionTier;
  monthlyQuota: number;
  queriesUsed: number;
  validUntil: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

// Authentication providers
export enum AuthProvider {
  GOOGLE = 'google',
  EMAIL = 'email'
}

// Authentication errors
export class AuthError extends Error {
  code?: string;
  statusCode?: number;
  
  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Network error
export class NetworkError extends Error {
  constructor(message: string) {
    super(message || 'Network connection error. Please check your internet connection.');
    this.name = 'NetworkError';
  }
}

// Default error handler for auth operations
function handleAuthError(operation: string, err: any): Error {
  // If it's a Supabase error, it will have an error property
  if (err.error) {
    const authError = new AuthError(
      err.error.message || `${operation} failed`,
      err.error.code,
      err.status
    );
    logError(`${operation} error:`, authError);
    return authError;
  }
  
  // If it's a network error
  if (err.message && err.message.includes('fetch')) {
    const networkError = new NetworkError(err.message);
    logError(`${operation} network error:`, networkError);
    return networkError;
  }
  
  // For other errors
  logError(`${operation} unknown error:`, err);
  return err instanceof Error ? err : new Error(`Unknown error during ${operation}`);
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    debug('Initiating Google sign-in');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      logError('Google sign-in error:', error);
      return { data: null, error };
    }

    info('Google authentication initiated, redirecting user');
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleAuthError('Google sign-in', err) };
  }
}

// Get user profile from Supabase
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    debug('Fetching user profile', { userId });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logError('Error fetching user profile:', error, { userId });
      return null;
    }

    debug('User profile fetched successfully');
    return data;
  } catch (err) {
    logError('Exception fetching user profile:', err, { userId });
    return null;
  }
}

// Get user subscription status
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    debug('Fetching user subscription', { userId });
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      logError('Error fetching user subscription:', error, { userId });
      
      // Check if error is "not found" - this is not a critical error,
      // just means user doesn't have a subscription yet
      if (error.code === 'PGRST116') {
        info('User has no subscription record, will use default free tier', { userId });
        // Return default free subscription
        return {
          tier: 'free',
          monthlyQuota: 5,
          queriesUsed: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        };
      }
      
      return null;
    }

    debug('User subscription fetched successfully');
    return data;
  } catch (err) {
    logError('Exception fetching user subscription:', err, { userId });
    return null;
  }
}

// Update queries used count
export async function incrementQueriesUsed(userId: string): Promise<boolean> {
  try {
    debug('Incrementing queries used count', { userId });
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        queries_used: supabase.rpc('increment_queries', { amount: 1 })
      })
      .eq('user_id', userId);

    if (error) {
      logError('Error incrementing queries used:', error, { userId });
      return false;
    }

    debug('Queries used count incremented successfully');
    return true;
  } catch (err) {
    logError('Exception incrementing queries used:', err, { userId });
    return false;
  }
}

// Test authentication status
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      logError('Error checking auth status:', error);
      return false;
    }
    
    return !!data.session;
  } catch (err) {
    logError('Exception checking auth status:', err);
    return false;
  }
}