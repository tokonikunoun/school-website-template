import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isStaffRole } from '@/lib/roles'

export type CurrentUser = {
  id: string
  email: string | null
  fullName: string
  role: string
  permissions: Set<string>
}

/** Resolve the signed-in user, their primary role and effective permissions (once per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || !profile.is_active) return null

  let permissions: string[] = []
  if (profile.role === 'super_admin') {
    const { data } = await supabase.from('permissions').select('key')
    permissions = (data ?? []).map((p) => p.key)
  } else {
    const { data: extra } = await supabase.from('user_roles').select('role_key').eq('profile_id', user.id)
    const roleKeys = [profile.role, ...(extra ?? []).map((r) => r.role_key)]
    const { data } = await supabase.from('role_permissions').select('permission_key').in('role_key', roleKeys)
    permissions = (data ?? []).map((p) => p.permission_key)
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    fullName: profile.full_name ?? user.email ?? 'User',
    role: profile.role,
    permissions: new Set(permissions),
  }
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireStaff() {
  const user = await requireUser()
  if (!isStaffRole(user.role)) redirect('/login')
  return user
}

export async function requireRole(role: 'parent' | 'student') {
  const user = await requireUser()
  if (user.role !== role) redirect('/login')
  return user
}

/** Server-side permission gate. RLS enforces the same rules in the database. */
export async function requirePermission(permission: string) {
  const user = await requireStaff()
  if (!user.permissions.has(permission)) redirect('/admin?denied=1')
  return user
}
