import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { EventRow } from '@/components/site/home-sections'
import { getUpcomingEvents } from '@/lib/public-data'

export const metadata: Metadata = { title: 'Events', description: `Upcoming events at ${schoolConfig.name}.` }

export default async function EventsPage() {
  const events = await getUpcomingEvents()
  return (
    <>
      <PageHeader eyebrow="Calendar" title="Events" />
      <Section>
        <ul className="max-w-3xl">
          {events.length ? events.map((e) => <EventRow key={e.id} e={e} />) : <li className="text-muted-foreground">No upcoming events.</li>}
        </ul>
      </Section>
    </>
  )
}
