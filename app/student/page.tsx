import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon, PortalShell } from '@/components/portal/portal-shell'

export const metadata: Metadata = { title: 'Student portal', robots: { index: false } }

export default async function StudentPortal() {
  const user = await requireRole('student')
  const supabase = await createClient()
  const { data: me } = await supabase.from('students').select('admission_no, first_name, last_name').eq('profile_id', user.id).maybeSingle()

  return (
    <PortalShell title="Student portal" userName={user.fullName}>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Hello, {me?.first_name ?? user.fullName.split(' ')[0]}</h1>
        {me && <p className="text-muted-foreground">Admission number {me.admission_no}</p>}
      </div>
      <ComingSoon items={['My results', 'Timetable', 'Attendance', 'Announcements']} />
    </PortalShell>
  )
}
