import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAlbum } from '@/lib/public-data'
import { Section } from '@/components/site/site-chrome'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbum(slug)
  return { title: album?.title ?? 'Gallery' }
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) notFound()
  const items = [...(album.gallery_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <Section>
      <Link href="/gallery" className="flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All albums
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">{album.title}</h1>
        {album.description && <p className="max-w-2xl leading-relaxed text-muted-foreground">{album.description}</p>}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {item.kind === 'video' ? (
                  <video src={item.url} controls className="size-full object-cover" />
                ) : (
                  <Image src={item.url} alt={item.caption ?? album.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                )}
              </div>
              {item.caption && <figcaption className="text-sm text-muted-foreground">{item.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  )
}
