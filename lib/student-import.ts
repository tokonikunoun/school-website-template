import { z } from 'zod'

export const IMPORT_COLUMNS = [
  'first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'class', 'arm',
  'admission_no', 'boarding_status', 'student_type', 'state_of_origin', 'religion',
  'guardian_name', 'guardian_relationship', 'guardian_phone', 'guardian_email',
] as const

export const IMPORT_EXAMPLE = [
  'Chiamaka', 'Ada', 'Okafor', 'female', '2013-04-17', 'JSS 1', 'A',
  '', 'day', 'new', 'Anambra', 'Christianity',
  'Mrs. Ngozi Okafor', 'Mother', '08031234567', 'ngozi.okafor@example.com',
]

const optional = (schema: z.ZodType) => z.preprocess((v) => (v === '' || v == null ? undefined : v), schema.optional())

export const importRowSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(80),
  middle_name: optional(z.string().trim().max(80)),
  last_name: z.string().trim().min(1, 'Last name is required').max(80),
  gender: z.preprocess((v) => String(v ?? '').trim().toLowerCase().replace(/^m$/, 'male').replace(/^f$/, 'female'),
    z.enum(['male', 'female'], { error: 'Gender must be male or female' })),
  date_of_birth: optional(z.iso.date({ error: 'Date of birth must be YYYY-MM-DD' })),
  class: z.string().trim().min(1, 'Class is required'),
  arm: z.string().trim().min(1, 'Arm is required'),
  admission_no: optional(z.string().trim().max(40)),
  boarding_status: z.preprocess((v) => (v ? String(v).trim().toLowerCase() : 'day'), z.enum(['day', 'boarding'], { error: 'Boarding status must be day or boarding' })),
  student_type: z.preprocess((v) => (v ? String(v).trim().toLowerCase() : 'new'), z.enum(['new', 'returning'], { error: 'Student type must be new or returning' })),
  state_of_origin: optional(z.string().trim().max(60)),
  religion: optional(z.string().trim().max(60)),
  guardian_name: optional(z.string().trim().max(120)),
  guardian_relationship: optional(z.string().trim().max(40)),
  guardian_phone: optional(z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Guardian phone is not a valid number')),
  guardian_email: optional(z.email({ error: 'Guardian email is not valid' })),
})

export type ImportRow = z.infer<typeof importRowSchema>
export type ImportError = { row: number; field: string; message: string; values: Record<string, string> }

/**
 * Validate parsed rows against the schema and the school's class arms.
 * Row numbers are 1-based spreadsheet rows (row 1 is the header).
 */
export function validateImportRows(
  rows: Record<string, string>[],
  classArmLookup: Map<string, string>,
  existingAdmissionNos: Set<string>,
) {
  const valid: { row: number; data: ImportRow; classArmId: string }[] = []
  const errors: ImportError[] = []
  const seenAdmission = new Set<string>()

  rows.forEach((raw, i) => {
    const rowNo = i + 2
    const parsed = importRowSchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({ row: rowNo, field: String(issue.path[0] ?? ''), message: issue.message, values: raw })
      }
      return
    }
    const d = parsed.data
    const key = armKey(d.class, d.arm)
    const classArmId = classArmLookup.get(key)
    if (!classArmId) {
      errors.push({ row: rowNo, field: 'class', message: `Unknown class/arm "${d.class} ${d.arm}"`, values: raw })
      return
    }
    if (d.admission_no) {
      const adm = String(d.admission_no).toUpperCase()
      if (existingAdmissionNos.has(adm)) {
        errors.push({ row: rowNo, field: 'admission_no', message: `Admission number ${d.admission_no} already exists`, values: raw })
        return
      }
      if (seenAdmission.has(adm)) {
        errors.push({ row: rowNo, field: 'admission_no', message: `Admission number ${d.admission_no} appears twice in the file`, values: raw })
        return
      }
      seenAdmission.add(adm)
    }
    if (d.guardian_name && !d.guardian_phone && !d.guardian_email) {
      errors.push({ row: rowNo, field: 'guardian_phone', message: 'Guardian needs a phone number or email', values: raw })
      return
    }
    valid.push({ row: rowNo, data: d, classArmId })
  })

  return { valid, errors }
}

export function armKey(className: string, armName: string) {
  return `${className.trim().toLowerCase().replace(/\s+/g, '')}|${armName.trim().toLowerCase()}`
}
