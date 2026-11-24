import type { ClassArm } from '@/lib/academics'
import type { ActionState } from '@/lib/action-state'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { Field, NativeSelect } from '@/components/admin/fields'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export type StudentRecord = {
  id: string; admission_no: string; first_name: string; middle_name: string | null; last_name: string; gender: string
  date_of_birth: string | null; state_of_origin: string | null; lga: string | null; religion: string | null
  blood_group: string | null; genotype: string | null; previous_school: string | null; house: string | null
  boarding_status: string; student_type: string; medical_notes: string | null; class_arm_id: string | null
  admitted_on: string | null; emergency_contacts: { name: string; phone: string }[] | null
}

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']

export function StudentForm({
  action,
  arms,
  student,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>
  arms: ClassArm[]
  student?: StudentRecord
}) {
  const s = student
  const contacts = [...(s?.emergency_contacts ?? []), { name: '', phone: '' }, { name: '', phone: '' }].slice(0, 2)

  return (
    <ActionForm action={action} className="flex flex-col gap-8">
      {s && <input type="hidden" name="id" value={s.id} />}

      <Section title="Personal details">
        <Field label="First name" htmlFor="first_name"><Input id="first_name" name="first_name" required defaultValue={s?.first_name} autoComplete="off" /></Field>
        <Field label="Middle name" htmlFor="middle_name"><Input id="middle_name" name="middle_name" defaultValue={s?.middle_name ?? ''} autoComplete="off" /></Field>
        <Field label="Surname" htmlFor="last_name"><Input id="last_name" name="last_name" required defaultValue={s?.last_name} autoComplete="off" /></Field>
        <Field label="Gender" htmlFor="gender">
          <NativeSelect id="gender" name="gender" required defaultValue={s?.gender ?? ''}>
            <option value="" disabled>Select</option><option value="female">Female</option><option value="male">Male</option>
          </NativeSelect>
        </Field>
        <Field label="Date of birth" htmlFor="date_of_birth"><Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={s?.date_of_birth ?? ''} /></Field>
        <Field label="Religion" htmlFor="religion">
          <NativeSelect id="religion" name="religion" defaultValue={s?.religion ?? ''}>
            <option value="">Not stated</option><option>Christianity</option><option>Islam</option><option>Other</option>
          </NativeSelect>
        </Field>
        <Field label="State of origin" htmlFor="state_of_origin">
          <NativeSelect id="state_of_origin" name="state_of_origin" defaultValue={s?.state_of_origin ?? ''}>
            <option value="">Select state</option>
            {STATES.map((st) => <option key={st}>{st}</option>)}
          </NativeSelect>
        </Field>
        <Field label="LGA" htmlFor="lga"><Input id="lga" name="lga" defaultValue={s?.lga ?? ''} /></Field>
      </Section>

      <Section title="School placement">
        {!s && (
          <Field label="Admission number" htmlFor="admission_no" hint="Leave blank to generate the next number.">
            <Input id="admission_no" name="admission_no" maxLength={40} />
          </Field>
        )}
        {!s && (
          <Field label="Class" htmlFor="class_arm_id">
            <NativeSelect id="class_arm_id" name="class_arm_id" required defaultValue="">
              <option value="" disabled>Select class</option>
              {arms.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </NativeSelect>
          </Field>
        )}
        <Field label="Admitted on" htmlFor="admitted_on"><Input id="admitted_on" name="admitted_on" type="date" defaultValue={s?.admitted_on ?? new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Day or boarding" htmlFor="boarding_status">
          <NativeSelect id="boarding_status" name="boarding_status" defaultValue={s?.boarding_status ?? 'day'}>
            <option value="day">Day</option><option value="boarding">Boarding</option>
          </NativeSelect>
        </Field>
        <Field label="Student type" htmlFor="student_type">
          <NativeSelect id="student_type" name="student_type" defaultValue={s?.student_type ?? 'new'}>
            <option value="new">New</option><option value="returning">Returning</option>
          </NativeSelect>
        </Field>
        <Field label="House" htmlFor="house"><Input id="house" name="house" defaultValue={s?.house ?? ''} /></Field>
        <Field label="Previous school" htmlFor="previous_school"><Input id="previous_school" name="previous_school" defaultValue={s?.previous_school ?? ''} /></Field>
      </Section>

      <Section title="Health and emergency">
        <Field label="Blood group" htmlFor="blood_group">
          <NativeSelect id="blood_group" name="blood_group" defaultValue={s?.blood_group ?? ''}>
            <option value="">Unknown</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b}>{b}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Genotype" htmlFor="genotype">
          <NativeSelect id="genotype" name="genotype" defaultValue={s?.genotype ?? ''}>
            <option value="">Unknown</option>
            {['AA','AS','AC','SS','SC','CC'].map((g) => <option key={g}>{g}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Medical notes" htmlFor="medical_notes" className="sm:col-span-2 lg:col-span-3" hint="Allergies, conditions or medication staff should know about.">
          <Textarea id="medical_notes" name="medical_notes" rows={3} maxLength={1000} defaultValue={s?.medical_notes ?? ''} />
        </Field>
        {contacts.map((c, i) => (
          <div key={i} className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-3">
            <Field label={`Emergency contact ${i + 1}`} htmlFor={`ec_name_${i}`}><Input id={`ec_name_${i}`} name="ec_name" defaultValue={c.name} placeholder="Name" /></Field>
            <Field label="Phone" htmlFor={`ec_phone_${i}`}><Input id={`ec_phone_${i}`} name="ec_phone" type="tel" defaultValue={c.phone} placeholder="080..." /></Field>
          </div>
        ))}
      </Section>

      <div><SubmitButton size="lg">{s ? 'Save changes' : 'Create student'}</SubmitButton></div>
    </ActionForm>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-base font-semibold">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  )
}
