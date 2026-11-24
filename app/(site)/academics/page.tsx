import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'

export const metadata: Metadata = { title: 'Academics', description: `Curriculum, departments and grading at ${schoolConfig.name}.` }

export default function AcademicsPage() {
  const a = schoolConfig.academics
  return (
    <>
      <PageHeader eyebrow="Academics" title="Teaching that prepares students for exams and for life" description={`Curricula: ${a.curricula.join(', ')}. Classes: ${a.levels.map((l) => l.name).join(', ')}.`} />
      <Section eyebrow="Senior secondary" title="Departments">
        <div className="grid gap-6 md:grid-cols-3">
          {a.departments.map((d) => (
            <div key={d.name} className="flex flex-col gap-3 rounded-lg border p-6">
              <h3 className="font-heading text-2xl font-semibold">{d.name}</h3>
              <p className="leading-relaxed text-muted-foreground">{d.description}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section tone="muted" eyebrow="Assessment" title="How students are assessed" description={`Each term combines continuous assessment and an examination. The pass mark is ${schoolConfig.assessment.passMark}%.`}>
        <div className="grid gap-10 lg:grid-cols-2">
          <ul className="flex flex-col">
            {schoolConfig.assessment.components.map((c) => (
              <li key={c.key} className="flex items-center justify-between border-b py-3">
                <span>{c.name}</span>
                <span className="font-semibold tabular-nums">{c.maxScore} marks</span>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <caption className="sr-only">Grading scale</caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Grade</th>
                  <th scope="col" className="px-4 py-3 font-medium">Score</th>
                  <th scope="col" className="px-4 py-3 font-medium">Remark</th>
                </tr>
              </thead>
              <tbody>
                {schoolConfig.gradingScale.map((g) => (
                  <tr key={g.grade} className="border-b last:border-0">
                    <td className="px-4 py-2 font-semibold">{g.grade}</td>
                    <td className="px-4 py-2 tabular-nums">{g.min}–{g.max}</td>
                    <td className="px-4 py-2">{g.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
      <Section eyebrow="Calendar" title="Academic calendar">
        <dl className="grid gap-6 md:grid-cols-3">
          {schoolConfig.website.calendar.map((c) => (
            <div key={c.term} className="flex flex-col gap-1 rounded-lg bg-ink p-6 text-ink-foreground">
              <dt className="text-sm opacity-75">{c.term}</dt>
              <dd className="font-heading text-xl font-semibold">{c.dates}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  )
}
