import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'

export const metadata: Metadata = { title: 'Student life', description: `Clubs, sports, boarding and welfare at ${schoolConfig.name}.` }

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i} className="rounded-md bg-secondary px-4 py-2 text-sm font-medium">
          {i}
        </li>
      ))}
    </ul>
  )
}

export default function StudentLifePage() {
  const s = schoolConfig.website.studentLife
  return (
    <>
      <PageHeader eyebrow="Beyond the classroom" title="Student life" description="Clubs, sports, leadership and a caring community." image={schoolConfig.website.pageImages.studentLife} />
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold">Clubs and societies</h2>
            <Chips items={s.clubs} />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold">Sports</h2>
            <Chips items={s.sports} />
          </div>
        </div>
      </Section>
      <Section tone="muted">
        <div className="grid gap-10 md:grid-cols-3">
          {schoolConfig.features.boarding && (
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold">Boarding</h2>
              <p className="leading-relaxed text-muted-foreground">{s.boarding}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Health and welfare</h2>
            <p className="leading-relaxed text-muted-foreground">{s.health}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Transport</h2>
            <p className="leading-relaxed text-muted-foreground">{s.transport}</p>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold">School rules</h2>
            <ul className="flex flex-col gap-3">
              {schoolConfig.website.rules.map((r) => (
                <li key={r} className="border-b pb-3 leading-relaxed">{r}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold">Uniform</h2>
            <p className="leading-relaxed">{schoolConfig.website.uniform}</p>
          </div>
        </div>
      </Section>
    </>
  )
}
