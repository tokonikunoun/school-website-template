import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { schoolConfig } from '@/config/school.config'
import { PageHeader, Section } from '@/components/site/site-chrome'
import { getAlbums } from '@/lib/public-data'

export const metadata: Metadata = { title: 'Gallery', description: `Photos from ${schoolConfig.name}.` }

export default async function GalleryPage() {
  const albums = await getAlbums()
  return (
    <>
      <PageHeader eyebrow="Gallery" title="Moments from campus" />
      <Section>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const count = (a.gallery_items as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link key={a.id} href={`/gallery/${a.slug}`} className="group flex flex-col gap-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {a.cover_url && <Image src={a.cover_url} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold group-hover:underline">{a.title}</h2>
                  <p className="text-sm text-muted-foreground">{count} {count === 1 ? 'photo' : 'photos'}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </Section>
    </>
  )
}
