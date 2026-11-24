import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="Enter the email address on your portal account and we will send you a reset link.">
      <ForgotPasswordForm />
      <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </AuthShell>
  )
}
