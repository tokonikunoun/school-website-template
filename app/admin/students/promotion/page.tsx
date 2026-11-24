import { requirePermission } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getClassArms, studentName } from '@/lib/academics'
import { promoteStudents } from '@/app/actions/students'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { EmptyState, Field, NativeSelect, PageHeader, Panel } from '@/components/admin/fields'
import { Button } from '@/components/ui/button'

const CHOICES = [
  { value: 'promote', label: 'Promote' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'skip', label: 'Skip' },
] as const

export default async function PromotionPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requirePermission('students.manage')
  const { from } = await searchParams
  const arms = await getClassArms()
  const source = arms.find((a) => a.id === from)

  let students: { id: string; admission_no: string; first_name: string; middle_name: string | null; last_name: string }[] = []
  if (source) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('students')
      .select('id, admission_no, first_name, middle_name, last_name')
      .eq('class_arm_id', source.id)
      .eq('status', 'active')
      .order('last_name')
    students = data ?? []
  }

  const sourceIndex = source ? arms.indexOf(source) : -1
  const suggested = source
    ? arms.find((a, i) => i > sourceIndex && a.sortOrder > source.sortOrder && a.armName === source.armName)
      ?? arms.find((a) => a.sortOrder > source.sortOrder)
    : undefined
  const isFinalClass = source ? !arms.some((a) => a.sortOrder > source.sortOrder) : false

  return (
    <>
      <PageHeader title="End-of-session promotion" description="Move a whole class at once. Each student can be promoted, held back or graduated, and every move is logged." />

      <form className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <Field label="Class to process" htmlFor="from" className="sm:w-64">
          <NativeSelect id="from" name="from" defaultValue={source?.id ?? ''} required>
            <option value="" disabled>Select class</option>
            {arms.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </NativeSelect>
        </Field>
        <Button type="submit" variant="outline">Load students</Button>
      </form>

      {source && (students.length === 0 ? (
        <EmptyState title={`No active students in ${source.label}`} />
      ) : (
        <Panel title={`${source.label}: ${students.length} active student(s)`}>
          <ActionForm action={promoteStudents} className="flex flex-col gap-5" confirm={`Apply these changes to ${students.length} student(s) in ${source.label}?`}>
            <input type="hidden" name="from_arm" value={source.id} />
            <Field label="Promote to" htmlFor="default_target" className="sm:w-64" hint={isFinalClass ? 'This is the final class. Choose Graduate for leavers.' : undefined}>
              <NativeSelect id="default_target" name="default_target" defaultValue={suggested?.id ?? ''}>
                <option value="">Select class</option>
                {arms.filter((a) => a.id !== source.id).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </NativeSelect>
            </Field>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Student</th>
                    {CHOICES.map((c) => <th key={c.value} scope="col" className="px-3 py-2.5 text-center font-medium">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const name = studentName(s)
                    return (
                      <tr key={s.id} className="border-t">
                        <th scope="row" className="px-4 py-2 text-left font-normal">
                          <span className="font-medium">{name}</span> <span className="font-mono text-xs text-muted-foreground">{s.admission_no}</span>
                        </th>
                        {CHOICES.map((c) => (
                          <td key={c.value} className="px-3 py-2 text-center">
                            <input
                              type="radio"
                              name={`action:${s.id}`}
                              value={c.value}
                              defaultChecked={c.value === (isFinalClass ? 'graduate' : 'promote')}
                              aria-label={`${c.label} ${name}`}
                              className="size-4 accent-primary"
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div><SubmitButton>Apply promotion</SubmitButton></div>
          </ActionForm>
        </Panel>
      ))}
    </>
  )
}
