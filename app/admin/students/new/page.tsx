import { requirePermission } from '@/lib/auth'
import { getClassArms } from '@/lib/academics'
import { createStudent } from '@/app/actions/students'
import { PageHeader, Panel } from '@/components/admin/fields'
import { StudentForm } from '@/components/admin/student-form'

export default async function NewStudentPage() {
  await requirePermission('students.manage')
  const arms = await getClassArms()
  return (
    <>
      <PageHeader title="Add student" description="Guardians, photo and electives can be added from the profile after saving." />
      <Panel><StudentForm action={createStudent} arms={arms} /></Panel>
    </>
  )
}
