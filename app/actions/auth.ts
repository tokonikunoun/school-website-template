'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { homeForRole } from '@/lib/roles'

export type FormState = { error?: string; success?: string } | undefined

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
  next: z.string().max(300).optional(),
})

function safeNext(next: string | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Enter a valid email and password.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Please confirm your email address first.' }
    if (error.status === 429) return { error: 'Too many attempts. Please wait a minute and try again.' }
    if (error.code === 'invalid_credentials') return { error: 'Invalid email or password.' }
    console.error('[auth] sign-in failed', error.code, error.status)
    return { error: 'Something went wrong. Please try again.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, must_change_password')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return { error: 'This account is disabled. Contact the school office.' }
  }
  if (profile.must_change_password) redirect('/account/password')
  redirect(safeNext(parsed.data.next) ?? homeForRole(profile.role))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().max(200).safeParse(formData.get('email'))
  if (!email.success) return { error: 'Enter a valid email address.' }

  const h = await headers()
  const origin = h.get('origin') ?? `https://${h.get('host')}`
  const redirectBase = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${origin}/auth/callback`
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${redirectBase}?next=/account/password`,
  })
  if (error?.status === 429) return { error: 'Too many requests. Please try again later.' }
  // Same response whether or not the account exists.
  return { success: 'If an account exists for that email, a reset link is on its way.' }
}

const passwordSchema = z
  .object({ password: z.string().min(8).max(72), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match.' })

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Use at least 8 characters.' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === 'weak_password') return { error: 'That password is too weak. Try a longer one.' }
    if (error.code === 'same_password') return { error: 'Choose a password different from your current one.' }
    return { error: 'Could not update your password. Please try again.' }
  }
  await supabase.rpc('mark_password_changed')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  redirect(homeForRole(profile?.role))
}
