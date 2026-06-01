// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Routes that require auth
const PROTECTED_PATTERNS = [
  /^\/dashboard/,
]

const ADMIN_PATTERNS = [/^\/dashboard\/admin/]
const BUSINESS_PATTERNS = [/^\/dashboard\/business/]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PATTERNS.some((p) => p.test(pathname))
  if (!isProtected) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isAdminRoute = ADMIN_PATTERNS.some((p) => p.test(pathname))
  const isBusinessRoute = BUSINESS_PATTERNS.some((p) => p.test(pathname))

  if (isAdminRoute || isBusinessRoute) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_id', user.id)
      .single()

    const role = dbUser?.role

    if (isAdminRoute && !['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (
      isBusinessRoute &&
      !['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role || '')
    ) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
