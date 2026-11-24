import { schoolConfig } from '@/config/school.config'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { AnnouncementBanner, WhatsAppButton } from '@/components/site/site-chrome'
import { getBannerAnnouncement } from '@/lib/public-data'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const banner = schoolConfig.website.announcementBanner ? await getBannerAnnouncement() : null
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2">
        Skip to content
      </a>
      {banner && <AnnouncementBanner title={banner.title} body={banner.body} />}
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  )
}
