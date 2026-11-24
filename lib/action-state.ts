export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined

/** Map Postgres/PostgREST errors to messages that are safe to show staff. */
export function dbError(error: { code?: string; message?: string } | null | undefined, fallback = 'Could not save. Please try again.') {
  if (!error) return fallback
  if (error.code === '23505') return 'That record already exists.'
  if (error.code === '23503') return 'This record is still in use and cannot be removed.'
  if (error.code === '42501') return 'You do not have permission to do that.'
  if (error.code === 'P0001' && error.message) return error.message
  console.error('[db]', error.code, error.message)
  return fallback
}
