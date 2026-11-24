'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck, Banknote, BookOpen, Briefcase, ChartColumn, Coins, Globe, History, Inbox, LayoutDashboard, LogOut,
  Megaphone, Receipt, Settings, Shield, Users, Wallet, type LucideIcon,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { AdminNavGroup } from '@/lib/admin-nav'
import { signOut } from '@/app/actions/auth'

const ICONS: Record<string, LucideIcon> = {
  layout: LayoutDashboard, users: Users, inbox: Inbox, briefcase: Briefcase, book: BookOpen, check: BadgeCheck,
  chart: ChartColumn, receipt: Receipt, wallet: Wallet, coins: Coins, banknote: Banknote, megaphone: Megaphone,
  globe: Globe, shield: Shield, history: History, settings: Settings,
}

export function AdminSidebar({ groups, schoolName, logo, user }: { groups: AdminNavGroup[]; schoolName: string; logo: string; user: { name: string; role: string } }) {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-3 px-2 py-2">
          <Image src={logo} alt="" width={36} height={36} className="rounded-md" />
          <span className="font-heading text-sm font-semibold leading-tight">{schoolName}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const href = item.slug ? `/admin/${item.slug}` : '/admin'
                  const active = item.slug ? pathname.startsWith(href) : pathname === '/admin'
                  const Icon = ICONS[item.icon] ?? LayoutDashboard
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton isActive={active} render={<Link href={href} />}>
                        <Icon aria-hidden />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-1 px-2 py-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/70">{user.role}</p>
        </div>
        <form action={signOut}>
          <SidebarMenuButton type="submit">
            <LogOut aria-hidden />
            <span>Sign out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
