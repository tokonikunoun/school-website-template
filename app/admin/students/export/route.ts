import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getClassArms } from '@/lib/academics'
import { toCsv } from '@/lib/csv'
import { buildStudentQuery, parseStudentFilters } from '@/lib/student-filters'

type ExportRow = Record<
  'admission_no' | 'last_name' | 'first_name' | 'middle_name' | 'gender' | 'date_of_birth' | 'class_arm_id' | 'boarding_status'
  | 'student_type' | 'status' | 'state_of_origin' | 'religion' | 'admitted_on',
  string | null
> & {
  student_guardians: { is_primary: boolean; relationship: string; guardians: { full_name: string; phone: string | null; email: string | null } | null }[] | null
}

type ExportQuery = {
  eq(col: string, val: string): ExportQuery
  or(filter: string): ExportQuery
  order(col: string): ExportQuery
  limit(n: number): PromiseLike<{ data: ExportRow[] | null }>
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user?.permissions.has('students.view')) return new NextResponse('Forbidden', { status: 403 })

  const filters = parseStudentFilters(Object.fromEntries(request.nextUrl.searchParams))
  const supabase = await createClient()
  const base = supabase
    .from('students')
    .select(
      'admission_no, last_name, first_name, middle_name, gender, date_of_birth, class_arm_id, boarding_status, student_type, status, state_of_origin, religion, admitted_on, student_guardians(is_primary, relationship, guardians(full_name, phone, email))',
    ) as unknown as ExportQuery
  const [arms, { data }] = await Promise.all([
    getClassArms(),
    buildStudentQuery(base, filters).order('last_name').limit(5000),
  ])
  const armLabel = new Map(arms.map((a) => [a.id, a.label]))

  const rows: unknown[][] = [[
    'Admission no', 'Last name', 'First name', 'Middle name', 'Gender', 'Date of birth', 'Class', 'Boarding', 'Type',
    'Status', 'State of origin', 'Religion', 'Admitted on', 'Primary guardian', 'Relationship', 'Guardian phone', 'Guardian email',
  ]]
  for (const s of data ?? []) {
    const links = s.student_guardians ?? []
    const g = links.find((l) => l.is_primary) ?? links[0]
    rows.push([
      s.admission_no, s.last_name, s.first_name, s.middle_name, s.gender, s.date_of_birth,
      s.class_arm_id ? armLabel.get(s.class_arm_id) : '', s.boarding_status, s.student_type, s.status, s.state_of_origin, s.religion,
      s.admitted_on, g?.guardians?.full_name, g?.relationship, g?.guardians?.phone, g?.guardians?.email,
    ])
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
