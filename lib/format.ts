import { schoolConfig } from '@/config/school.config'

const { code, locale } = schoolConfig.currency

const money = new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 })
const moneyCompact = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: code,
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** All money is stored in kobo. */
export function formatNaira(kobo: number | string | null | undefined, opts?: { compact?: boolean }) {
  const naira = Number(kobo ?? 0) / 100
  return (opts?.compact ? moneyCompact : money).format(naira)
}

export function formatDate(value: string | Date | null | undefined, style: 'short' | 'long' = 'long') {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString(locale, style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' })
}

export function ordinal(n: number | null | undefined) {
  if (!n) return '-'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function yearsSince(year: number) {
  return new Date().getFullYear() - year
}
