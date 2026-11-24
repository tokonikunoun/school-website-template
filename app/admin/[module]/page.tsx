import { notFound } from 'next/navigation'
import { ADMIN_MODULES } from '@/lib/admin-nav'
import { requirePermission, requireStaff } from '@/lib/auth'

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const mod = ADMIN_MODULES.find((m) => m.slug === module)
  if (!mod) notFound()
  if (mod.permission) await requirePermission(mod.permission)
  else await requireStaff()

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">{mod.label}</h1>
        <p className="text-muted-foreground">{mod.description}</p>
      </div>
      <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed bg-card p-8">
        <p className="font-medium">This module is scheduled for the next build phase.</p>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          The database tables, permissions and row-level security for {mod.label.toLowerCase()} are already in place, so the screens can be added without schema changes.
        </p>
      </div>
    </>
  )
}
