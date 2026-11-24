import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { schoolConfig } from '@/config/school.config'
import { buttonVariants } from '@/components/ui/button'
import { Section } from '@/components/site/site-chrome'
import { formatDate, formatNaira, yearsSince } from '@/lib/format'
import { cn } from '@/lib/utils'

const site = schoolConfig.website

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      <Image src={schoolConfig.branding.heroImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
      <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-end gap-8 px-6 pt-24 pb-16 md:pb-24">
        <p className="w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-ink">{site.hero.eyebrow}</p>
        <h1 className="max-w-4xl text-5xl leading-tight font-semibold text-balance md:text-7xl">{site.hero.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-pretty opacity-90">{site.hero.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admissions#apply" className={cn(buttonVariants({ size: 'lg' }), 'h-12 bg-accent px-6 text-base text-ink hover:bg-accent/90')}>
            Apply for admission
          </Link>
          <Link
            href="/contact"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 border-ink-foreground/40 bg-transparent px-6 text-base text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground')}
          >
            Book a school tour
          </Link>
        </div>
      </div>
    </section>
  )
}

export function StatsSection({ students, teachers }: { students: number; teachers: number }) {
  const items = [
    site.stats.yearsOfExcellence && { value: `${yearsSince(schoolConfig.foundedYear)}`, label: `Years since ${schoolConfig.foundedYear}` },
    { value: students > 0 ? `${students}` : '—', label: 'Students enrolled' },
    { value: teachers > 0 ? `${teachers}` : '—', label: 'Qualified teachers' },
    site.stats.passRate && { value: site.stats.passRate.value, label: site.stats.passRate.label },
  ].filter(Boolean) as { value: string; label: string }[]

  return (
    <section aria-label="School at a glance" className="border-b">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 border-r border-b px-6 py-8 last:border-r-0 lg:border-b-0">
            <dt className="order-2 text-sm leading-snug text-muted-foreground">{s.label}</dt>
            <dd className="order-1 font-heading text-4xl font-semibold text-primary">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function WelcomeSection() {
  const p = site.principal
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg md:col-span-2">
          <Image src={p.photo} alt={`${p.name}, ${p.title}`} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-6 md:col-span-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Welcome from the {p.title}</p>
          <blockquote className="font-heading text-2xl leading-relaxed text-pretty md:text-3xl">{p.message}</blockquote>
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.title}</p>
          </div>
          <Link href="/about" className="flex w-fit items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">
            Read about our history <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Section>
  )
}

export function WhySection() {
  return (
    <Section tone="muted" eyebrow="Why families choose us" title={`What makes ${schoolConfig.shortName} different`}>
      <ul className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {site.whyChooseUs.map((w) => (
          <li key={w.title} className="flex flex-col gap-2 bg-background p-6">
            <h3 className="font-heading text-xl font-semibold">{w.title}</h3>
            <p className="leading-relaxed text-muted-foreground">{w.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function ProgrammesSection() {
  const junior = schoolConfig.academics.levels.filter((l) => l.group === 'junior').map((l) => l.name)
  const senior = schoolConfig.academics.levels.filter((l) => l.group === 'senior').map((l) => l.name)
  return (
    <Section eyebrow="Academics" title="Junior and senior secondary" description={`Following the ${schoolConfig.academics.curricula.join(', ')} curricula with strong exam preparation.`}>
      <div className="grid gap-6 md:grid-cols-2">
        {junior.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-6">
            <p className="text-sm font-medium text-muted-foreground">{junior.join(' · ')}</p>
            <h3 className="font-heading text-2xl font-semibold">Junior Secondary</h3>
            <p className="leading-relaxed text-muted-foreground">
              A broad foundation across English, Mathematics, Basic Science and Technology, Social Studies, Business Studies,
              Cultural and Creative Arts, French and a Nigerian language, ending with the BECE.
            </p>
          </div>
        )}
        {senior.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border p-6">
            <p className="text-sm font-medium text-muted-foreground">{senior.join(' · ')}</p>
            <h3 className="font-heading text-2xl font-semibold">Senior Secondary</h3>
            <p className="leading-relaxed text-muted-foreground">
              Students specialise in {schoolConfig.academics.departments.map((d) => d.name).join(', ')} and sit WASSCE,
              NECO and JAMB with dedicated CBT practice.
            </p>
          </div>
        )}
      </div>
      <Link href="/academics" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
        Explore academics
      </Link>
    </Section>
  )
}

type NewsItem = { id: string; slug: string; title: string; excerpt: string | null; cover_url: string | null; category: string | null; published_at: string | null }

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group flex flex-col gap-4">
      <Link href={`/news/${item.slug}`} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-muted">
        {item.cover_url && (
          <Image src={item.cover_url} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {item.category ?? 'News'} · <time dateTime={item.published_at ?? undefined}>{formatDate(item.published_at)}</time>
        </p>
        <h3 className="font-heading text-xl font-semibold text-balance">
          <Link href={`/news/${item.slug}`} className="hover:underline">
            {item.title}
          </Link>
        </h3>
        {item.excerpt && <p className="line-clamp-3 leading-relaxed text-muted-foreground">{item.excerpt}</p>}
      </div>
    </article>
  )
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null
  return (
    <Section tone="muted" eyebrow="Latest" title="News from campus">
      <div className="grid gap-10 md:grid-cols-3">
        {news.map((n) => (
          <NewsCard key={n.id} item={n} />
        ))}
      </div>
      <Link href="/news" className="flex w-fit items-center gap-2 font-medium text-primary underline-offset-4 hover:underline">
        All news <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Section>
  )
}

type EventItem = { id: string; title: string; description: string | null; location: string | null; starts_at: string }

export function EventRow({ e }: { e: EventItem }) {
  const d = new Date(e.starts_at)
  return (
    <li className="flex gap-5 border-b py-5 last:border-0">
      <div className="flex w-16 shrink-0 flex-col items-center rounded-md bg-primary py-2 text-primary-foreground">
        <span className="text-xs uppercase">{d.toLocaleDateString('en-NG', { month: 'short' })}</span>
        <span className="font-heading text-2xl font-semibold">{d.getDate()}</span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{e.title}</h3>
        {e.description && <p className="text-sm leading-relaxed text-muted-foreground">{e.description}</p>}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />
            {d.toLocaleString('en-NG', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
          </span>
          {e.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {e.location}
            </span>
          )}
        </p>
      </div>
    </li>
  )
}

export function EventsSection({ events }: { events: EventItem[] }) {
  return (
    <Section eyebrow="Calendar" title="Upcoming events">
      <div className="grid gap-10 lg:grid-cols-3">
        <ul className="lg:col-span-2">
          {events.length ? events.map((e) => <EventRow key={e.id} e={e} />) : <li className="text-muted-foreground">No upcoming events.</li>}
        </ul>
        <div className="flex flex-col gap-4 rounded-lg bg-ink p-6 text-ink-foreground">
          <h3 className="font-heading text-xl font-semibold">Term dates</h3>
          <dl className="flex flex-col gap-3">
            {site.calendar.map((c) => (
              <div key={c.term} className="flex flex-col border-b border-ink-foreground/15 pb-3 last:border-0">
                <dt className="text-sm opacity-75">{c.term}</dt>
                <dd className="font-medium">{c.dates}</dd>
              </div>
            ))}
          </dl>
          <Link href="/events" className="mt-auto text-sm font-medium text-accent underline-offset-4 hover:underline">
            Full events calendar
          </Link>
        </div>
      </div>
    </Section>
  )
}

export function TestimonialsSection() {
  return (
    <Section tone="muted" eyebrow="In their words" title="Parents and alumni">
      <div className="grid gap-6 md:grid-cols-3">
        {site.testimonials.map((t) => (
          <figure key={t.name} className="flex flex-col gap-6 rounded-lg border-t-4 border-accent bg-background p-6">
            <blockquote className="flex-1 leading-relaxed">{`“${t.quote}”`}</blockquote>
            <figcaption>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

export function GallerySection({ albums }: { albums: { id: string; slug: string; title: string; cover_url: string | null }[] }) {
  if (!albums.length) return null
  return (
    <Section eyebrow="Gallery" title="Life on campus">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {albums.slice(0, 4).map((a, i) => (
          <Link
            key={a.id}
            href={`/gallery/${a.slug}`}
            className={cn('group relative overflow-hidden rounded-lg bg-muted', i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square')}
          >
            {a.cover_url && <Image src={a.cover_url} alt="" fill sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
            <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-4 py-3 text-sm font-medium text-ink-foreground">{a.title}</span>
          </Link>
        ))}
      </div>
    </Section>
  )
}

export function AdmissionsCta() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl font-semibold text-balance md:text-4xl">Admissions are open</h2>
          <p className="leading-relaxed opacity-90">
            Apply online in minutes. Application fee {formatNaira(site.admissions.applicationFeeKobo)}. Next entrance exam:{' '}
            {formatDate(site.admissions.entranceExamDates[0])}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admissions#apply" className={cn(buttonVariants({ size: 'lg' }), 'h-12 bg-accent px-6 text-base text-ink hover:bg-accent/90')}>
            Start application
          </Link>
          <Link
            href="/admissions"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 border-primary-foreground/40 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground')}
          >
            Fees and requirements
          </Link>
        </div>
      </div>
    </section>
  )
}

export function MapSection() {
  const a = schoolConfig.address
  return (
    <section aria-label="Location" className="grid md:grid-cols-2">
      <div className="flex flex-col justify-center gap-4 bg-secondary px-6 py-14 md:px-12">
        <h2 className="text-3xl font-semibold">Visit us</h2>
        <address className="leading-relaxed not-italic text-muted-foreground">
          {a.street}, {a.city}, {a.state}
        </address>
        <p className="text-sm text-muted-foreground">{schoolConfig.officeHours}</p>
        <Link href="/contact" className={cn(buttonVariants(), 'w-fit')}>
          Contact the office
        </Link>
      </div>
      <iframe
        title={`Map showing ${schoolConfig.name}`}
        src={schoolConfig.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-80 w-full border-0 md:h-full md:min-h-96"
      />
    </section>
  )
}
