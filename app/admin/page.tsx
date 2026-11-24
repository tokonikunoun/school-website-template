import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import { ADMIN_MODULES } from '@/lib/admin-nav'
import { formatDate, formatNaira } from '@/lib/format'

async function count(table: string, filter?: (q: any) => any) {
  const supabase = await createClient()
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count: c } = await q
  return c ?? 0
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams
  const user = await requireStaff()
  const supabase = await createClient()
  const can = (p: string) => user.permissions.has(p)

  const [students, staff, applications, messages, term, invoices, recent] = await Promise.all([
    can('students.view') ? count('students', (q) => q.eq('status', 'active')) : null,
    can('staff.view') ? count('staff', (q) => q.eq('status', 'active')) : null,
    can('admissions.manage') ? count('applications', (q) => q.eq('status', 'applied')) : null,
    can('cms.manage') ? count('contact_messages') : null,
    supabase.from('terms').select('name, start_date, end_date, sessions(name)').eq('is_current', true).maybeSingle(),
    can('fees.view') ? supabase.from('invoices').select('total_kobo, discount_kobo, paid_kobo').neq('status', 'cancelled') : null,
    can('admissions.manage')
      ? supabase.from('applications').select('id, reference_no, first_name, last_name, class_applying_for, created_at').order('created_at', { ascending: false }).limit(5)
      : null,
  ])

  const outstanding = invoices?.data?.reduce((s, i) => s + (i.total_kobo - i.discount_kobo - i.paid_kobo), 0) ?? null
  const collected = invoices?.data?.reduce((s, i) => s + i.paid_kobo, 0) ?? null
  const currentTerm = term.data as { name: string; start_date: string; end_date: string; sessions: { name: string } | null } | null

  const stats = [
    { label: 'Active students', value: students?.toLocaleString(), href: '/admin/students' },
    { label: 'Active staff', value: staff?.toLocaleString(), href: '/admin/staff' },
    { label: 'New applications', value: applications?.toLocaleString(), href: '/admin/admissions' },
    { label: 'Fees collected', value: collected != null ? formatNaira(collected) : undefined, href: '/admin/payments' },
    { label: 'Outstanding fees', value: outstanding != null ? formatNaira(outstanding) : undefined, href: '/admin/fees' },
    { label: 'Website enquiries', value: messages?.toLocaleString(), href: '/admin/website' },
  ].filter((s) => s.value !== undefined)

  return (
    <>
      {denied && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          You do not have permission to open that page.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Welcome, {user.fullName.split(' ').find((w) => !/^(dr|mr|mrs|ms|miss|prof|engr|chief)\.?$/i.test(w)) ?? user.fullName}</h1>
        <p className="text-muted-foreground">
          {currentTerm ? `${currentTerm.sessions?.name ?? ''} ${currentTerm.name} · ${formatDate(currentTerm.start_date)} to ${formatDate(currentTerm.end_date)}` : 'No current term set.'}
        </p>
      </div>

      {stats.length > 0 && (
        <dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="flex flex-col gap-1 bg-card p-6 transition-colors hover:bg-secondary">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="font-heading text-3xl font-semibold tabular-nums">{s.value}</dd>
            </Link>
          ))}
        </dl>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {recent?.data && (
          <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">Latest applications</h2>
            {recent.data.length ? (
              <ul className="flex flex-col">
                {recent.data.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 border-b py-3 text-sm last:border-0">
                    <span className="font-medium">{a.first_name} {a.last_name}</span>
                    <span className="text-muted-foreground">{a.class_applying_for} · {formatDate(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            )}
          </section>
        )}
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Your modules</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ADMIN_MODULES.filter((m) => !m.permission || can(m.permission)).map((m) => (
              <li key={m.slug}>
                <Link href={`/admin/${m.slug}`} className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
