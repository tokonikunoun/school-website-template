'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Phone, X } from 'lucide-react'
import { schoolConfig } from '@/config/school.config'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const nav = schoolConfig.website.navigation

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="hidden bg-ink text-ink-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-sm">
          <p>{schoolConfig.motto}</p>
          <div className="flex items-center gap-6">
            <a href={`tel:${schoolConfig.phones[0].replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-accent">
              <Phone className="size-3.5" aria-hidden />
              {schoolConfig.phones[0]}
            </a>
            {schoolConfig.features.resultChecker && (
              <Link href="/results" className="hover:text-accent">
                Check result
              </Link>
            )}
            {schoolConfig.features.careers && (
              <Link href="/careers" className="hover:text-accent">
                Careers
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image src={schoolConfig.branding.logo} alt="" width={44} height={44} className="rounded-md" priority />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">{schoolConfig.name}</span>
            <span className="text-xs text-muted-foreground">
              {schoolConfig.address.city}, {schoolConfig.address.state}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary',
                      active && 'text-primary',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
            Portal login
          </Link>
          <Link href="/admissions#apply" className={buttonVariants()}>
            Apply now
          </Link>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-md hover:bg-secondary lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-6 py-3">
            {[...nav, { label: 'Check result', href: '/results' }, { label: 'Careers', href: '/careers' }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block border-b py-3 font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 pt-4">
              <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
                Portal login
              </Link>
              <Link href="/admissions#apply" onClick={() => setOpen(false)} className={cn(buttonVariants(), 'flex-1')}>
                Apply now
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
