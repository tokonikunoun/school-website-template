import { requirePermission } from '@/lib/auth'
import { PageHeader, Panel } from '@/components/admin/fields'
import { StudentImporter } from '@/components/admin/student-importer'
import { IMPORT_COLUMNS } from '@/lib/student-import'

export default async function ImportStudentsPage() {
  await requirePermission('students.manage')
  return (
    <>
      <PageHeader title="Bulk import" description="Upload a CSV or Excel sheet, review every row, then confirm. Only valid rows are created." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><StudentImporter /></div>
        <Panel title="Template">
          <div className="flex flex-col gap-3 text-sm leading-relaxed">
            <p>The first row must contain these column names. Required: first_name, last_name, gender, class, arm.</p>
            <ul className="flex flex-wrap gap-1.5">
              {IMPORT_COLUMNS.map((c) => <li key={c} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{c}</li>)}
            </ul>
            <p className="text-muted-foreground">Leave admission_no blank to generate numbers. Dates use YYYY-MM-DD. Up to 1,000 rows per file.</p>
            <a href="/admin/students/import/template" className="font-medium text-primary underline underline-offset-4">Download CSV template</a>
          </div>
        </Panel>
      </div>
    </>
  )
}
