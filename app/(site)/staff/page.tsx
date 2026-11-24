import type { Metadata } from 'next'
import Image from 'next/image'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { getStaffDirectory } from '@/lib/public-data'

export const metadata: Metadata = { title: 'Our staff', description: `Meet the teachers and leadership of ${schoolConfig.name}.` }

export default async function StaffPage() {
  const staff = await getStaffDirectory()
  return (
    <>
      <PageHeader eyebrow="Our people" title="Meet our staff" />
      <Section>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {staff.map((s) => {
            const name = [s.title, s.first_name, s.last_name].filter(Boolean).join(' ')
            return (
              <li key={s.id} className="flex flex-col gap-3">
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  {s.photo_url ? (
                    <Image src={s.photo_url} alt={name} fill sizes="25vw" className="object-cover" />
                  ) : (
                    <span className="font-heading text-4xl font-semibold text-primary" aria-hidden>
                      {s.first_name[0]}{s.last_name[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground">{[s.position, s.department].filter(Boolean).join(' · ')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>
    </>
  )
}
