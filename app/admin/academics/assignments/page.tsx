import { createClient } from '@/lib/supabase/server'
import { getClassArms, getCurrentTerm, getTeachingStaff } from '@/lib/academics'
import { saveAssignments } from '@/app/actions/academics'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { EmptyState, NativeSelect, Panel } from '@/components/admin/fields'

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ arm?: string }> }) {
  const { arm } = await searchParams
  const [arms, teachers, term] = await Promise.all([getClassArms(), getTeachingStaff(), getCurrentTerm()])
  if (!term) return <EmptyState title="Set a current term first">Teacher assignments belong to the current session.</EmptyState>

  const selected = arms.find((a) => a.id === arm) ?? arms[0]
  const supabase = await createClient()
  const [{ data: offered }, { data: assigned }, { data: allAssigned }] = await Promise.all([
    supabase.from('class_subjects').select('subject_id, arm_id, is_compulsory, subjects(name, code)').eq('class_id', selected.classId),
    supabase.from('teacher_assignments').select('subject_id, staff_id').eq('class_arm_id', selected.id).eq('session_id', term.sessionId),
    supabase.from('teacher_assignments').select('class_arm_id').eq('session_id', term.sessionId),
  ])
  const current = new Map((assigned ?? []).map((a) => [a.subject_id, a.staff_id]))
  const subjects = (offered ?? [])
    .filter((o) => !o.arm_id || o.arm_id === selected.armId)
    .map((o) => ({ id: o.subject_id, compulsory: o.is_compulsory, ...(o.subjects as unknown as { name: string; code: string }) }))
    .sort((a, b) => Number(b.compulsory) - Number(a.compulsory) || a.name.localeCompare(b.name))
  const perArm = new Map<string, number>()
  for (const a of allAssigned ?? []) perArm.set(a.class_arm_id, (perArm.get(a.class_arm_id) ?? 0) + 1)

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Class arms" className="flex flex-row flex-wrap gap-1 lg:flex-col">
        {arms.map((a) => (
          <a
            key={a.id}
            href={`/admin/academics/assignments?arm=${a.id}`}
            aria-current={a.id === selected.id ? 'page' : undefined}
            className={
              a.id === selected.id
                ? 'flex items-center justify-between gap-3 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground'
                : 'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary'
            }
          >
            {a.label}
            <span className="text-xs tabular-nums opacity-80">{perArm.get(a.id) ?? 0}</span>
          </a>
        ))}
      </nav>

      <Panel
        title={`${selected.label} subject teachers`}
        description={`${term.sessionName} session · Form teacher: ${selected.formTeacherName ?? 'not assigned'}`}
      >
        {subjects.length === 0 ? (
          <EmptyState title="No subjects offered">Map subjects to {selected.className} on the Subjects tab first.</EmptyState>
        ) : (
          <ActionForm action={saveAssignments} className="flex flex-col gap-4" key={selected.id}>
            <input type="hidden" name="class_arm_id" value={selected.id} />
            <input type="hidden" name="session_id" value={term.sessionId} />
            <ul className="flex flex-col divide-y rounded-lg border">
              {subjects.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor={`as-${s.id}`} className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.code} · {s.compulsory ? 'Compulsory' : 'Elective'}</span>
                  </label>
                  <NativeSelect id={`as-${s.id}`} name={`subject:${s.id}`} defaultValue={current.get(s.id) ?? ''} className="sm:w-64">
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </NativeSelect>
                </li>
              ))}
            </ul>
            <div><SubmitButton>Save assignments</SubmitButton></div>
          </ActionForm>
        )}
      </Panel>
    </div>
  )
}
