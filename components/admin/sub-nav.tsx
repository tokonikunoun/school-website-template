'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function SubNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto print:hidden">
      <ul className="flex min-w-max gap-1 border-b px-1">
        {items.map((item) => {
          const active = item.href === pathname || (item.href !== items[0].href && pathname.startsWith(item.href))
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors',
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
