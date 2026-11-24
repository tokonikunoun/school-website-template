import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getNewsBySlug } from '@/lib/public-data'
import { formatDate } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsBySlug(slug)
  if (!post) return { title: 'News' }
  return { title: post.title, description: post.excerpt ?? undefined, openGraph: { images: post.cover_url ? [post.cover_url] : undefined } }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getNewsBySlug(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 md:py-16">
      <Link href="/news" className="flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All news
      </Link>
      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          {post.category ?? 'News'} · <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
        </p>
        <h1 className="text-4xl font-semibold text-balance md:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
      </header>
      {post.cover_url && (
        <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
          <Image src={post.cover_url} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-5 text-lg leading-relaxed">
        {String(post.body ?? '').split(/\n{2,}/).map((para: string, i: number) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  )
}
