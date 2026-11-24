import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { schoolConfig } from '@/config/school.config'

export function AnnouncementBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-accent text-ink">
      <p className="mx-auto max-w-7xl px-6 py-2 text-center text-sm">
        <span className="font-semibold">{title}</span>
        <span className="hidden sm:inline"> — {body}</span>
      </p>
    </div>
  )
}

export function WhatsAppButton() {
  if (!schoolConfig.whatsapp) return null
  return (
    <a
      href={`https://wa.me/${schoolConfig.whatsapp}?text=${encodeURIComponent(`Hello ${schoolConfig.name}, I would like to make an enquiry.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span>Chat on WhatsApp</span>
    </a>
  )
}

export function PageHeader({ eyebrow, title, description, image }: { eyebrow?: string; title: string; description?: string; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      {image && (
        <>
          <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-30" priority />
        </>
      )}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-6 py-16 md:py-24">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl font-semibold text-balance md:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-lg leading-relaxed text-pretty opacity-85">{description}</p>}
      </div>
    </section>
  )
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  tone = 'default',
}: {
  id?: string
  eyebrow?: string
  title?: string
  description?: string
  children: React.ReactNode
  tone?: 'default' | 'muted'
}) {
  return (
    <section id={id} className={tone === 'muted' ? 'bg-secondary' : undefined}>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 md:py-20">
        {(title || eyebrow) && (
          <div className="flex max-w-2xl flex-col gap-3">
            {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-semibold text-balance md:text-4xl">{title}</h2>}
            {description && <p className="leading-relaxed text-pretty text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
