// src/app/api/users/saved/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const savedBusinessSchema = z.object({
  businessId: z.string().uuid(),
})

async function getCurrentDbUser() {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  const { user } = await ensureUserProfile(authUser)
  return user
}

export async function GET() {
  try {
    const user = await getCurrentDbUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const savedBusinesses = await prisma.savedBusiness.findMany({
      where: {
        userId: user.id,
        business: { status: 'ACTIVE', deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            slug: true,
            nameMn: true,
            nameEn: true,
            taglineMn: true,
            taglineEn: true,
            coverImageUrl: true,
            logoUrl: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
            isFeatured: true,
            isPremium: true,
            priceRange: true,
            latitude: true,
            longitude: true,
            city: true,
            district: true,
            addressMn: true,
            category: {
              select: { id: true, slug: true, nameMn: true, nameEn: true, icon: true, color: true },
            },
          },
        },
      },
    })

    const data = savedBusinesses
      .filter((saved) => saved.business)
      .map((saved) => ({
        ...saved.business,
        avgRating: Number(saved.business.avgRating),
        savedAt: saved.createdAt,
      }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/users/saved:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentDbUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = savedBusinessSchema.parse(body)

    const business = await prisma.business.findFirst({
      where: { id: data.businessId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const { saved, created } = await prisma.$transaction(async (tx) => {
      const existing = await tx.savedBusiness.findUnique({
        where: { userId_businessId: { userId: user.id, businessId: data.businessId } },
      })

      if (existing) {
        return { saved: existing, created: false }
      }

      const saved = await tx.savedBusiness.create({
        data: { userId: user.id, businessId: data.businessId },
      })

      await tx.business.update({
        where: { id: data.businessId },
        data: { totalSaves: { increment: 1 } },
      })

      return { saved, created: true }
    })

    return NextResponse.json({ success: true, data: saved }, { status: created ? 201 : 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/users/saved:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentDbUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = savedBusinessSchema.parse(body)

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.savedBusiness.deleteMany({
        where: { userId: user.id, businessId: data.businessId },
      })

      if (deleted.count > 0) {
        await tx.business.update({
          where: { id: data.businessId },
          data: { totalSaves: { decrement: deleted.count } },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('DELETE /api/users/saved:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
