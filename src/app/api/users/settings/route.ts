import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const settingsSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(''),
  displayName: z.string().trim().max(160).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  preferredLanguage: z.enum(['mn', 'en']).default('mn'),
  preferences: z.object({
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(false),
    marketingEmails: z.boolean().default(false),
  }).default({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
  }),
})

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return user
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        role: true,
        preferredLanguage: true,
        preferences: true,
        createdAt: true,
        _count: { select: { reviews: true, savedBusinesses: true, businesses: true } },
      },
    })

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('GET /api/users/settings:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const data = settingsSchema.parse(await request.json())

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName || null,
        phone: data.phone || null,
        bio: data.bio || null,
        preferredLanguage: data.preferredLanguage,
        preferences: data.preferences,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        role: true,
        preferredLanguage: true,
        preferences: true,
        createdAt: true,
        _count: { select: { reviews: true, savedBusinesses: true, businesses: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }

    console.error('PATCH /api/users/settings:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
