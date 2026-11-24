import { cn } from '@/lib/utils'

export function StudentAvatar({ src, name, size = 'md' }: { src: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const dims = { sm: 'size-8 text-xs', md: 'size-12 text-sm', lg: 'size-24 text-2xl' }[size]
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed storage URLs
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', dims)} />
  }
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground', dims)}>
      {initials}
    </span>
  )
}
