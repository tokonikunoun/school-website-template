'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { dbError, type ActionState } from '@/lib/action-state'

const uuid = z.uuid()
const date = z.iso.date()

function str(fd: FormData, key: string) {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

async function gate() {
  await requirePermission('academics.manage')
  return createClient()
}

function done(message: string, path = '/admin/academics'): ActionState {
  revalidatePath(path, 'layout')
  return { ok: true, message }
}

// ---------------------------------------------------------------- sessions & terms

const sessionSchema = z
  .object({ name: z.string().regex(/^\d{4}\/\d{4}$/, 'Use the format 2026/2027'), start_date: date, end_date: date })
  .refine((s) => s.end_date > s.start_date, { message: 'End date must be after start date' })

export async function createSession(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = sessionSchema.safeParse({ name: str(fd, 'name'), start_date: str(fd, 'start_date'), end_date: str(fd, 'end_date') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { data: session, error } = await supabase.from('sessions').insert(parsed.data).select('id').single()
  if (error) return { error: dbError(error) }

  if (fd.get('with_terms') === 'on') {
    const start = new Date(parsed.data.start_date)
    const names = ['First Term', 'Second Term', 'Third Term']
    const terms = names.map((name, i) => {
      const s = new Date(start)
      s.setMonth(start.getMonth() + i * 4)
      const e = new Date(s)
      e.setMonth(s.getMonth() + 3)
      e.setDate(e.getDate() - 7)
      return { session_id: session.id, name, term_number: i + 1, start_date: s.toISOString().slice(0, 10), end_date: e.toISOString().slice(0, 10) }
    })
    const { error: termErr } = await supabase.from('terms').insert(terms)
    if (termErr) return { error: dbError(termErr, 'Session created, but terms could not be added.') }
  }
  return done(`Session ${parsed.data.name} created.`)
}

const termSchema = z
  .object({
    name: z.string().min(2).max(40),
    term_number: z.coerce.number().int().min(1).max(3),
    start_date: date,
    end_date: date,
    next_term_begins: date.optional(),
    school_days: z.coerce.number().int().min(1).max(200).optional(),
  })
  .refine((t) => t.end_date > t.start_date, { message: 'End date must be after start date' })

function termInput(fd: FormData) {
  return termSchema.safeParse({
    name: str(fd, 'name'),
    term_number: str(fd, 'term_number'),
    start_date: str(fd, 'start_date'),
    end_date: str(fd, 'end_date'),
    next_term_begins: str(fd, 'next_term_begins') || undefined,
    school_days: str(fd, 'school_days') || undefined,
  })
}

export async function createTerm(_: ActionState, fd: FormData): Promise<ActionState> {
  const sessionId = uuid.safeParse(str(fd, 'session_id'))
  const parsed = termInput(fd)
  if (!sessionId.success) return { error: 'Choose a session.' }
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { error } = await supabase.from('terms').insert({ ...parsed.data, session_id: sessionId.data })
  if (error) return { error: dbError(error) }
  return done(`${parsed.data.name} added.`)
}

export async function updateTerm(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  const parsed = termInput(fd)
  if (!id.success) return { error: 'Invalid term.' }
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { error } = await supabase
    .from('terms')
    .update({ ...parsed.data, next_term_begins: parsed.data.next_term_begins ?? null, school_days: parsed.data.school_days ?? null })
    .eq('id', id.data)
  if (error) return { error: dbError(error) }
  return done('Term updated.')
}

export async function setCurrentTerm(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  if (!id.success) return { error: 'Invalid term.' }
  const supabase = await gate()
  const { error } = await supabase.rpc('set_current_term', { p_term: id.data })
  if (error) return { error: dbError(error) }
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Current term updated.' }
}

export async function setTermLock(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  if (!id.success) return { error: 'Invalid term.' }
  const lock = str(fd, 'lock') === 'true'
  const supabase = await gate()
  const { error } = await supabase.from('terms').update({ is_locked: lock }).eq('id', id.data)
  if (error) return { error: dbError(error) }
  return done(lock ? 'Term locked. Its dates and results are now frozen.' : 'Term unlocked.')
}

// ---------------------------------------------------------------- classes & arms

export async function createClass(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z
    .object({ name: z.string().min(2).max(30), level_group: z.enum(['junior', 'senior']), sort_order: z.coerce.number().int().min(0).max(99) })
    .safeParse({ name: str(fd, 'name'), level_group: str(fd, 'level_group'), sort_order: str(fd, 'sort_order') || '0' })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { error } = await supabase.from('classes').insert(parsed.data)
  if (error) return { error: dbError(error) }
  return done(`${parsed.data.name} added.`)
}

export async function createArm(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd, 'name')
  if (!/^[A-Za-z0-9 ]{1,20}$/.test(name)) return { error: 'Arm name should be short, e.g. A, B or Gold.' }
  const supabase = await gate()
  const { error } = await supabase.from('arms').insert({ name })
  if (error) return { error: dbError(error) }
  return done(`Arm ${name} added.`)
}

export async function createClassArm(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z
    .object({ class_id: uuid, arm_id: uuid, capacity: z.coerce.number().int().min(1).max(200).optional() })
    .safeParse({ class_id: str(fd, 'class_id'), arm_id: str(fd, 'arm_id'), capacity: str(fd, 'capacity') || undefined })
  if (!parsed.success) return { error: 'Choose a class and an arm.' }
  const supabase = await gate()
  const { error } = await supabase.from('class_arms').insert(parsed.data)
  if (error) return { error: error.code === '23505' ? 'That class already has this arm.' : dbError(error) }
  return done('Class arm added.')
}

export async function updateClassArm(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z
    .object({ id: uuid, form_teacher_id: uuid.nullable(), capacity: z.coerce.number().int().min(1).max(200).nullable() })
    .safeParse({ id: str(fd, 'id'), form_teacher_id: str(fd, 'form_teacher_id') || null, capacity: str(fd, 'capacity') || null })
  if (!parsed.success) return { error: 'Check the form teacher and capacity.' }
  const supabase = await gate()
  const { id, ...rest } = parsed.data
  const { error } = await supabase.from('class_arms').update(rest).eq('id', id)
  if (error) return { error: dbError(error) }
  return done('Class arm saved.')
}

export async function deleteClassArm(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  if (!id.success) return { error: 'Invalid class arm.' }
  const supabase = await gate()
  const { count } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_arm_id', id.data)
  if (count) return { error: `Move the ${count} student(s) in this class arm first.` }
  const { error } = await supabase.from('class_arms').delete().eq('id', id.data)
  if (error) return { error: dbError(error) }
  return done('Class arm removed.')
}

// ---------------------------------------------------------------- subjects

const subjectSchema = z.object({
  name: z.string().min(2).max(60),
  code: z.string().regex(/^[A-Z0-9]{2,8}$/, 'Code must be 2-8 capital letters or digits'),
  category: z.enum(['core', 'elective', 'religious', 'vocational']),
  department: z.string().max(40).optional(),
})

export async function createSubject(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = subjectSchema.safeParse({
    name: str(fd, 'name'),
    code: str(fd, 'code').toUpperCase(),
    category: str(fd, 'category'),
    department: str(fd, 'department') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { error } = await supabase.from('subjects').insert(parsed.data)
  if (error) return { error: error.code === '23505' ? 'A subject with that code already exists.' : dbError(error) }
  return done(`${parsed.data.name} added.`, '/admin/academics/subjects')
}

/** Save the subject offering for one class: which subjects, and which are compulsory. */
export async function saveClassSubjects(_: ActionState, fd: FormData): Promise<ActionState> {
  const classId = uuid.safeParse(str(fd, 'class_id'))
  if (!classId.success) return { error: 'Invalid class.' }
  const offered = fd.getAll('offered').map(String).filter((v) => uuid.safeParse(v).success)
  const compulsory = new Set(fd.getAll('compulsory').map(String))
  const supabase = await gate()

  const { data: existing } = await supabase.from('class_subjects').select('id, subject_id, is_compulsory').eq('class_id', classId.data).is('arm_id', null)
  const existingBySubject = new Map((existing ?? []).map((e) => [e.subject_id, e]))
  const removed = (existing ?? []).filter((e) => !offered.includes(e.subject_id)).map((e) => e.id)
  const upserts = offered.map((subject_id) => ({
    ...(existingBySubject.get(subject_id) ? { id: existingBySubject.get(subject_id)!.id } : {}),
    class_id: classId.data,
    subject_id,
    is_compulsory: compulsory.has(subject_id),
  }))

  if (removed.length) {
    const { error } = await supabase.from('class_subjects').delete().in('id', removed)
    if (error) return { error: dbError(error) }
  }
  const updates = upserts.filter((u) => 'id' in u)
  const inserts = upserts.filter((u) => !('id' in u))
  for (const u of updates) {
    const { error } = await supabase.from('class_subjects').update({ is_compulsory: u.is_compulsory }).eq('id', (u as { id: string }).id)
    if (error) return { error: dbError(error) }
  }
  if (inserts.length) {
    const { error } = await supabase.from('class_subjects').insert(inserts)
    if (error) return { error: dbError(error) }
  }
  return done(`Saved ${offered.length} subjects (${compulsory.size} compulsory).`, '/admin/academics/subjects')
}

// ---------------------------------------------------------------- teacher assignments

export async function saveAssignments(_: ActionState, fd: FormData): Promise<ActionState> {
  const classArmId = uuid.safeParse(str(fd, 'class_arm_id'))
  const sessionId = uuid.safeParse(str(fd, 'session_id'))
  if (!classArmId.success || !sessionId.success) return { error: 'Invalid class or session.' }
  const supabase = await gate()

  const pairs: { subject_id: string; staff_id: string | null }[] = []
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith('subject:')) continue
    const subjectId = key.slice(8)
    if (!uuid.safeParse(subjectId).success) continue
    const staffId = typeof value === 'string' && uuid.safeParse(value).success ? value : null
    pairs.push({ subject_id: subjectId, staff_id: staffId })
  }

  const clear = pairs.filter((p) => !p.staff_id).map((p) => p.subject_id)
  if (clear.length) {
    const { error } = await supabase.from('teacher_assignments').delete()
      .eq('class_arm_id', classArmId.data).eq('session_id', sessionId.data).in('subject_id', clear)
    if (error) return { error: dbError(error) }
  }
  const rows = pairs.filter((p) => p.staff_id).map((p) => ({ class_arm_id: classArmId.data, session_id: sessionId.data, subject_id: p.subject_id, staff_id: p.staff_id! }))
  if (rows.length) {
    const { error } = await supabase.from('teacher_assignments').upsert(rows, { onConflict: 'class_arm_id,subject_id,session_id' })
    if (error) return { error: dbError(error) }
  }
  return done(`Saved ${rows.length} subject teacher assignment(s).`, '/admin/academics/assignments')
}
