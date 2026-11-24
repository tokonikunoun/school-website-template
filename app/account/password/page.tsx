import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { ChangePasswordForm } from '@/components/auth/auth-forms'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Set a new password', robots: { index: false } }

export default async function ChangePasswordPage() {
  await requireUser()
  return (
    <AuthShell title="Set a new password" description="For your security, choose a new password before continuing.">
      <ChangePasswordForm />
    </AuthShell>
  )
}
