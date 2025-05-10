import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env?.VITE_SUPABASE_URL || 'https://example.supabase.co',
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

// Define AuthError for test mocking
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Add provider enum for auth providers
export const AuthProvider = {
  GOOGLE: 'google',
  EMAIL: 'email'
};

// Named export for incrementQueriesUsed function
export const incrementQueriesUsed = async (userId: string): Promise<void> => {
  if (!userId) return;
  
  try {
    const { error } = await supabase.rpc('increment_queries_used', { user_id: userId });
    if (error) {
      console.error('Error incrementing queries used:', error);
    }
  } catch (err) {
    console.error('Failed to increment queries used:', err);
  }
};

// Get user subscription details
export interface UserSubscription {
  tier: 'free' | 'premium' | 'pro';
  queriesUsed: number;
  queriesLimit: number;
  monthlyQuota: number;
  validUntil: string;
}

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  if (!userId) return null;
  
  try {
    // This would be replaced with a real API call to get subscription details
    return {
      tier: 'free',
      queriesUsed: 10,
      queriesLimit: 50,
      monthlyQuota: 50,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    };
  } catch (err) {
    console.error('Failed to get user subscription:', err);
    return null;
  }
};

// Sign in with Google 
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error signing in with Google:', err);
    return { data: null, error: err };
  }
};

// Default export
export default supabase;