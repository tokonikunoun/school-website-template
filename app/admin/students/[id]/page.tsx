import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { schoolConfig } from '@/config/school.config'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { getClassArms, getCurrentTerm, getSubjects, photoSrc, signedPhotoUrls, studentName } from '@/lib/academics'
import {
  addGuardian, changeStudentStatus, moveStudent, saveElectives, unlinkGuardian, updateStudent, uploadStudentPhoto,
} from '@/app/actions/students'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { Field, NativeSelect, Panel, StatusPill } from '@/components/admin/fields'
import { StudentAvatar } from '@/components/admin/student-avatar'
import { StudentForm, type StudentRecord } from '@/components/admin/student-form'
import { Input } from '@/components/ui/input'
import { STUDENT_STATUSES } from '@/lib/student-filters'

type GuardianLink = {
  relationship: string
  is_primary: boolean
  guardians: { id: string; full_name: string; phone: string | null; email: string | null; occupation: string | null } | null
}

const ACTION_LABEL: Record<string, string> = {
  enrolled: 'Enrolled', promoted: 'Promoted', repeated: 'Repeated class', moved: 'Changed class', graduated: 'Graduated', status_change: 'Status changed',
}

export default async function StudentProfilePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams])
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const user = await requirePermission('students.view')
  const canManage = user.permissions.has('students.manage')
  const supabase = await createClient()
  const term = await getCurrentTerm()

  const [{ data: student }, arms, subjects, { data: links }, { data: history }, { data: registered }] = await Promise.all([
    supabase.from('students').select('*').eq('id', id).maybeSingle(),
    getClassArms(),
    getSubjects(),
    supabase.from('student_guardians').select('relationship, is_primary, guardians(id, full_name, phone, email, occupation)').eq('student_id', id),
    supabase.from('student_class_history').select('id, action, note, from_class_arm_id, to_class_arm_id, created_at').eq('student_id', id).order('created_at', { ascending: false }).limit(30),
    term ? supabase.from('student_subjects').select('subject_id').eq('student_id', id).eq('session_id', term.sessionId) : Promise.resolve({ data: [] as { subject_id: string }[] }),
  ])
  if (!student) notFound()

  const s = student as StudentRecord & { status: string; photo_url: string | null }
  const signed = await signedPhotoUrls([s.photo_url])
  const armLabel = new Map(arms.map((a) => [a.id, a.label]))
  const guardians = (links ?? []) as unknown as GuardianLink[]
  const electives = subjects.filter((sub) => sub.category !== 'core')
  const chosen = new Set((registered ?? []).map((r) => r.subject_id))
  const name = studentName(s)

  return (
    <>
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All students
      </Link>

      {created && <p role="status" className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">Student created with admission number {s.admission_no}. Add guardians below.</p>}

      <header className="flex flex-col gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:items-center">
        <StudentAvatar src={photoSrc(s.photo_url, signed)} name={name} size="lg" />
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-balance text-2xl font-semibold">{name}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono">{s.admission_no}</span>
            <span>{s.class_arm_id ? armLabel.get(s.class_arm_id) : 'No class'}</span>
            <span className="capitalize">{s.boarding_status}</span>
            <StatusPill status={s.status} />
          </p>
        </div>
        {canManage && (
          <ActionForm action={uploadStudentPhoto} className="flex flex-col gap-2 sm:w-64">
            <input type="hidden" name="id" value={s.id} />
            <label htmlFor="photo" className="text-sm font-medium">Passport photo</label>
            <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
            <SubmitButton size="sm" variant="outline">Upload photo</SubmitButton>
          </ActionForm>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Guardians" description="Siblings share guardian records, matched by phone or email.">
            {guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guardians linked yet.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {guardians.map((g) => g.guardians && (
                  <li key={g.guardians.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span className="font-medium">
                        {g.guardians.full_name} <span className="font-normal text-muted-foreground">({g.relationship}{g.is_primary ? ', primary' : ''})</span>
                      </span>
                      <span className="text-muted-foreground">{[g.guardians.phone, g.guardians.email, g.guardians.occupation].filter(Boolean).join(' · ')}</span>
                    </div>
                    {canManage && (
                      <ActionForm action={unlinkGuardian} confirm={`Unlink ${g.guardians.full_name} from this student?`}>
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="guardian_id" value={g.guardians.id} />
                        <SubmitButton size="sm" variant="ghost">Unlink</SubmitButton>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManage && (
              <details className="mt-4 rounded-md border p-4">
                <summary className="cursor-pointer text-sm font-medium">Add a guardian</summary>
                <ActionForm action={addGuardian} resetOnSuccess className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="student_id" value={s.id} />
                  <Field label="Full name" htmlFor="g_name"><Input id="g_name" name="full_name" required /></Field>
                  <Field label="Relationship" htmlFor="g_rel">
                    <NativeSelect id="g_rel" name="relationship" defaultValue="Mother">
                      {['Mother', 'Father', 'Guardian', 'Aunt', 'Uncle', 'Grandparent', 'Sibling', 'Sponsor'].map((r) => <option key={r}>{r}</option>)}
                    </NativeSelect>
                  </Field>
                  <Field label="Phone" htmlFor="g_phone"><Input id="g_phone" name="phone" type="tel" /></Field>
                  <Field label="Email" htmlFor="g_email"><Input id="g_email" name="email" type="email" /></Field>
                  <Field label="Occupation" htmlFor="g_occ"><Input id="g_occ" name="occupation" /></Field>
                  <Field label="Address" htmlFor="g_addr"><Input id="g_addr" name="address" /></Field>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" name="is_primary" defaultChecked={guardians.length === 0} className="size-4 accent-primary" />
                    Primary contact for fees and notices
                  </label>
                  <div className="sm:col-span-2"><SubmitButton>Link guardian</SubmitButton></div>
                </ActionForm>
              </details>
            )}
          </Panel>

          {canManage ? (
            <Panel title="Student details"><StudentForm action={updateStudent} arms={arms} student={s} /></Panel>
          ) : (
            <Panel title="Student details">
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ['Gender', s.gender], ['Date of birth', s.date_of_birth], ['State of origin', s.state_of_origin], ['Religion', s.religion],
                  ['Blood group', s.blood_group], ['Genotype', s.genotype], ['House', s.house], ['Medical notes', s.medical_notes],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5"><dt className="text-muted-foreground">{k}</dt><dd className="capitalize">{v || 'Not recorded'}</dd></div>
                ))}
              </dl>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {canManage && (
            <Panel title="Change class" description="Recorded in the student's class history.">
              <ActionForm action={moveStudent} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={s.id} />
                <Field label="New class" htmlFor="move_arm">
                  <NativeSelect id="move_arm" name="class_arm_id" defaultValue={s.class_arm_id ?? ''} required>
                    <option value="" disabled>Select class</option>
                    {arms.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Reason" htmlFor="move_note"><Input id="move_note" name="note" placeholder="Optional" /></Field>
                <SubmitButton variant="outline">Move student</SubmitButton>
              </ActionForm>
            </Panel>
          )}

          {canManage && (
            <Panel title="Status">
              <ActionForm action={changeStudentStatus} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={s.id} />
                <Field label="New status" htmlFor="status">
                  <NativeSelect id="status" name="status" defaultValue={s.status}>
                    {STUDENT_STATUSES.map((st) => <option key={st} value={st} className="capitalize">{st}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Reason" htmlFor="status_note"><Input id="status_note" name="note" required minLength={3} /></Field>
                <SubmitButton variant="outline">Update status</SubmitButton>
              </ActionForm>
            </Panel>
          )}

          <Panel title="Electives" description={term ? `Registered for ${term.sessionName}.` : 'No current term is set.'}>
            {electives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No elective subjects are set up.</p>
            ) : canManage && term ? (
              <ActionForm action={saveElectives} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={s.id} />
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">Elective subjects</legend>
                  {electives.map((sub) => (
                    <label key={sub.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="subject" value={sub.id} defaultChecked={chosen.has(sub.id)} className="size-4 accent-primary" />
                      {sub.name} <span className="text-xs capitalize text-muted-foreground">{sub.category}</span>
                    </label>
                  ))}
                </fieldset>
                <SubmitButton variant="outline">Save electives</SubmitButton>
              </ActionForm>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {electives.filter((e) => chosen.has(e.id)).map((e) => <li key={e.id}>{e.name}</li>)}
                {chosen.size === 0 && <li className="text-muted-foreground">None registered.</li>}
              </ul>
            )}
          </Panel>

          <Panel title="Class history">
            {!history?.length ? (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            ) : (
              <ol className="flex flex-col gap-3 border-l pl-4">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">
                      {ACTION_LABEL[h.action] ?? h.action}
                      {h.to_class_arm_id && ` to ${armLabel.get(h.to_class_arm_id) ?? 'a class'}`}
                    </span>
                    {h.note && <span className="text-muted-foreground">{h.note}</span>}
                    <time dateTime={h.created_at} className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString(schoolConfig.locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
