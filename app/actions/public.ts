'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type PublicFormState =
  | { error?: string; success?: string; reference?: string; values?: Record<string, string> }
  | undefined

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined))

function values(formData: FormData) {
  return Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  email: z.union([z.email('Enter a valid email.').max(200), z.literal('')]).optional(),
  phone: optional(30),
  subject: optional(200),
  message: z.string().trim().min(5, 'Your message is too short.').max(5000),
})

export async function submitContact(_: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = contactSchema.safeParse(values(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, values: values(formData) }
  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({ ...parsed.data, email: parsed.data.email || null })
  if (error) {
    console.error('[contact] insert failed', error.code)
    return { error: 'We could not send your message. Please call us instead.', values: values(formData) }
  }
  return { success: 'Thank you. Your message has been received and we will reply shortly.' }
}

const jobSchema = z.object({
  vacancy_id: z.uuid().optional().or(z.literal('').transform(() => undefined)),
  full_name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.email('Enter a valid email.').max(200),
  phone: optional(30),
  qualification: optional(300),
  cover_letter: optional(5000),
})

export async function submitJobApplication(_: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = jobSchema.safeParse(values(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, values: values(formData) }
  const supabase = await createClient()
  const { error } = await supabase.from('job_applications').insert(parsed.data)
  if (error) {
    console.error('[careers] insert failed', error.code)
    return { error: 'We could not submit your application. Please try again.', values: values(formData) }
  }
  return { success: 'Application received. Shortlisted candidates will be contacted by email.' }
}

const admissionSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter the student’s first name.').max(80),
  middle_name: optional(80),
  last_name: z.string().trim().min(1, 'Enter the student’s surname.').max(80),
  gender: z.enum(['male', 'female'], { message: 'Select a gender.' }),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth.'),
  class_applied: z.string().trim().min(1, 'Select a class.').max(40),
  previous_school: optional(160),
  boarding_status: z.enum(['day', 'boarding']),
  exam_date: optional(10),
  guardian_name: z.string().trim().min(2, 'Enter the parent or guardian’s name.').max(120),
  guardian_relationship: optional(40),
  guardian_phone: z.string().trim().min(7, 'Enter a valid phone number.').max(30),
  guardian_email: z.union([z.email('Enter a valid email.').max(200), z.literal('')]).optional(),
  guardian_address: optional(300),
})

export async function submitAdmission(_: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = admissionSchema.safeParse(values(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, values: values(formData) }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_application', { payload: parsed.data })
  if (error || !data) {
    console.error('[admissions] submit failed', error?.code)
    return { error: 'We could not submit the application. Please try again.', values: values(formData) }
  }
  return { success: 'Application submitted.', reference: data as string }
}

export type StatusState =
  | { error?: string; result?: { reference: string; applicant: string; class_applied: string; status: string; exam_date: string | null } }
  | undefined

export async function checkApplicationStatus(_: StatusState, formData: FormData): Promise<StatusState> {
  const ref = z.string().trim().min(4).max(40).safeParse(formData.get('reference'))
  if (!ref.success) return { error: 'Enter your application reference.' }
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_application_status', { ref: ref.data })
  const row = Array.isArray(data) ? data[0] : null
  if (!row) return { error: 'No application found with that reference.' }
  return { result: row }
}

export type ResultCheckState =
  | {
      error?: string
      result?: {
        student: string
        admission_no: string
        term: string
        average: number | null
        position: number | null
        number_in_class: number | null
        uses_left: number
        subjects: { subject: string; ca: number; exam: number; total: number }[]
      }
    }
  | undefined

const resultSchema = z.object({
  admission_no: z.string().trim().min(3).max(40),
  serial: z.string().trim().min(3).max(40),
  pin: z.string().trim().min(4).max(40),
})

export async function checkResult(_: ResultCheckState, formData: FormData): Promise<ResultCheckState> {
  const parsed = resultSchema.safeParse(values(formData))
  if (!parsed.success) return { error: 'Fill in your admission number, serial and PIN.' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_result', {
    p_admission_no: parsed.data.admission_no,
    p_serial: parsed.data.serial,
    p_pin: parsed.data.pin,
  })
  if (error || !data) return { error: 'Result checking is unavailable right now. Please try again.' }
  if (!data.ok) return { error: data.error }
  return { result: data }
}
