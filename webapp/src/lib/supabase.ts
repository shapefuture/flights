import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Default export for backward compatibility
const supabaseClient = {
  client: supabase,
  incrementQueriesUsed
};

export default supabaseClient;