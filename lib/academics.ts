import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type ClassArm = {
  id: string
  label: string
  classId: string
  className: string
  armId: string
  armName: string
  levelGroup: string
  sortOrder: number
  capacity: number | null
  formTeacherId: string | null
  formTeacherName: string | null
}

export type StaffOption = { id: string; name: string; staffNo: string; hasLogin: boolean }

export function staffName(s: { title?: string | null; first_name: string; last_name: string }) {
  return [s.title, s.first_name, s.last_name].filter(Boolean).join(' ')
}

export function studentName(s: { first_name: string; middle_name?: string | null; last_name: string }) {
  return [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(' ')
}

export const getCurrentTerm = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('terms')
    .select('id, name, term_number, is_locked, session_id, sessions(id, name)')
    .eq('is_current', true)
    .maybeSingle()
  if (!data) return null
  const session = data.sessions as unknown as { id: string; name: string } | null
  return { id: data.id, name: data.name, termNumber: data.term_number, isLocked: data.is_locked, sessionId: data.session_id, sessionName: session?.name ?? '' }
})

export const getClassArms = cache(async (): Promise<ClassArm[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('class_arms')
    .select('id, capacity, form_teacher_id, classes(id, name, level_group, sort_order), arms(id, name), staff(title, first_name, last_name)')
  return (data ?? [])
    .map((row) => {
      const c = row.classes as unknown as { id: string; name: string; level_group: string; sort_order: number }
      const a = row.arms as unknown as { id: string; name: string }
      const t = row.staff as unknown as { title: string | null; first_name: string; last_name: string } | null
      return {
        id: row.id,
        label: `${c.name} ${a.name}`,
        classId: c.id,
        className: c.name,
        armId: a.id,
        armName: a.name,
        levelGroup: c.level_group,
        sortOrder: c.sort_order,
        capacity: row.capacity,
        formTeacherId: row.form_teacher_id,
        formTeacherName: t ? staffName(t) : null,
      }
    })
    .sort((x, y) => x.sortOrder - y.sortOrder || x.armName.localeCompare(y.armName))
})

export const getTeachingStaff = cache(async (): Promise<StaffOption[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('staff')
    .select('id, staff_no, title, first_name, last_name, profile_id')
    .eq('staff_type', 'teaching')
    .in('status', ['active', 'on_leave'])
    .order('last_name')
  return (data ?? []).map((s) => ({ id: s.id, name: staffName(s), staffNo: s.staff_no, hasLogin: !!s.profile_id }))
})

export const getSubjects = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('id, name, code, category, department').order('name')
  return data ?? []
})

/** Class arms the signed-in staff member teaches or is form teacher of. */
export const getMyTeaching = cache(async (profileId: string) => {
  const supabase = await createClient()
  const { data: me } = await supabase.from('staff').select('id').eq('profile_id', profileId).maybeSingle()
  if (!me) return { staffId: null, formArms: [] as string[], subjectsByArm: new Map<string, { id: string; name: string }[]>() }
  const term = await getCurrentTerm()
  const [{ data: form }, { data: assigned }] = await Promise.all([
    supabase.from('class_arms').select('id').eq('form_teacher_id', me.id),
    term
      ? supabase.from('teacher_assignments').select('class_arm_id, subjects(id, name)').eq('staff_id', me.id).eq('session_id', term.sessionId)
      : Promise.resolve({ data: [] as { class_arm_id: string; subjects: unknown }[] }),
  ])
  const subjectsByArm = new Map<string, { id: string; name: string }[]>()
  for (const a of assigned ?? []) {
    const list = subjectsByArm.get(a.class_arm_id) ?? []
    list.push(a.subjects as { id: string; name: string })
    subjectsByArm.set(a.class_arm_id, list)
  }
  return { staffId: me.id, formArms: (form ?? []).map((f) => f.id), subjectsByArm }
})

export async function signedPhotoUrls(paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p && !p.startsWith('http') && !p.startsWith('/')))]
  const map = new Map<string, string>()
  if (!unique.length) return map
  const supabase = await createClient()
  const { data } = await supabase.storage.from('student-photos').createSignedUrls(unique, 60 * 60)
  for (const item of data ?? []) if (item.signedUrl && item.path) map.set(item.path, item.signedUrl)
  return map
}

export function photoSrc(path: string | null | undefined, signed: Map<string, string>) {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('/')) return path
  return signed.get(path) ?? null
}
