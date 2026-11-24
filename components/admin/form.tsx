'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/action-state'

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  confirm,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  confirm?: string
}) {
  const [state, formAction] = useActionState(action, undefined)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault() } : undefined}
    >
      {children}
      <FormMessage state={state} />
    </form>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.error && !state?.message) return <p aria-live="polite" className="sr-only" />
  return (
    <p
      aria-live="polite"
      role={state.error ? 'alert' : 'status'}
      className={cn('basis-full text-sm', state.error ? 'text-destructive' : 'text-primary')}
    >
      {state.error ?? state.message}
    </p>
  )
}

export function SubmitButton({
  children,
  variant = 'default',
  size = 'default',
  className,
  name,
  value,
}: {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'xs'
  className?: string
  name?: string
  value?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className} name={name} value={value}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}
