import { createClient } from '@/lib/supabase/server'

export async function getBannerAnnouncement() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select('id, title, body')
    .eq('is_banner', true)
    .in('audience', ['public', 'all'])
    .lte('publish_at', new Date().toISOString())
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('publish_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function getNews(limit?: number) {
  const supabase = await createClient()
  let q = supabase
    .from('news')
    .select('id, slug, title, excerpt, cover_url, category, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data } = await q
  return data ?? []
}

export async function getNewsBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('news')
    .select('id, slug, title, excerpt, body, cover_url, category, published_at')
    .eq('is_published', true)
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export async function getUpcomingEvents(limit?: number) {
  const supabase = await createClient()
  let q = supabase
    .from('events')
    .select('id, title, description, location, starts_at, ends_at')
    .eq('is_public', true)
    .gte('starts_at', new Date(Date.now() - 86_400_000).toISOString())
    .order('starts_at', { ascending: true })
  if (limit) q = q.limit(limit)
  const { data } = await q
  return data ?? []
}

export async function getAlbums() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gallery_albums')
    .select('id, slug, title, description, cover_url, gallery_items(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAlbum(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gallery_albums')
    .select('id, slug, title, description, cover_url, gallery_items(id, kind, url, caption, sort_order)')
    .eq('is_published', true)
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export async function getOpenVacancies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vacancies')
    .select('id, title, department, employment_type, description, requirements, closes_on')
    .eq('is_open', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getStaffDirectory() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('public_staff_directory')
  return (data ?? []) as {
    id: string
    title: string | null
    first_name: string
    last_name: string
    position: string | null
    department: string | null
    qualification: string | null
    photo_url: string | null
  }[]
}

export async function getPublicStats() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('public_stats')
  return (data ?? { students: 0, teachers: 0 }) as { students: number; teachers: number }
}
