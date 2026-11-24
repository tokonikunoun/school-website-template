import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClassArms, photoSrc, signedPhotoUrls, studentName } from '@/lib/academics'
import { EmptyState, NativeSelect, PageHeader, StatusPill } from '@/components/admin/fields'
import { StudentAvatar } from '@/components/admin/student-avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { buildStudentQuery, parseStudentFilters, STUDENT_STATUSES } from '@/lib/student-filters'

const PAGE_SIZE = 25

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const filters = parseStudentFilters(params)
  const page = Math.max(1, Number(params.page) || 1)
  const supabase = await createClient()
  const arms = await getClassArms()
  const armLabel = new Map(arms.map((a) => [a.id, a.label]))

  const { data: students, count } = await buildStudentQuery(
    supabase.from('students').select('id, admission_no, first_name, middle_name, last_name, gender, class_arm_id, status, boarding_status, photo_url', { count: 'exact' }),
    filters,
  )
    .order('last_name')
    .order('first_name')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const signed = await signedPhotoUrls((students ?? []).map((s) => s.photo_url))
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const qs = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: filters.q, arm: filters.arm, status: filters.status, gender: filters.gender, ...overrides })) {
      if (v) p.set(k, String(v))
    }
    return p.toString()
  }

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} student${total === 1 ? '' : 's'} match the current filters.`}
        actions={
          <Button variant="outline" render={<a href={`/admin/students/export?${qs({})}`} />}>
            <Download aria-hidden /> Export CSV
          </Button>
        }
      />

      <form className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-end" role="search">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input name="q" defaultValue={filters.q} placeholder="Name or admission number" className="pl-9" />
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Class
          <NativeSelect name="arm" defaultValue={filters.arm} className="md:w-40">
            <option value="">All classes</option>
            {arms.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Status
          <NativeSelect name="status" defaultValue={filters.status} className="md:w-36">
            <option value="all">Any status</option>
            {STUDENT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Gender
          <NativeSelect name="gender" defaultValue={filters.gender} className="md:w-32">
            <option value="">Any</option><option value="male">Male</option><option value="female">Female</option>
          </NativeSelect>
        </label>
        <Button type="submit">Apply</Button>
      </form>

      {!students?.length ? (
        <EmptyState title="No students found">Try a different search or clear the filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                <th scope="col" className="px-4 py-3 font-medium">Admission no.</th>
                <th scope="col" className="px-4 py-3 font-medium">Class</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      <StudentAvatar src={photoSrc(s.photo_url, signed)} name={studentName(s)} size="sm" />
                      {studentName(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{s.admission_no}</td>
                  <td className="px-4 py-2.5">{s.class_arm_id ? armLabel.get(s.class_arm_id) : <span className="text-muted-foreground">None</span>}</td>
                  <td className="px-4 py-2.5 capitalize text-muted-foreground">{s.boarding_status}</td>
                  <td className="px-4 py-2.5"><StatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Button variant="outline" size="sm" render={<Link href={`/admin/students?${qs({ page: page - 1 })}`} />}>Previous</Button>}
            {page < pages && <Button variant="outline" size="sm" render={<Link href={`/admin/students?${qs({ page: page + 1 })}`} />}>Next</Button>}
          </div>
        </nav>
      )}
    </>
  )
}
