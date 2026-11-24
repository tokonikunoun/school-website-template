import Image from 'next/image'
import Link from 'next/link'
import { schoolConfig } from '@/config/school.config'

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-10 px-6 py-8 md:px-12">
        <Link href="/" className="flex items-center gap-3">
          <Image src={schoolConfig.branding.logo} alt="" width={40} height={40} className="rounded-md" />
          <span className="font-heading text-lg font-semibold">{schoolConfig.name}</span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-balance">{title}</h1>
            <p className="leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
        <p className="text-sm text-muted-foreground">
          Need help? Call {schoolConfig.phones[0]} or email {schoolConfig.emails.general}
        </p>
      </div>
      <div className="relative hidden lg:block">
        <Image src={schoolConfig.branding.heroImage} alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-ink/85 p-10 text-ink-foreground">
          <p className="font-heading text-2xl">{schoolConfig.motto}</p>
          <p className="text-sm opacity-80">
            One portal for staff, parents and students of {schoolConfig.name}.
          </p>
        </div>
      </div>
    </main>
  )
}
