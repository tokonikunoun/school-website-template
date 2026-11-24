export type AdminNavItem = {
  slug: string
  label: string
  permission: string | null
  icon: string
  description: string
}

export type AdminNavGroup = { label: string; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ slug: '', label: 'Dashboard', permission: null, icon: 'layout', description: 'School at a glance.' }],
  },
  {
    label: 'People',
    items: [
      { slug: 'students', label: 'Students', permission: 'students.view', icon: 'users', description: 'Enrolment, profiles, guardians and class placement.' },
      { slug: 'admissions', label: 'Admissions', permission: 'admissions.manage', icon: 'inbox', description: 'Review online applications and move them through the pipeline.' },
      { slug: 'staff', label: 'Staff', permission: 'staff.view', icon: 'briefcase', description: 'Staff records, assignments and leave.' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { slug: 'academics', label: 'Classes & subjects', permission: 'academics.manage', icon: 'book', description: 'Sessions, terms, classes, arms and subject allocation.' },
      { slug: 'attendance', label: 'Attendance', permission: 'attendance.mark', icon: 'check', description: 'Daily class register.' },
      { slug: 'results', label: 'Results', permission: 'results.enter', icon: 'chart', description: 'Score entry, review, approval and publishing of term results.' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { slug: 'fees', label: 'Fees & invoices', permission: 'fees.view', icon: 'receipt', description: 'Fee structures, invoices, discounts and balances.' },
      { slug: 'payments', label: 'Payments', permission: 'payments.record', icon: 'wallet', description: 'Record payments, issue receipts and handle reversals.' },
      { slug: 'expenses', label: 'Expenses', permission: 'expenses.manage', icon: 'coins', description: 'Track school spending by category.' },
      { slug: 'payroll', label: 'Payroll', permission: 'payroll.view', icon: 'banknote', description: 'Salary structures, payroll runs, payslips and loans.' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { slug: 'announcements', label: 'Announcements', permission: 'announcements.manage', icon: 'megaphone', description: 'Notices for parents, students and staff.' },
      { slug: 'website', label: 'Website', permission: 'cms.manage', icon: 'globe', description: 'News, events, gallery, vacancies and enquiries.' },
    ],
  },
  {
    label: 'System',
    items: [
      { slug: 'users', label: 'Users & roles', permission: 'roles.manage', icon: 'shield', description: 'Portal accounts, roles and permissions.' },
      { slug: 'audit', label: 'Audit log', permission: 'audit.view', icon: 'history', description: 'Who changed what, and when.' },
      { slug: 'settings', label: 'Settings', permission: 'settings.manage', icon: 'settings', description: 'School profile, grading and portal settings.' },
    ],
  },
]

export const ADMIN_MODULES = ADMIN_NAV.flatMap((g) => g.items).filter((i) => i.slug)

export function visibleNav(permissions: Set<string>) {
  return ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || permissions.has(i.permission)) })).filter((g) => g.items.length)
}
