import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClassArms, getTeachingStaff } from '@/lib/academics'
import { createArm, createClass, createClassArm, deleteClassArm, updateClassArm } from '@/app/actions/academics'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { Field, NativeSelect, Panel } from '@/components/admin/fields'
import { Input } from '@/components/ui/input'

export default async function ClassesPage() {
  const supabase = await createClient()
  const [arms, teachers, { data: classes }, { data: armRows }, { data: counts }] = await Promise.all([
    getClassArms(),
    getTeachingStaff(),
    supabase.from('classes').select('id, name, level_group, sort_order').order('sort_order'),
    supabase.from('arms').select('id, name').order('name'),
    supabase.from('students').select('class_arm_id').eq('status', 'active'),
  ])
  const enrolled = new Map<string, number>()
  for (const r of counts ?? []) if (r.class_arm_id) enrolled.set(r.class_arm_id, (enrolled.get(r.class_arm_id) ?? 0) + 1)

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <Panel title="Class arms" description="Assign a form teacher and capacity for each class arm.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">Class</th>
                <th scope="col" className="py-2 pr-3 font-medium">Enrolled</th>
                <th scope="col" className="py-2 pr-3 font-medium">Form teacher</th>
                <th scope="col" className="py-2 pr-3 font-medium">Capacity</th>
                <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {arms.map((a) => {
                const n = enrolled.get(a.id) ?? 0
                const full = a.capacity != null && n >= a.capacity
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">
                      <Link href={`/admin/students?arm=${a.id}`} className="hover:underline">{a.label}</Link>
                    </td>
                    <td className={full ? 'py-2 pr-3 tabular-nums text-destructive' : 'py-2 pr-3 tabular-nums'}>
                      {n}{a.capacity ? ` / ${a.capacity}` : ''}
                    </td>
                    <td className="py-2 pr-3" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <ActionForm action={updateClassArm} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={a.id} />
                          <NativeSelect name="form_teacher_id" defaultValue={a.formTeacherId ?? ''} aria-label={`Form teacher for ${a.label}`} className="w-56">
                            <option value="">No form teacher</option>
                            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </NativeSelect>
                          <Input name="capacity" type="number" min={1} max={200} defaultValue={a.capacity ?? ''} aria-label={`Capacity for ${a.label}`} className="w-20" />
                          <SubmitButton size="sm" variant="outline">Save</SubmitButton>
                        </ActionForm>
                        {n === 0 && (
                          <ActionForm action={deleteClassArm} confirm={`Remove ${a.label}?`}>
                            <input type="hidden" name="id" value={a.id} />
                            <SubmitButton size="sm" variant="ghost">Remove</SubmitButton>
                          </ActionForm>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex flex-col gap-6">
        <Panel title="Add class arm">
          <ActionForm action={createClassArm} resetOnSuccess className="flex flex-col gap-3">
            <Field label="Class" htmlFor="ca-class">
              <NativeSelect id="ca-class" name="class_id" required>
                {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Arm" htmlFor="ca-arm">
              <NativeSelect id="ca-arm" name="arm_id" required>
                {(armRows ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Capacity" htmlFor="ca-cap"><Input id="ca-cap" name="capacity" type="number" min={1} max={200} placeholder="40" /></Field>
            <SubmitButton>Add class arm</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Add class level">
          <ActionForm action={createClass} resetOnSuccess className="flex flex-col gap-3">
            <Field label="Name" htmlFor="cl-name"><Input id="cl-name" name="name" required placeholder="SS 3" /></Field>
            <Field label="Level" htmlFor="cl-level">
              <NativeSelect id="cl-level" name="level_group"><option value="junior">Junior secondary</option><option value="senior">Senior secondary</option></NativeSelect>
            </Field>
            <Field label="Order" htmlFor="cl-order" hint="Used for sorting and promotion order."><Input id="cl-order" name="sort_order" type="number" min={0} max={99} defaultValue={(classes?.length ?? 0) + 1} /></Field>
            <SubmitButton variant="outline">Add class</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Add arm" description={`Existing: ${(armRows ?? []).map((a) => a.name).join(', ')}`}>
          <ActionForm action={createArm} resetOnSuccess className="flex items-end gap-2">
            <Field label="Arm name" htmlFor="arm-name" className="flex-1"><Input id="arm-name" name="name" required maxLength={20} placeholder="C" /></Field>
            <SubmitButton variant="outline">Add</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </div>
  )
}
