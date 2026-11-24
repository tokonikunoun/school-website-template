import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { AdmissionForm, ApplicationStatusForm } from '@/components/site/public-forms'
import { formatDate, formatNaira } from '@/lib/format'

export const metadata: Metadata = { title: 'Admissions', description: `Requirements, fees and online application for ${schoolConfig.name}.` }

export default function AdmissionsPage() {
  const ad = schoolConfig.website.admissions
  return (
    <>
      <PageHeader eyebrow={schoolConfig.website.hero.eyebrow} title="Admissions" description={`Application fee ${formatNaira(ad.applicationFeeKobo)}. Entrance exams: ${ad.entranceExamDates.map((d) => formatDate(d)).join(' and ')}.`} />
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl font-semibold">How to apply</h2>
            <ol className="flex flex-col gap-4">
              {ad.process.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
                  <span className="pt-1 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl font-semibold">Requirements</h2>
            <ul className="flex flex-col gap-3">
              {ad.requirements.map((r) => (
                <li key={r} className="flex gap-3 border-b pb-3 leading-relaxed">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 text-sm">
              {ad.forms.map((f) => (
                <a key={f.label} href={f.href} className="font-medium text-primary underline-offset-4 hover:underline">
                  {f.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Section>
      <Section tone="muted" eyebrow="Fees" title="Fees overview" description="Indicative tuition per term. A full breakdown is provided with the admission letter.">
        <dl className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
          {schoolConfig.website.feesOverview.map((f) => (
            <div key={f.level} className="flex flex-col gap-1 bg-background p-6">
              <dt className="text-sm text-muted-foreground">{f.level}</dt>
              <dd className="font-heading text-3xl font-semibold">{formatNaira(f.perTermKobo)}</dd>
            </div>
          ))}
        </dl>
      </Section>
      {schoolConfig.features.onlineAdmissions && (
        <Section id="apply" eyebrow="Online application" title="Apply now" description="Fields marked * are required. You will receive a reference number when you submit.">
          <div className="max-w-4xl">
            <AdmissionForm examDates={ad.entranceExamDates} />
          </div>
        </Section>
      )}
      <Section id="status" tone="muted" title="Check application status">
        <div className="max-w-2xl">
          <ApplicationStatusForm />
        </div>
      </Section>
    </>
  )
}
