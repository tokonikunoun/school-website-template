import { Lock, LockOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { createSession, createTerm, setCurrentTerm, setTermLock, updateTerm } from '@/app/actions/academics'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { Field, NativeSelect, Panel } from '@/components/admin/fields'
import { Input } from '@/components/ui/input'

type Term = {
  id: string; name: string; term_number: number; start_date: string; end_date: string
  next_term_begins: string | null; school_days: number | null; is_current: boolean; is_locked: boolean
}

export default async function SessionsPage() {
  const user = await requirePermission('academics.manage')
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, start_date, end_date, is_current, terms(id, name, term_number, start_date, end_date, next_term_begins, school_days, is_current, is_locked)')
    .order('start_date', { ascending: false })
  const isSuper = user.role === 'super_admin'

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        {(sessions ?? []).map((s) => {
          const terms = ((s.terms ?? []) as Term[]).sort((a, b) => a.term_number - b.term_number)
          return (
            <Panel
              key={s.id}
              title={`${s.name} session`}
              description={`${formatDate(s.start_date)} to ${formatDate(s.end_date)}`}
              actions={s.is_current ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Current session</span> : null}
            >
              {terms.length === 0 && <p className="text-sm text-muted-foreground">No terms yet. Add one below.</p>}
              <ul className="flex flex-col divide-y rounded-lg border">
                {terms.map((t) => (
                  <li key={t.id} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.is_current && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Current</span>}
                        {t.is_locked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <Lock className="size-3" aria-hidden /> Locked
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(t.start_date)} to {formatDate(t.end_date)}
                          {t.school_days ? ` · ${t.school_days} school days` : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!t.is_current && (
                          <ActionForm action={setCurrentTerm} className="flex items-center" confirm={`Make ${s.name} ${t.name} the current term for the whole school?`}>
                            <input type="hidden" name="id" value={t.id} />
                            <SubmitButton size="sm" variant="outline">Make current</SubmitButton>
                          </ActionForm>
                        )}
                        {(!t.is_locked || isSuper) && (
                          <ActionForm
                            action={setTermLock}
                            className="flex items-center"
                            confirm={t.is_locked ? 'Unlock this term? Results and dates become editable again.' : 'Lock this term? Dates and results will be frozen; only a Super Admin can unlock it.'}
                          >
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="lock" value={String(!t.is_locked)} />
                            <SubmitButton size="sm" variant="ghost">
                              {t.is_locked ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
                              {t.is_locked ? 'Unlock' : 'Lock'}
                            </SubmitButton>
                          </ActionForm>
                        )}
                      </div>
                    </div>
                    {!t.is_locked && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-primary">Edit dates</summary>
                        <ActionForm action={updateTerm} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <input type="hidden" name="id" value={t.id} />
                          <TermFields term={t} prefix={t.id} />
                          <div className="flex items-end"><SubmitButton size="sm">Save term</SubmitButton></div>
                        </ActionForm>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
              {terms.length < 3 && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-primary">Add a term to {s.name}</summary>
                  <ActionForm action={createTerm} resetOnSuccess className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input type="hidden" name="session_id" value={s.id} />
                    <TermFields prefix={`new-${s.id}`} defaultNumber={terms.length + 1} />
                    <div className="flex items-end"><SubmitButton size="sm">Add term</SubmitButton></div>
                  </ActionForm>
                </details>
              )}
            </Panel>
          )
        })}
      </div>

      <Panel title="New session" description="Optionally create three terms with suggested dates you can adjust.">
        <ActionForm action={createSession} resetOnSuccess className="flex flex-col gap-3">
          <Field label="Session name" htmlFor="session-name" hint="For example 2027/2028">
            <Input id="session-name" name="name" required pattern="\d{4}/\d{4}" placeholder="2027/2028" />
          </Field>
          <Field label="Start date" htmlFor="session-start"><Input id="session-start" name="start_date" type="date" required /></Field>
          <Field label="End date" htmlFor="session-end"><Input id="session-end" name="end_date" type="date" required /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="with_terms" defaultChecked className="size-4 accent-primary" /> Create First, Second and Third term
          </label>
          <SubmitButton>Create session</SubmitButton>
        </ActionForm>
      </Panel>
    </div>
  )
}

function TermFields({ term, prefix, defaultNumber }: { term?: Term; prefix: string; defaultNumber?: number }) {
  const names = ['First Term', 'Second Term', 'Third Term']
  return (
    <>
      <Field label="Name" htmlFor={`${prefix}-name`}>
        <Input id={`${prefix}-name`} name="name" required defaultValue={term?.name ?? names[(defaultNumber ?? 1) - 1]} />
      </Field>
      <Field label="Term number" htmlFor={`${prefix}-num`}>
        <NativeSelect id={`${prefix}-num`} name="term_number" defaultValue={String(term?.term_number ?? defaultNumber ?? 1)}>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </NativeSelect>
      </Field>
      <Field label="School days" htmlFor={`${prefix}-days`}>
        <Input id={`${prefix}-days`} name="school_days" type="number" min={1} max={200} defaultValue={term?.school_days ?? ''} />
      </Field>
      <Field label="Start date" htmlFor={`${prefix}-start`}>
        <Input id={`${prefix}-start`} name="start_date" type="date" required defaultValue={term?.start_date} />
      </Field>
      <Field label="End date" htmlFor={`${prefix}-end`}>
        <Input id={`${prefix}-end`} name="end_date" type="date" required defaultValue={term?.end_date} />
      </Field>
      <Field label="Next term begins" htmlFor={`${prefix}-next`}>
        <Input id={`${prefix}-next`} name="next_term_begins" type="date" defaultValue={term?.next_term_begins ?? ''} />
      </Field>
    </>
  )
}
