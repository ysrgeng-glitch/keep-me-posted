/**
 * Supabase client singleton
 * Reads credentials from Vite env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * Falls back gracefully so mock data still works when Supabase isn't configured.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  ?? ''
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * True when Supabase credentials are present and non-placeholder.
 * The app will use mock data when this is false.
 */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseKey.length > 20

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null
