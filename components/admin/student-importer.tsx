'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import { importStudents, type ImportState } from '@/app/actions/students'
import { SubmitButton } from '@/components/admin/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toCsv } from '@/lib/csv'

export function StudentImporter() {
  const [state, action] = useActionState<ImportState, FormData>(importStudents, undefined)
  const [formKey, setFormKey] = useState(0)

  const downloadErrors = () => {
    if (state?.stage !== 'preview') return
    const cols = Object.keys(state.errors[0]?.values ?? {})
    const csv = toCsv([['row', 'field', 'error', ...cols], ...state.errors.map((e) => [e.row, e.field, e.message, ...cols.map((c) => e.values[c])])])
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (state?.stage === 'done') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6" role="status">
        <CheckCircle2 className="size-6 text-primary" aria-hidden />
        <p className="text-lg font-semibold">{state.created} student(s) imported</p>
        <p className="text-sm text-muted-foreground">{state.guardians} guardian link(s) created. Each student has an enrolment entry in class history.</p>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/students" />}>View students</Button>
          <Button variant="outline" onClick={() => setFormKey((k) => k + 1)}>Import another file</Button>
        </div>
      </div>
    )
  }

  const preview = state?.stage === 'preview' ? state : null

  return (
    <form key={formKey} action={action} className="flex flex-col gap-6 rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="file" className="text-sm font-medium">Spreadsheet (.csv or .xlsx, max 5 MB)</label>
        <Input id="file" name="file" type="file" accept=".csv,.xlsx" required />
        <p className="text-xs text-muted-foreground">Keep this file selected; confirming re-checks it on the server before anything is saved.</p>
      </div>

      {state?.stage === 'error' && <p role="alert" className="text-sm text-destructive">{state.error}</p>}

      {preview && (
        <section aria-label="Import preview" className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Rows in file" value={preview.total} />
            <Stat label="Ready to import" value={preview.validCount} tone="good" />
            <Stat label="Rows with errors" value={new Set(preview.errors.map((e) => e.row)).size} tone={preview.errors.length ? 'bad' : undefined} />
          </div>

          {preview.sample.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">First valid rows</h3>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {preview.sample.map((r, i) => <li key={i}>{r.name} <span className="text-muted-foreground">({r.className})</span></li>)}
              </ul>
            </div>
          )}

          {preview.errors.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="size-4" aria-hidden /> Errors (these rows will be skipped)</h3>
                <Button type="button" variant="outline" size="sm" onClick={downloadErrors}><Download aria-hidden /> Error report</Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left">
                    <tr><th scope="col" className="px-3 py-2 font-medium">Row</th><th scope="col" className="px-3 py-2 font-medium">Field</th><th scope="col" className="px-3 py-2 font-medium">Problem</th></tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((e, i) => (
                      <tr key={i} className="border-t"><td className="px-3 py-1.5 font-mono">{e.row}</td><td className="px-3 py-1.5 font-mono text-xs">{e.field}</td><td className="px-3 py-1.5">{e.message}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton variant={preview ? 'outline' : 'default'}>{preview ? 'Re-check file' : 'Check file'}</SubmitButton>
        {preview && preview.validCount > 0 && (
          <SubmitButton name="confirm" value="yes">Import {preview.validCount} student(s)</SubmitButton>
        )}
      </div>
    </form>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={tone === 'good' ? 'text-2xl font-semibold text-primary' : tone === 'bad' ? 'text-2xl font-semibold text-destructive' : 'text-2xl font-semibold'}>{value}</span>
    </div>
  )
}
