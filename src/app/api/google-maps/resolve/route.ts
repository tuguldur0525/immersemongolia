import { NextRequest, NextResponse } from 'next/server'
import { isGoogleMapsLink, parseGoogleMapsCoordinates } from '@/lib/maps/googleMaps'

const MAX_REDIRECTS = 5
const REQUEST_TIMEOUT_MS = 8000

async function fetchRedirect(url: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 NomadView Google Maps Resolver',
      },
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolveGoogleMapsLink(input: string) {
  let currentUrl = input

  for (let index = 0; index <= MAX_REDIRECTS; index += 1) {
    if (!isGoogleMapsLink(currentUrl)) {
      throw new Error('Зөвхөн Google Maps линк оруулна уу.')
    }

    const coordinates = parseGoogleMapsCoordinates(currentUrl)
    if (coordinates) {
      return { ...coordinates, resolvedUrl: currentUrl }
    }

    const res = await fetchRedirect(currentUrl)
    const redirectUrl = res.headers.get('location')

    if (!redirectUrl || res.status < 300 || res.status >= 400) {
      const resolvedCoordinates = parseGoogleMapsCoordinates(res.url)
      if (resolvedCoordinates) {
        return { ...resolvedCoordinates, resolvedUrl: res.url }
      }

      return null
    }

    currentUrl = new URL(redirectUrl, currentUrl).toString()
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    const url = typeof payload?.url === 'string' ? payload.url.trim() : ''

    if (!url) {
      return NextResponse.json({ success: false, error: 'Google Maps линк шаардлагатай.' }, { status: 400 })
    }

    if (!isGoogleMapsLink(url)) {
      return NextResponse.json({ success: false, error: 'Зөвхөн Google Maps линк оруулна уу.' }, { status: 400 })
    }

    const resolved = await resolveGoogleMapsLink(url)

    if (!resolved) {
      return NextResponse.json({ success: false, error: 'Google Maps линкээс координат олдсонгүй.' }, { status: 422 })
    }

    return NextResponse.json({ success: true, data: resolved })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Maps линк шалгахад алдаа гарлаа.'
    const status = message.includes('Зөвхөн Google Maps') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
