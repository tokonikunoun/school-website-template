export const STAFF_ROLES = ['super_admin', 'admin', 'bursar', 'teacher'] as const
export type RoleKey = (typeof STAFF_ROLES)[number] | 'parent' | 'student'

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  bursar: 'Bursar',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
}

export function isStaffRole(role: string | null | undefined) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** Where a signed-in user lands, and which portal prefix they may use. */
export function homeForRole(role: string | null | undefined) {
  if (isStaffRole(role)) return '/admin'
  if (role === 'student') return '/student'
  return '/parent'
}

export function portalForPath(pathname: string): 'admin' | 'parent' | 'student' | 'account' | null {
  for (const p of ['admin', 'parent', 'student', 'account'] as const) {
    if (pathname === `/${p}` || pathname.startsWith(`/${p}/`)) return p
  }
  return null
}

export function roleMayUsePortal(role: string, portal: 'admin' | 'parent' | 'student' | 'account') {
  if (portal === 'account') return true
  if (portal === 'admin') return isStaffRole(role)
  return role === portal
}
