// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'
import { getSafeRelativePath, readPublicProfileRole } from '@/lib/auth/redirects'

function getRedirectOrigin(request: NextRequest, origin: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()

  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const protocol = forwardedProto === 'http' ? 'http' : 'https'

    return `${protocol}://${forwardedHost}`
  }

  return origin
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRelativePath(searchParams.get('next'), '/')
  const role = readPublicProfileRole(searchParams.get('role'))
  const redirectOrigin = getRedirectOrigin(request, origin)

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user) {
        await ensureUserProfile(data.user, { role })

        return NextResponse.redirect(new URL(next, redirectOrigin))
      }

      if (error) {
        console.error('Supabase auth callback exchange failed:', error)
      }
    } catch (error) {
      console.error('Supabase auth callback failed:', error)
    }
  }

  const loginUrl = new URL('/auth/login', redirectOrigin)
  loginUrl.searchParams.set('error', 'callback_failed')

  return NextResponse.redirect(loginUrl)
}
