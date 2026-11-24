import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { homeForRole, portalForPath, roleMayUsePortal } from '@/lib/roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Keep getUser() directly after client creation so the session refresh is reliable.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const portal = portalForPath(pathname)
  const isLogin = pathname === '/login'
  if (!portal && !isLogin) return supabaseResponse

  const redirectTo = (path: string, withNext = false) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = withNext ? `?next=${encodeURIComponent(pathname)}` : ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!user) return portal ? redirectTo('/login', true) : supabaseResponse

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, must_change_password')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    return redirectTo('/login')
  }

  if (isLogin) return redirectTo(homeForRole(profile.role))
  if (profile.must_change_password && pathname !== '/account/password') return redirectTo('/account/password')
  if (portal && !roleMayUsePortal(profile.role, portal)) return redirectTo(homeForRole(profile.role))

  return supabaseResponse
}
