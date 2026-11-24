import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'

export default function AuthErrorPage() {
  return (
    <AuthShell title="That link did not work" description="The link may have expired or already been used. Request a new one and try again.">
      <div className="flex gap-4 text-sm">
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Request a new link
        </Link>
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}
