import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { requireStaff } from '@/lib/auth'
import { visibleNav } from '@/lib/admin-nav'
import { ROLE_LABELS } from '@/lib/roles'
import { schoolConfig } from '@/config/school.config'

export const metadata: Metadata = { title: 'Admin', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  return (
    <SidebarProvider>
      <AdminSidebar
        groups={visibleNav(user.permissions)}
        schoolName={schoolConfig.shortName}
        logo={schoolConfig.branding.logo}
        user={{ name: user.fullName, role: ROLE_LABELS[user.role] ?? user.role }}
      />
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <p className="text-sm text-muted-foreground">{schoolConfig.name}</p>
        </header>
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
