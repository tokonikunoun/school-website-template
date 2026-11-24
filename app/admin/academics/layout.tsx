import { requirePermission } from '@/lib/auth'
import { SubNav } from '@/components/admin/sub-nav'
import { PageHeader } from '@/components/admin/fields'

export default async function AcademicsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission('academics.manage')
  return (
    <>
      <PageHeader title="Classes & subjects" description="Sessions and terms, class arms, subject offerings and who teaches what." />
      <SubNav
        label="Academics sections"
        items={[
          { href: '/admin/academics', label: 'Sessions & terms' },
          { href: '/admin/academics/classes', label: 'Classes & arms' },
          { href: '/admin/academics/subjects', label: 'Subjects' },
          { href: '/admin/academics/assignments', label: 'Teacher assignments' },
        ]}
      />
      {children}
    </>
  )
}
