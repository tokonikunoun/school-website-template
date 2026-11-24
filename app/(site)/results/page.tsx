import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { ResultCheckerForm } from '@/components/site/public-forms'
import { schoolConfig } from '@/config/school.config'

export const metadata: Metadata = { title: 'Result checker', robots: { index: false } }

export default function ResultsPage() {
  if (!schoolConfig.features.resultChecker) notFound()
  return (
    <>
      <PageHeader eyebrow="Results" title="Check a term result" description="Use the admission number with the serial and PIN on your scratch card. Parents with portal accounts can view results after signing in." />
      <Section>
        <div className="max-w-3xl">
          <ResultCheckerForm />
        </div>
      </Section>
    </>
  )
}
