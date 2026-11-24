import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Portal login', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthShell
      title="Sign in to the portal"
      description="Staff, parents and students use the same login. You will be taken to the right dashboard."
    >
      <LoginForm next={next} />
    </AuthShell>
  )
}
