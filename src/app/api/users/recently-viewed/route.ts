// src/app/api/users/recently-viewed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const recentlyViewedSchema = z.object({
  businessId: z.string().uuid(),
  source: z.string().trim().max(40).optional(),
})

async function getCurrentDbUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentDbUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = recentlyViewedSchema.parse(body)

    const business = await prisma.business.findFirst({
      where: { id: data.businessId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const viewed = await prisma.recentlyViewed.upsert({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId: data.businessId,
        },
      },
      update: {
        viewedAt: new Date(),
        source: data.source,
      },
      create: {
        userId: user.id,
        businessId: data.businessId,
        source: data.source,
      },
    })

    return NextResponse.json({ success: true, data: viewed })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/users/recently-viewed:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
