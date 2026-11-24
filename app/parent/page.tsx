import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ComingSoon, PortalShell } from '@/components/portal/portal-shell'

export const metadata: Metadata = { title: 'Parent portal', robots: { index: false } }

export default async function ParentPortal() {
  const user = await requireRole('parent')
  const supabase = await createClient()
  const { data: children } = await supabase.from('students').select('id, admission_no, first_name, last_name').order('first_name')

  return (
    <PortalShell title="Parent portal" userName={user.fullName}>
      <h1 className="text-3xl font-semibold">Hello, {user.fullName.split(' ')[0]}</h1>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Your children</h2>
        {children?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {children.map((c) => (
              <li key={c.id} className="rounded-lg border bg-card p-5">
                <p className="font-semibold">{c.first_name} {c.last_name}</p>
                <p className="text-sm text-muted-foreground">{c.admission_no}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No children are linked to your account yet. Please contact the school office.</p>
        )}
      </section>
      <ComingSoon items={['Term results and report cards', 'Fee invoices and payments', 'Attendance history', 'School announcements']} />
    </PortalShell>
  )
}
