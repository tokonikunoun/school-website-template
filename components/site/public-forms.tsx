'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  checkApplicationStatus,
  checkResult,
  submitAdmission,
  submitContact,
  submitJobApplication,
  type PublicFormState,
} from '@/app/actions/public'
import { schoolConfig } from '@/config/school.config'

const selectClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  autoComplete,
  hint,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  defaultValue?: string
  autoComplete?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} autoComplete={autoComplete} className="h-11" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Status({ state }: { state: { error?: string; success?: string } | undefined }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    )
  if (state?.success)
    return (
      <p role="status" className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
        {state.success}
      </p>
    )
  return null
}

export function ContactForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitContact, undefined)
  const v = state?.values ?? {}
  if (state?.success) return <Status state={state} />
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Full name" required defaultValue={v.name} autoComplete="name" />
        <Field name="phone" label="Phone" type="tel" defaultValue={v.phone} autoComplete="tel" />
      </div>
      <Field name="email" label="Email" type="email" defaultValue={v.email} autoComplete="email" />
      <Field name="subject" label="Subject" defaultValue={v.subject} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">
          Message<span className="text-destructive" aria-hidden> *</span>
        </Label>
        <Textarea id="message" name="message" required rows={5} defaultValue={v.message} />
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending} className="h-11 self-start px-6">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}

export function JobApplicationForm({ vacancies }: { vacancies: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitJobApplication, undefined)
  const v = state?.values ?? {}
  if (state?.success) return <Status state={state} />
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="vacancy_id">Position</Label>
        <select id="vacancy_id" name="vacancy_id" defaultValue={v.vacancy_id ?? ''} className={selectClass}>
          <option value="">General application</option>
          {vacancies.map((vac) => (
            <option key={vac.id} value={vac.id}>
              {vac.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="full_name" label="Full name" required defaultValue={v.full_name} autoComplete="name" />
        <Field name="email" label="Email" type="email" required defaultValue={v.email} autoComplete="email" />
        <Field name="phone" label="Phone" type="tel" defaultValue={v.phone} autoComplete="tel" />
        <Field name="qualification" label="Highest qualification" defaultValue={v.qualification} hint="e.g. B.Sc. Ed Chemistry, TRCN" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cover_letter">Cover letter</Label>
        <Textarea id="cover_letter" name="cover_letter" rows={6} defaultValue={v.cover_letter} />
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending} className="h-11 self-start px-6">
        {pending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  )
}

export function AdmissionForm({ examDates }: { examDates: readonly string[] }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitAdmission, undefined)
  const v = state?.values ?? {}

  if (state?.reference)
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg border bg-background p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Application submitted</p>
        <p className="font-heading text-3xl font-semibold">{state.reference}</p>
        <p className="leading-relaxed text-muted-foreground">
          Keep this reference. Use it below to check your application status. Our admissions office will contact you
          about payment of the application fee and the entrance examination.
        </p>
      </div>
    )

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-heading text-xl font-semibold">Student details</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="first_name" label="First name" required defaultValue={v.first_name} />
          <Field name="middle_name" label="Middle name" defaultValue={v.middle_name} />
          <Field name="last_name" label="Surname" required defaultValue={v.last_name} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gender">
              Gender<span className="text-destructive" aria-hidden> *</span>
            </Label>
            <select id="gender" name="gender" required defaultValue={v.gender ?? ''} className={selectClass}>
              <option value="" disabled>Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <Field name="date_of_birth" label="Date of birth" type="date" required defaultValue={v.date_of_birth} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="class_applied">
              Class applying for<span className="text-destructive" aria-hidden> *</span>
            </Label>
            <select id="class_applied" name="class_applied" required defaultValue={v.class_applied ?? ''} className={selectClass}>
              <option value="" disabled>Select</option>
              {schoolConfig.academics.levels.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="previous_school" label="Current / previous school" defaultValue={v.previous_school} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="boarding_status">Day or boarding</Label>
            <select id="boarding_status" name="boarding_status" defaultValue={v.boarding_status ?? 'day'} className={selectClass}>
              <option value="day">Day</option>
              {schoolConfig.features.boarding && <option value="boarding">Boarding</option>}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exam_date">Preferred exam date</Label>
            <select id="exam_date" name="exam_date" defaultValue={v.exam_date ?? ''} className={selectClass}>
              <option value="">No preference</option>
              {examDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-heading text-xl font-semibold">Parent or guardian</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="guardian_name" label="Full name" required defaultValue={v.guardian_name} autoComplete="name" />
          <Field name="guardian_relationship" label="Relationship" defaultValue={v.guardian_relationship} hint="e.g. Father, Mother, Guardian" />
          <Field name="guardian_phone" label="Phone" type="tel" required defaultValue={v.guardian_phone} autoComplete="tel" />
          <Field name="guardian_email" label="Email" type="email" defaultValue={v.guardian_email} autoComplete="email" />
        </div>
        <Field name="guardian_address" label="Home address" defaultValue={v.guardian_address} autoComplete="street-address" />
      </fieldset>

      <Status state={state} />
      <Button type="submit" disabled={pending} className="h-11 self-start px-8">
        {pending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  )
}

const statusLabels: Record<string, string> = {
  applied: 'Received',
  screened: 'Screened',
  entrance_exam: 'Entrance exam scheduled',
  offered: 'Admission offered',
  accepted: 'Offer accepted',
  enrolled: 'Enrolled',
  rejected: 'Not successful',
}

export function ApplicationStatusForm() {
  const [state, action, pending] = useActionState(checkApplicationStatus, undefined)
  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="reference">Application reference</Label>
          <Input id="reference" name="reference" required placeholder="BFC-APP-2026-00001" className="h-11" />
        </div>
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? 'Checking…' : 'Check status'}
        </Button>
      </form>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.result && (
        <dl role="status" className="grid gap-4 rounded-lg border bg-background p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Applicant</dt>
            <dd className="font-medium">{state.result.applicant}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Class</dt>
            <dd className="font-medium">{state.result.class_applied}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
            <dd className="font-medium text-primary">{statusLabels[state.result.status] ?? state.result.status}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}

export function ResultCheckerForm() {
  const [state, action, pending] = useActionState(checkResult, undefined)
  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="grid gap-5 sm:grid-cols-3">
        <Field name="admission_no" label="Admission number" required hint="e.g. BFC/2024/0001" />
        <Field name="serial" label="Card serial" required />
        <Field name="pin" label="PIN" type="password" required />
        <div className="sm:col-span-3">
          <Button type="submit" disabled={pending} className="h-11 px-8">
            {pending ? 'Checking…' : 'Check result'}
          </Button>
        </div>
      </form>
      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.result && (
        <div role="status" className="flex flex-col gap-4 rounded-lg border bg-background p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-heading text-2xl font-semibold">{state.result.student}</p>
              <p className="text-sm text-muted-foreground">
                {state.result.admission_no} · {state.result.term}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Average <span className="font-semibold text-foreground">{state.result.average ?? '-'}</span>
              {state.result.position && (
                <>
                  {' '}· Position <span className="font-semibold text-foreground">{state.result.position}</span> of {state.result.number_in_class}
                </>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="py-2 font-medium">Subject</th>
                  <th scope="col" className="py-2 text-right font-medium">CA</th>
                  <th scope="col" className="py-2 text-right font-medium">Exam</th>
                  <th scope="col" className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.result.subjects.map((s) => (
                  <tr key={s.subject} className="border-b last:border-0">
                    <td className="py-2">{s.subject}</td>
                    <td className="py-2 text-right tabular-nums">{s.ca}</td>
                    <td className="py-2 text-right tabular-nums">{s.exam}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Checks remaining on this card: {state.result.uses_left}</p>
        </div>
      )}
    </div>
  )
}
