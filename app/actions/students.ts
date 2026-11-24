'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { dbError, type ActionState } from '@/lib/action-state'
import { getClassArms, getCurrentTerm } from '@/lib/academics'
import { parseCsv, rowsToObjects } from '@/lib/csv'
import { armKey, validateImportRows, type ImportError } from '@/lib/student-import'

const uuid = z.uuid()

function str(fd: FormData, key: string) {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}
const opt = (fd: FormData, key: string) => str(fd, key) || null

async function gate() {
  await requirePermission('students.manage')
  return createClient()
}

const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(80),
  middle_name: z.string().max(80).nullable(),
  last_name: z.string().min(1, 'Last name is required').max(80),
  gender: z.enum(['male', 'female'], { error: 'Choose a gender' }),
  date_of_birth: z.iso.date().nullable(),
  state_of_origin: z.string().max(60).nullable(),
  lga: z.string().max(60).nullable(),
  religion: z.string().max(60).nullable(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable(),
  genotype: z.enum(['AA', 'AS', 'AC', 'SS', 'SC', 'CC']).nullable(),
  previous_school: z.string().max(120).nullable(),
  house: z.string().max(40).nullable(),
  boarding_status: z.enum(['day', 'boarding']),
  student_type: z.enum(['new', 'returning']),
  medical_notes: z.string().max(1000).nullable(),
  class_arm_id: uuid.nullable(),
  admitted_on: z.iso.date().nullable(),
})

function studentInput(fd: FormData) {
  return studentSchema.safeParse({
    first_name: str(fd, 'first_name'),
    middle_name: opt(fd, 'middle_name'),
    last_name: str(fd, 'last_name'),
    gender: str(fd, 'gender'),
    date_of_birth: opt(fd, 'date_of_birth'),
    state_of_origin: opt(fd, 'state_of_origin'),
    lga: opt(fd, 'lga'),
    religion: opt(fd, 'religion'),
    blood_group: opt(fd, 'blood_group'),
    genotype: opt(fd, 'genotype'),
    previous_school: opt(fd, 'previous_school'),
    house: opt(fd, 'house'),
    boarding_status: str(fd, 'boarding_status') || 'day',
    student_type: str(fd, 'student_type') || 'new',
    medical_notes: opt(fd, 'medical_notes'),
    class_arm_id: opt(fd, 'class_arm_id'),
    admitted_on: opt(fd, 'admitted_on'),
  })
}

function emergencyContacts(fd: FormData) {
  const names = fd.getAll('ec_name').map(String)
  const phones = fd.getAll('ec_phone').map(String)
  return names
    .map((name, i) => ({ name: name.trim().slice(0, 120), phone: (phones[i] ?? '').trim().slice(0, 20) }))
    .filter((c) => c.name && c.phone)
    .slice(0, 3)
}

async function nextAdmissionNo() {
  const { data, error } = await createAdminClient().rpc('generate_admission_no')
  if (error || !data) throw new Error('Could not generate an admission number')
  return data as string
}

export async function createStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = studentInput(fd)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const admissionNo = str(fd, 'admission_no').toUpperCase() || (await nextAdmissionNo())
  const { data, error } = await supabase
    .from('students')
    .insert({ ...parsed.data, admission_no: admissionNo, emergency_contacts: emergencyContacts(fd), status: 'active' })
    .select('id')
    .single()
  if (error) return { error: error.code === '23505' ? `Admission number ${admissionNo} is already in use.` : dbError(error) }

  const term = await getCurrentTerm()
  await supabase.from('student_class_history').insert({
    student_id: data.id, session_id: term?.sessionId ?? null, to_class_arm_id: parsed.data.class_arm_id, action: 'enrolled',
  })
  revalidatePath('/admin/students')
  redirect(`/admin/students/${data.id}?created=1`)
}

export async function updateStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  const parsed = studentInput(fd)
  if (!id.success) return { error: 'Invalid student.' }
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()

  // Class changes go through moveStudent so they are recorded in history.
  const { class_arm_id: _ignored, ...rest } = parsed.data
  const { error } = await supabase.from('students').update({ ...rest, emergency_contacts: emergencyContacts(fd) }).eq('id', id.data)
  if (error) return { error: dbError(error) }
  revalidatePath(`/admin/students/${id.data}`)
  return { ok: true, message: 'Student details saved.' }
}

export async function moveStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({ id: uuid, class_arm_id: uuid, note: z.string().max(300).nullable() })
    .safeParse({ id: str(fd, 'id'), class_arm_id: str(fd, 'class_arm_id'), note: opt(fd, 'note') })
  if (!parsed.success) return { error: 'Choose a class arm.' }
  const supabase = await gate()
  const { data: current } = await supabase.from('students').select('class_arm_id').eq('id', parsed.data.id).single()
  if (current?.class_arm_id === parsed.data.class_arm_id) return { error: 'The student is already in that class.' }

  const { error } = await supabase.from('students').update({ class_arm_id: parsed.data.class_arm_id }).eq('id', parsed.data.id)
  if (error) return { error: dbError(error) }
  const term = await getCurrentTerm()
  await supabase.from('student_class_history').insert({
    student_id: parsed.data.id, session_id: term?.sessionId ?? null, from_class_arm_id: current?.class_arm_id ?? null,
    to_class_arm_id: parsed.data.class_arm_id, action: 'moved', note: parsed.data.note,
  })
  revalidatePath(`/admin/students/${parsed.data.id}`)
  return { ok: true, message: 'Class changed.' }
}

export async function changeStudentStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = z.object({
    id: uuid,
    status: z.enum(['active', 'graduated', 'withdrawn', 'suspended', 'transferred']),
    note: z.string().min(3, 'Give a short reason').max(300),
  }).safeParse({ id: str(fd, 'id'), status: str(fd, 'status'), note: str(fd, 'note') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { error } = await supabase.from('students').update({ status: parsed.data.status }).eq('id', parsed.data.id)
  if (error) return { error: dbError(error) }
  const term = await getCurrentTerm()
  await supabase.from('student_class_history').insert({
    student_id: parsed.data.id, session_id: term?.sessionId ?? null, action: 'status_change', note: `${parsed.data.status}: ${parsed.data.note}`,
  })
  revalidatePath(`/admin/students/${parsed.data.id}`)
  return { ok: true, message: `Status changed to ${parsed.data.status}.` }
}

// ---------------------------------------------------------------- guardians

const guardianSchema = z.object({
  student_id: uuid,
  full_name: z.string().min(2, 'Guardian name is required').max(120),
  relationship: z.string().min(2, 'Relationship is required').max(40),
  phone: z.string().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number').nullable(),
  email: z.email('Enter a valid email').nullable(),
  address: z.string().max(300).nullable(),
  occupation: z.string().max(80).nullable(),
  is_primary: z.boolean(),
}).refine((g) => g.phone || g.email, { message: 'Add a phone number or email for the guardian' })

/** Siblings share guardians: reuse an existing record with the same phone or email. */
async function findGuardian(phone: string | null, email: string | null) {
  const admin = createAdminClient()
  for (const [col, val] of [['phone', phone], ['email', email]] as const) {
    if (!val) continue
    const { data } = await admin.from('guardians').select('id').eq(col, val).limit(1).maybeSingle()
    if (data) return data.id as string
  }
  return null
}

export async function addGuardian(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = guardianSchema.safeParse({
    student_id: str(fd, 'student_id'), full_name: str(fd, 'full_name'), relationship: str(fd, 'relationship'),
    phone: opt(fd, 'phone'), email: opt(fd, 'email')?.toLowerCase() ?? null, address: opt(fd, 'address'),
    occupation: opt(fd, 'occupation'), is_primary: fd.get('is_primary') === 'on',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await gate()
  const { student_id, relationship, is_primary, ...guardian } = parsed.data

  let guardianId = await findGuardian(guardian.phone, guardian.email)
  if (!guardianId) {
    const { data, error } = await supabase.from('guardians').insert(guardian).select('id').single()
    if (error) return { error: dbError(error) }
    guardianId = data.id
  }
  if (is_primary) await supabase.from('student_guardians').update({ is_primary: false }).eq('student_id', student_id)
  const { error } = await supabase.from('student_guardians').insert({ student_id, guardian_id: guardianId, relationship, is_primary })
  if (error) return { error: error.code === '23505' ? 'This guardian is already linked to the student.' : dbError(error) }
  revalidatePath(`/admin/students/${student_id}`)
  return { ok: true, message: 'Guardian linked.' }
}

export async function unlinkGuardian(_: ActionState, fd: FormData): Promise<ActionState> {
  const studentId = uuid.safeParse(str(fd, 'student_id'))
  const guardianId = uuid.safeParse(str(fd, 'guardian_id'))
  if (!studentId.success || !guardianId.success) return { error: 'Invalid guardian.' }
  const supabase = await gate()
  const { error } = await supabase.from('student_guardians').delete().eq('student_id', studentId.data).eq('guardian_id', guardianId.data)
  if (error) return { error: dbError(error) }
  revalidatePath(`/admin/students/${studentId.data}`)
  return { ok: true, message: 'Guardian unlinked.' }
}

// ---------------------------------------------------------------- photo

const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function uploadStudentPhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  const file = fd.get('photo')
  if (!id.success) return { error: 'Invalid student.' }
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo.' }
  const ext = PHOTO_TYPES[file.type]
  if (!ext) return { error: 'Photo must be JPG, PNG or WebP.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Photo must be 2 MB or smaller.' }

  const supabase = await gate()
  const { data: student } = await supabase.from('students').select('photo_url').eq('id', id.data).single()
  const path = `${id.data}/photo-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from('student-photos').upload(path, file, { contentType: file.type })
  if (upErr) return { error: 'Upload failed. Please try again.' }
  const { error } = await supabase.from('students').update({ photo_url: path }).eq('id', id.data)
  if (error) return { error: dbError(error) }
  const old = student?.photo_url
  if (old && old.startsWith(`${id.data}/`)) await supabase.storage.from('student-photos').remove([old])
  revalidatePath(`/admin/students/${id.data}`)
  return { ok: true, message: 'Photo updated.' }
}

// ---------------------------------------------------------------- electives

export async function saveElectives(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid.safeParse(str(fd, 'id'))
  if (!id.success) return { error: 'Invalid student.' }
  const chosen = fd.getAll('subject').map(String).filter((s) => uuid.safeParse(s).success)
  const term = await getCurrentTerm()
  if (!term) return { error: 'Set a current term first.' }
  const supabase = await gate()
  const { error: delErr } = await supabase.from('student_subjects').delete().eq('student_id', id.data).eq('session_id', term.sessionId)
  if (delErr) return { error: dbError(delErr) }
  if (chosen.length) {
    const { error } = await supabase.from('student_subjects').insert(chosen.map((subject_id) => ({ student_id: id.data, subject_id, session_id: term.sessionId })))
    if (error) return { error: dbError(error) }
  }
  revalidatePath(`/admin/students/${id.data}`)
  return { ok: true, message: `${chosen.length} elective(s) registered for ${term.sessionName}.` }
}

// ---------------------------------------------------------------- bulk import

export type ImportState =
  | { stage: 'preview'; token: string; fileName: string; total: number; validCount: number; errors: ImportError[]; sample: { name: string; className: string }[] }
  | { stage: 'done'; created: number; guardians: number }
  | { stage: 'error'; error: string }
  | undefined

const MAX_ROWS = 1000

function cellToString(v: unknown) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).trim()
}

async function readUpload(file: File): Promise<Record<string, string>[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return rowsToObjects(parseCsv(await file.text()))
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/node')
    const sheet = await readSheet(Buffer.from(await file.arrayBuffer()))
    return rowsToObjects(sheet.map((row) => row.map(cellToString)))
  }
  throw new Error('Upload a .csv or .xlsx file')
}

async function prepareImport(file: File) {
  const rows = await readUpload(file)
  if (rows.length === 0) throw new Error('The file has no data rows.')
  if (rows.length > MAX_ROWS) throw new Error(`Import at most ${MAX_ROWS} students at a time.`)
  const supabase = await createClient()
  const arms = await getClassArms()
  const lookup = new Map(arms.map((a) => [armKey(a.className, a.armName), a.id]))
  const given = rows.map((r) => r.admission_no?.toUpperCase()).filter(Boolean)
  const { data: existing } = given.length
    ? await supabase.from('students').select('admission_no').in('admission_no', given)
    : { data: [] }
  const result = validateImportRows(rows, lookup, new Set((existing ?? []).map((e) => e.admission_no.toUpperCase())))
  return { ...result, total: rows.length, arms }
}

/**
 * Step 1 validates and returns a preview. Step 2 (confirm) re-reads and re-validates the
 * same file server-side, then inserts only the valid rows. Nothing is trusted from the preview.
 */
export async function importStudents(_: ImportState, fd: FormData): Promise<ImportState> {
  await requirePermission('students.manage')
  const file = fd.get('file')
  if (!(file instanceof File) || file.size === 0) return { stage: 'error', error: 'Choose a CSV or Excel file.' }
  if (file.size > 5 * 1024 * 1024) return { stage: 'error', error: 'File must be 5 MB or smaller.' }

  let prepared: Awaited<ReturnType<typeof prepareImport>>
  try {
    prepared = await prepareImport(file)
  } catch (e) {
    return { stage: 'error', error: e instanceof Error ? e.message : 'Could not read the file.' }
  }
  const { valid, errors, total, arms } = prepared
  const armLabel = new Map(arms.map((a) => [a.id, a.label]))

  if (fd.get('confirm') !== 'yes') {
    return {
      stage: 'preview',
      token: crypto.randomUUID(),
      fileName: file.name,
      total,
      validCount: valid.length,
      errors: errors.slice(0, 500),
      sample: valid.slice(0, 8).map((v) => ({ name: `${v.data.last_name} ${v.data.first_name}`, className: armLabel.get(v.classArmId) ?? '' })),
    }
  }
  if (valid.length === 0) return { stage: 'error', error: 'There are no valid rows to import.' }

  const supabase = await createClient()
  const term = await getCurrentTerm()
  let created = 0
  let guardians = 0

  for (const { data: d, classArmId } of valid) {
    const admissionNo = d.admission_no ? String(d.admission_no).toUpperCase() : await nextAdmissionNo()
    const { data: student, error } = await supabase.from('students').insert({
      admission_no: admissionNo, first_name: d.first_name, middle_name: d.middle_name ?? null, last_name: d.last_name,
      gender: d.gender, date_of_birth: d.date_of_birth ?? null, class_arm_id: classArmId, boarding_status: d.boarding_status,
      student_type: d.student_type, state_of_origin: d.state_of_origin ?? null, religion: d.religion ?? null, status: 'active',
    }).select('id').single()
    if (error || !student) continue
    created++
    await supabase.from('student_class_history').insert({ student_id: student.id, session_id: term?.sessionId ?? null, to_class_arm_id: classArmId, action: 'enrolled', note: 'Bulk import' })

    if (d.guardian_name) {
      const phone = d.guardian_phone ? String(d.guardian_phone) : null
      const email = d.guardian_email ? String(d.guardian_email).toLowerCase() : null
      let guardianId = await findGuardian(phone, email)
      if (!guardianId) {
        const { data: g } = await supabase.from('guardians').insert({ full_name: d.guardian_name, phone, email }).select('id').single()
        guardianId = g?.id ?? null
      }
      if (guardianId) {
        const { error: linkErr } = await supabase.from('student_guardians').insert({
          student_id: student.id, guardian_id: guardianId, relationship: d.guardian_relationship ?? 'Guardian', is_primary: true,
        })
        if (!linkErr) guardians++
      }
    }
  }
  revalidatePath('/admin/students')
  return { stage: 'done', created, guardians }
}

// ---------------------------------------------------------------- promotion

export async function promoteStudents(_: ActionState, fd: FormData): Promise<ActionState> {
  await requirePermission('students.manage')
  const moves: { student_id: string; action: string; to_class_arm_id: string | null }[] = []
  const defaultTarget = str(fd, 'default_target')

  for (const [key, value] of fd.entries()) {
    if (!key.startsWith('action:')) continue
    const studentId = key.slice(7)
    const action = String(value)
    if (!uuid.safeParse(studentId).success || action === 'skip') continue
    if (!['promote', 'repeat', 'graduate'].includes(action)) continue
    const target = action === 'repeat' ? str(fd, 'from_arm') : action === 'promote' ? defaultTarget : ''
    if (action !== 'graduate' && !uuid.safeParse(target).success) return { error: 'Choose a destination class for promoted students.' }
    moves.push({ student_id: studentId, action, to_class_arm_id: action === 'graduate' ? null : target })
  }
  if (!moves.length) return { error: 'No students selected.' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('promote_students', { p_moves: moves })
  if (error) return { error: dbError(error) }
  revalidatePath('/admin/students', 'layout')
  const counts = moves.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.action]: (acc[m.action] ?? 0) + 1 }), {})
  return {
    ok: true,
    message: `Processed ${data} student(s): ${counts.promote ?? 0} promoted, ${counts.repeat ?? 0} repeating, ${counts.graduate ?? 0} graduated.`,
  }
}
