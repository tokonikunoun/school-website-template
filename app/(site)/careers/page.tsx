import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { JobApplicationForm } from '@/components/site/public-forms'
import { getOpenVacancies } from '@/lib/public-data'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Careers', description: `Teaching and support jobs at ${schoolConfig.name}.` }

export default async function CareersPage() {
  if (!schoolConfig.features.careers) notFound()
  const vacancies = await getOpenVacancies()
  return (
    <>
      <PageHeader eyebrow="Careers" title="Work with us" description="We hire qualified, passionate teachers and support staff." />
      <Section title="Open positions">
        {vacancies.length ? (
          <ul className="flex flex-col gap-4">
            {vacancies.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 rounded-lg border p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-heading text-2xl font-semibold">{v.title}</h3>
                  {v.closes_on && <p className="text-sm text-muted-foreground">Closes {formatDate(v.closes_on)}</p>}
                </div>
                <p className="text-sm font-medium text-primary">
                  {[v.department, v.employment_type.replace('_', ' ')].filter(Boolean).join(' · ')}
                </p>
                <p className="leading-relaxed">{v.description}</p>
                {v.requirements && <p className="text-sm leading-relaxed text-muted-foreground">Requirements: {v.requirements}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">There are no open positions right now. You can still send a general application.</p>
        )}
      </Section>
      <Section tone="muted" id="apply" title="Apply">
        <div className="max-w-3xl">
          <JobApplicationForm vacancies={vacancies.map((v) => ({ id: v.id, title: v.title }))} />
        </div>
      </Section>
    </>
  )
}
