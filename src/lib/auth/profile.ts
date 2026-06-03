import type { User as SupabaseUser } from '@supabase/supabase-js'
import prisma from '@/lib/supabase/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import type { PublicProfileRole } from '@/lib/auth/redirects'

interface EnsureUserProfileInput {
  firstName?: string | null
  lastName?: string | null
  role?: PublicProfileRole | null
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readPublicRole(value: unknown): PublicProfileRole {
  return value === 'BUSINESS_OWNER' ? 'BUSINESS_OWNER' : 'USER'
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = readString(value)
    if (text) return text
  }
  return ''
}

export async function ensureUserProfile(authUser: SupabaseUser, input: EnsureUserProfileInput = {}) {
  const email = authUser.email?.trim()
  if (!email) {
    throw new Error('Authenticated user has no email address')
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  })

  if (existing) {
    return { user: existing, created: false }
  }

  const metadata = authUser.user_metadata ?? {}
  const nameParts = readString(metadata.name).split(/\s+/).filter(Boolean)
  const firstName = firstNonEmpty(
    input.firstName,
    metadata.firstName,
    metadata.given_name,
    nameParts[0],
    'Хэрэглэгч'
  )
  const lastName = firstNonEmpty(
    input.lastName,
    metadata.lastName,
    metadata.family_name,
    nameParts.slice(1).join(' ')
  )
  const role = readPublicRole(input.role)
  const displayName = `${lastName} ${firstName}`.trim()

  const user = await prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email,
      firstName,
      lastName,
      displayName,
      role,
    },
  })

  sendWelcomeEmail(email, firstName).catch(console.error)

  return { user, created: true }
}
