export const STUDENT_STATUSES = ['active', 'graduated', 'withdrawn', 'suspended', 'transferred'] as const

export type StudentFilters = { q: string; arm: string; status: string; gender: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseStudentFilters(params: Record<string, string | undefined>): StudentFilters {
  const status = params.status ?? 'active'
  return {
    // Strip characters that have meaning in PostgREST filter syntax.
    q: (params.q ?? '').replace(/[,()*%\\]/g, ' ').trim().slice(0, 60),
    arm: params.arm && UUID.test(params.arm) ? params.arm : '',
    status: status === 'all' || (STUDENT_STATUSES as readonly string[]).includes(status) ? status : 'active',
    gender: params.gender === 'male' || params.gender === 'female' ? params.gender : '',
  }
}

type Filterable<T> = {
  eq(col: string, val: string): T
  or(filter: string): T
}

export function buildStudentQuery<T extends Filterable<T>>(query: T, f: StudentFilters): T {
  let q = query
  if (f.status !== 'all') q = q.eq('status', f.status)
  if (f.arm) q = q.eq('class_arm_id', f.arm)
  if (f.gender) q = q.eq('gender', f.gender)
  if (f.q) {
    const term = `%${f.q}%`
    q = q.or(`first_name.ilike.${term},last_name.ilike.${term},middle_name.ilike.${term},admission_no.ilike.${term}`)
  }
  return q
}
