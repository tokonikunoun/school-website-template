import { requirePermission } from '@/lib/auth'
import { SubNav } from '@/components/admin/sub-nav'

export default async function StudentsLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission('students.view')
  const canManage = user.permissions.has('students.manage')
  const items = [{ href: '/admin/students', label: 'All students' }]
  if (canManage) {
    items.push(
      { href: '/admin/students/new', label: 'Add student' },
      { href: '/admin/students/import', label: 'Bulk import' },
      { href: '/admin/students/promotion', label: 'Promotion' },
    )
  }
  return (
    <>
      <SubNav label="Student sections" items={items} />
      {children}
    </>
  )
}
