import type { Metadata } from 'next'
import Image from 'next/image'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'

export const metadata: Metadata = { title: 'About us', description: `History, vision, mission and values of ${schoolConfig.name}.` }

export default function AboutPage() {
  const w = schoolConfig.website
  return (
    <>
      <PageHeader eyebrow={`Since ${schoolConfig.foundedYear}`} title={`About ${schoolConfig.name}`} description={schoolConfig.description} image={schoolConfig.branding.heroImage} />
      <Section eyebrow="Our story" title="History">
        <p className="max-w-3xl text-lg leading-relaxed text-pretty">{w.history}</p>
      </Section>
      <Section tone="muted">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold">Vision</h2>
            <p className="text-lg leading-relaxed">{w.vision}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold">Mission</h2>
            <p className="text-lg leading-relaxed">{w.mission}</p>
          </div>
        </div>
      </Section>
      <Section eyebrow="What we stand for" title="Core values">
        <ul className="flex flex-wrap gap-3">
          {w.coreValues.map((v) => (
            <li key={v} className="rounded-full border-2 border-primary px-5 py-2 font-heading text-lg font-semibold text-primary">
              {v}
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="muted">
        <div className="grid items-center gap-10 md:grid-cols-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg md:col-span-2">
            <Image src={w.principal.photo} alt={w.principal.name} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col gap-4 md:col-span-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{`${w.principal.title}'s message`}</p>
            <p className="font-heading text-2xl leading-relaxed">{w.principal.message}</p>
            <p className="font-semibold">{w.principal.name}</p>
          </div>
        </div>
      </Section>
      <Section eyebrow="Campus" title="Facilities">
        <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {w.facilities.map((f) => (
            <li key={f} className="flex gap-3 border-b pb-3 leading-relaxed">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
