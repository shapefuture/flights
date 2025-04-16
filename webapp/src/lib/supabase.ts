import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env?.VITE_SUPABASE_URL || 'https://example.supabase.co',
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
);