export type PublicProfileRole = 'USER' | 'BUSINESS_OWNER'

export function readPublicProfileRole(value: unknown): PublicProfileRole | null {
  return value === 'BUSINESS_OWNER' || value === 'USER' ? value : null
}

export function getSafeRelativePath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}

export function buildAuthCallbackUrl(
  origin: string,
  options: { next?: string | null; role?: PublicProfileRole | null } = {}
) {
  const url = new URL('/auth/callback', origin)
  const next = getSafeRelativePath(options.next, '/')

  if (next !== '/') {
    url.searchParams.set('next', next)
  }

  if (options.role) {
    url.searchParams.set('role', options.role)
  }

  return url.toString()
}

function dec2hex(dec: number) {
  return (`0${dec.toString(16)}`).slice(-2)
}

function generatePKCEVerifier() {
  const verifierLength = 56
  const array = new Uint32Array(verifierLength)

  if (typeof crypto === 'undefined') {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let verifier = ''

    for (let i = 0; i < verifierLength; i += 1) {
      verifier += charSet.charAt(Math.floor(Math.random() * charSet.length))
    }

    return verifier
  }

  crypto.getRandomValues(array)
  return Array.from(array, dec2hex).join('')
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generatePKCEChallenge(verifier: string) {
  return { challenge: verifier, method: 'plain' }
}

function getSupabaseAuthStorageKey(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

  return `sb-${projectRef}-auth-token`
}

function setSupabaseCodeVerifierCookie(supabaseUrl: string, verifier: string) {
  const cookieName = `${getSupabaseAuthStorageKey(supabaseUrl)}-code-verifier`
  const cookieOptions = 'Max-Age=34560000; Path=/; SameSite=Lax'

  document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax`
  for (let index = 0; index < 5; index += 1) {
    document.cookie = `${cookieName}.${index}=; Max-Age=0; Path=/; SameSite=Lax`
  }

  const encodedVerifier = `base64-${toBase64Url(JSON.stringify(verifier))}`
  document.cookie = `${cookieName}=${encodedVerifier}; ${cookieOptions}`
}

export function buildGoogleOAuthUrl(supabaseUrl: string, redirectTo: string) {
  const verifier = generatePKCEVerifier()
  const { challenge, method } = generatePKCEChallenge(verifier)
  const url = new URL('/auth/v1/authorize', supabaseUrl)

  setSupabaseCodeVerifierCookie(supabaseUrl, verifier)
  url.searchParams.set('provider', 'google')
  url.searchParams.set('redirect_to', redirectTo)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', method)

  return url.toString()
}
