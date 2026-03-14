import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types.js'

export type TypedSupabaseClient = SupabaseClient<Database>

export const getSupabaseClient = (): TypedSupabaseClient => {
  const supabaseUrl = process.env['SUPABASE_URL']
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase environment variables are missing! Check your .env file.'
    )
  }

  // We use the Service Role Key for backend tasks to bypass RLS
  return createClient<Database>(supabaseUrl, supabaseKey)
}
