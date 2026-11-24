import { createClient } from '@/lib/supabase/server'
import { getSubjects } from '@/lib/academics'
import { createSubject, saveClassSubjects } from '@/app/actions/academics'
import { ActionForm, SubmitButton } from '@/components/admin/form'
import { Field, NativeSelect, Panel } from '@/components/admin/fields'
import { Input } from '@/components/ui/input'

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const { class: classParam } = await searchParams
  const supabase = await createClient()
  const [subjects, { data: classes }] = await Promise.all([
    getSubjects(),
    supabase.from('classes').select('id, name, level_group').order('sort_order'),
  ])
  const selected = classes?.find((c) => c.id === classParam) ?? classes?.[0]
  const { data: offered } = selected
    ? await supabase.from('class_subjects').select('subject_id, is_compulsory').eq('class_id', selected.id).is('arm_id', null)
    : { data: [] }
  const offeredMap = new Map((offered ?? []).map((o) => [o.subject_id, o.is_compulsory]))

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <Panel
        title="Subject offering by class"
        description="Tick the subjects each class offers. Compulsory subjects are taken by everyone; the rest are electives students register for."
      >
        <nav aria-label="Classes" className="flex flex-wrap gap-2">
          {(classes ?? []).map((c) => (
            <a
              key={c.id}
              href={`/admin/academics/subjects?class=${c.id}`}
              aria-current={c.id === selected?.id ? 'page' : undefined}
              className={
                c.id === selected?.id
                  ? 'rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground'
                  : 'rounded-full border px-3 py-1 text-sm hover:bg-secondary'
              }
            >
              {c.name}
            </a>
          ))}
        </nav>
        {selected && (
          <ActionForm action={saveClassSubjects} className="flex flex-col gap-4" key={selected.id}>
            <input type="hidden" name="class_id" value={selected.id} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="py-2 pr-3 font-medium">Subject</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                    <th scope="col" className="py-2 pr-3 text-center font-medium">Offered</th>
                    <th scope="col" className="py-2 text-center font-medium">Compulsory</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <span className="font-medium">{s.name}</span> <span className="text-muted-foreground">{s.code}</span>
                      </td>
                      <td className="py-2 pr-3 capitalize text-muted-foreground">{s.category}</td>
                      <td className="py-2 pr-3 text-center">
                        <input type="checkbox" name="offered" value={s.id} defaultChecked={offeredMap.has(s.id)} aria-label={`${s.name} offered in ${selected.name}`} className="size-4 accent-primary" />
                      </td>
                      <td className="py-2 text-center">
                        <input type="checkbox" name="compulsory" value={s.id} defaultChecked={offeredMap.get(s.id) === true} aria-label={`${s.name} compulsory in ${selected.name}`} className="size-4 accent-primary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div><SubmitButton>Save {selected.name} subjects</SubmitButton></div>
          </ActionForm>
        )}
      </Panel>

      <Panel title="Add subject">
        <ActionForm action={createSubject} resetOnSuccess className="flex flex-col gap-3">
          <Field label="Name" htmlFor="sub-name"><Input id="sub-name" name="name" required placeholder="Further Mathematics" /></Field>
          <Field label="Code" htmlFor="sub-code" hint="2-8 capital letters or digits"><Input id="sub-code" name="code" required maxLength={8} placeholder="FMTH" /></Field>
          <Field label="Category" htmlFor="sub-cat">
            <NativeSelect id="sub-cat" name="category">
              <option value="core">Core</option><option value="elective">Elective</option>
              <option value="religious">Religious</option><option value="vocational">Vocational</option>
            </NativeSelect>
          </Field>
          <Field label="Department" htmlFor="sub-dept"><Input id="sub-dept" name="department" placeholder="Sciences" /></Field>
          <SubmitButton>Add subject</SubmitButton>
        </ActionForm>
      </Panel>
    </div>
  )
}
