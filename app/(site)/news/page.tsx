import type { Metadata } from 'next'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { NewsCard } from '@/components/site/home-sections'
import { getNews } from '@/lib/public-data'

export const metadata: Metadata = { title: 'News', description: `Latest news from ${schoolConfig.name}.` }

export default async function NewsPage() {
  const news = await getNews()
  return (
    <>
      <PageHeader eyebrow="News" title="News and stories" description="Achievements, events and updates from our school community." />
      <Section>
        {news.length ? (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No news yet. Check back soon.</p>
        )}
      </Section>
    </>
  )
}
