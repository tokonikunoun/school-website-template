import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses RLS, so only call it from server actions AFTER the
 * caller's permissions have been checked. Never import this from a client component.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') throw new Error('createAdminClient must only run on the server')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
