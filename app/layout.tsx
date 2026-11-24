import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import type { CSSProperties } from 'react'
import { schoolConfig } from '@/config/school.config'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' })

export const metadata: Metadata = {
  title: {
    default: `${schoolConfig.name} | ${schoolConfig.address.city}, ${schoolConfig.address.state}`,
    template: `%s | ${schoolConfig.name}`,
  },
  description: schoolConfig.description,
  applicationName: schoolConfig.name,
  icons: { icon: schoolConfig.branding.favicon, apple: schoolConfig.branding.logo },
  openGraph: {
    title: schoolConfig.name,
    description: schoolConfig.description,
    images: [schoolConfig.branding.ogImage],
    type: 'website',
    locale: 'en_NG',
  },
}

export const viewport: Viewport = {
  themeColor: schoolConfig.branding.colors.primary,
}

const brandVars = {
  '--primary': schoolConfig.branding.colors.primary,
  '--ink': schoolConfig.branding.colors.secondary,
  '--accent': schoolConfig.branding.colors.accent,
  '--heading-family':
    schoolConfig.branding.fontPreset === 'classic' ? 'var(--font-source-serif)' : 'var(--font-inter)',
} as CSSProperties

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={schoolConfig.locale} className={`${inter.variable} ${sourceSerif.variable} bg-background`} style={brandVars}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
