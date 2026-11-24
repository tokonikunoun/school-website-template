import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { ContactForm } from '@/components/site/public-forms'

export const metadata: Metadata = { title: 'Contact us', description: `Address, phone numbers and enquiries for ${schoolConfig.name}.` }

export default function ContactPage() {
  const a = schoolConfig.address
  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact us" description={schoolConfig.officeHours} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Address</h2>
              <address className="leading-relaxed not-italic text-muted-foreground">
                {a.street}<br />{a.city}, {a.lga} LGA<br />{a.state} State, {a.country}
              </address>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Phone</h2>
              {schoolConfig.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="text-primary hover:underline">{p}</a>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Email</h2>
              {Object.entries(schoolConfig.emails).map(([k, e]) => (
                <p key={k} className="text-sm">
                  <span className="capitalize text-muted-foreground">{k}: </span>
                  <a href={`mailto:${e}`} className="text-primary hover:underline">{e}</a>
                </p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="mb-6 text-2xl font-semibold">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </Section>
      <iframe title={`Map showing ${schoolConfig.name}`} src={schoolConfig.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-96 w-full border-0" />
    </>
  )
}
