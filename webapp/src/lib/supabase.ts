import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)