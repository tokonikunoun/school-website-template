import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export const controlClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'

export function Field({ label, htmlFor, hint, className, children }: { label: string; htmlFor: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(controlClass, 'pr-8', className)} {...props} />
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-3xl font-semibold">{title}</h1>
        {description && <p className="text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  )
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-lg border bg-card p-4 md:p-6', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    active: 'bg-primary/10 text-primary',
    graduated: 'bg-secondary text-secondary-foreground',
    suspended: 'bg-destructive/10 text-destructive',
    withdrawn: 'bg-muted text-muted-foreground',
    transferred: 'bg-muted text-muted-foreground',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone[status] ?? 'bg-muted text-muted-foreground')}>{status}</span>
}
