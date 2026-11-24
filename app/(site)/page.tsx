import { schoolConfig } from '@/config/school.config'
import { getAlbums, getNews, getPublicStats, getUpcomingEvents } from '@/lib/public-data'
import {
  AdmissionsCta,
  EventsSection,
  GallerySection,
  HeroSection,
  MapSection,
  NewsSection,
  ProgrammesSection,
  StatsSection,
  TestimonialsSection,
  WelcomeSection,
  WhySection,
} from '@/components/site/home-sections'

export default async function HomePage() {
  const [news, events, albums, stats] = await Promise.all([getNews(3), getUpcomingEvents(4), getAlbums(), getPublicStats()])

  const sections: Record<string, React.ReactNode> = {
    hero: <HeroSection />,
    stats: <StatsSection {...stats} />,
    welcome: <WelcomeSection />,
    why: <WhySection />,
    programmes: <ProgrammesSection />,
    news: schoolConfig.features.blog ? <NewsSection news={news} /> : null,
    events: <EventsSection events={events} />,
    testimonials: <TestimonialsSection />,
    gallery: schoolConfig.features.gallery ? <GallerySection albums={albums} /> : null,
    admissions: schoolConfig.features.onlineAdmissions ? <AdmissionsCta /> : null,
    map: <MapSection />,
  }

  return (
    <>
      {schoolConfig.website.homeSections.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
    </>
  )
}
