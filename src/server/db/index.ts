import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  )
}

export function getDb(): SupabaseClient {
  if (supabase) return supabase

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseKey = getSupabaseKey()
  if (!supabaseKey) {
    throw new Error(
      'Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_SECRET_KEY or SUPABASE_KEY.'
    )
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return supabase
}

// Kept for compatibility with existing shutdown hooks
export async function closeDb(): Promise<void> {
  supabase = null
}
