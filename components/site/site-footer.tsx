import Image from 'next/image'
import Link from 'next/link'
import { schoolConfig } from '@/config/school.config'

const socialLabels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X (Twitter)', youtube: 'YouTube' }

export function SiteFooter() {
  const { address } = schoolConfig
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image src={schoolConfig.branding.logo} alt="" width={44} height={44} className="rounded-md" />
            <span className="font-heading text-lg font-semibold">{schoolConfig.name}</span>
          </div>
          <p className="text-sm leading-relaxed opacity-80">{schoolConfig.description}</p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">Explore</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {schoolConfig.website.navigation.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="opacity-80 hover:opacity-100">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">Quick links</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/admissions#apply" className="opacity-80 hover:opacity-100">Apply online</Link></li>
            <li><Link href="/admissions#status" className="opacity-80 hover:opacity-100">Application status</Link></li>
            <li><Link href="/results" className="opacity-80 hover:opacity-100">Result checker</Link></li>
            <li><Link href="/events" className="opacity-80 hover:opacity-100">Events calendar</Link></li>
            <li><Link href="/staff" className="opacity-80 hover:opacity-100">Our staff</Link></li>
            <li><Link href="/careers" className="opacity-80 hover:opacity-100">Careers</Link></li>
            <li><Link href="/login" className="opacity-80 hover:opacity-100">Portal login</Link></li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">Contact</h2>
          <address className="not-italic leading-relaxed opacity-80">
            {address.street}
            <br />
            {address.city}, {address.lga} LGA
            <br />
            {address.state} State, {address.country}
          </address>
          {schoolConfig.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="opacity-80 hover:opacity-100">
              {p}
            </a>
          ))}
          <a href={`mailto:${schoolConfig.emails.general}`} className="opacity-80 hover:opacity-100">
            {schoolConfig.emails.general}
          </a>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
            {Object.entries(schoolConfig.social).map(([key, url]) => (
              <li key={key}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 opacity-80 hover:underline hover:opacity-100">
                  {socialLabels[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/15">
        <p className="mx-auto max-w-7xl px-6 py-5 text-xs opacity-70">
          © {new Date().getFullYear()} {schoolConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
