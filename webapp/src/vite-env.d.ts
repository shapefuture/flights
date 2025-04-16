/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EXTENSION_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}