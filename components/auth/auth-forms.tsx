'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword, requestPasswordReset, signIn, type FormState } from '@/app/actions/auth'

function FormMessage({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    )
  if (state?.success)
    return (
      <p role="status" className="rounded-md bg-secondary px-3 py-2 text-sm text-foreground">
        {state.success}
      </p>
    )
  return null
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined)
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ''} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined)
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="h-11" />
        <p className="text-sm text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="h-11" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? 'Saving…' : 'Save password'}
      </Button>
    </form>
  )
}
