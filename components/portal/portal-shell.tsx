import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'
import { schoolConfig } from '@/config/school.config'

export function PortalShell({ title, userName, children }: { title: string; userName: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src={schoolConfig.branding.logo} alt="" width={36} height={36} className="rounded-md" />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-semibold">{schoolConfig.shortName}</span>
              <span className="text-xs text-muted-foreground">{title}</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{userName}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">{children}</main>
    </div>
  )
}

export function ComingSoon({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i} className="flex flex-col gap-1 rounded-lg border bg-card p-5">
          <span className="font-medium">{i}</span>
          <span className="text-sm text-muted-foreground">Available in the next build phase.</span>
        </li>
      ))}
    </ul>
  )
}
