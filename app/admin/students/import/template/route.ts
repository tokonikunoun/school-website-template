import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { toCsv } from '@/lib/csv'
import { IMPORT_COLUMNS, IMPORT_EXAMPLE } from '@/lib/student-import'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.permissions.has('students.manage')) return new NextResponse('Forbidden', { status: 403 })
  return new NextResponse(toCsv([[...IMPORT_COLUMNS], IMPORT_EXAMPLE]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="student-import-template.csv"',
    },
  })
}
