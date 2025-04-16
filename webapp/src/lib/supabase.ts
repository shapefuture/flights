import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
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

// Get user profile from Supabase
export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Get user subscription status
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data;
}

// Update queries used count
export async function incrementQueriesUsed(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      queries_used: supabase.rpc('increment_queries', { amount: 1 })
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error incrementing queries used:', error);
    return false;
  }

  return true;
}