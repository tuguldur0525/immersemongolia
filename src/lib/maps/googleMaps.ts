export type MapCoordinates = {
  latitude: number
  longitude: number
}

const GOOGLE_HOST_PATTERN = /(^|\.)google\.[a-z.]+$/i

export function isValidCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
}

export function parseGoogleMapsCoordinates(value: string): MapCoordinates | null {
  const input = value.trim()
  if (!input) return null

  const candidates = new Set([input])
  try {
    candidates.add(decodeURIComponent(input))
  } catch {}

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:,[^/?&\s]+)?/,
    /[?&](?:q|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/,
  ]

  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern)
      if (!match) continue

      const latitude = Number(match[1])
      const longitude = Number(match[2])
      if (isValidCoordinate(latitude, longitude)) return { latitude, longitude }
    }
  }

  return null
}

export function buildGoogleMapsCoordinateUrl(latitude?: number, longitude?: number) {
  if (!isValidCoordinate(Number(latitude), Number(longitude))) return ''
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

export function isGoogleMapsLink(value: string) {
  const input = value.trim()
  if (!input) return false

  try {
    const url = new URL(input)
    const host = url.hostname.toLowerCase()

    if (host === 'maps.app.goo.gl' || host === 'goo.gl') return true
    if (host === 'maps.google.com' || host === 'www.google.com') return true
    return GOOGLE_HOST_PATTERN.test(host) && url.pathname.includes('/maps')
  } catch {
    return false
  }
}
