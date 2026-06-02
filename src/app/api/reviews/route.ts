// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const createReviewSchema = z.object({
  businessId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  pros: z.string().max(1000).optional(),
  cons: z.string().max(1000).optional(),
  visitDate: z.string().optional(),
  visitType: z.enum(['solo', 'couple', 'family', 'business', 'friends']).optional(),
})

async function getRequester(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user: cookieUser },
    error: cookieError,
  } = await supabase.auth.getUser()

  if (cookieUser && !cookieError) {
    const { user } = await ensureUserProfile(cookieUser)
    return user
  }

  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const {
    data: { user: tokenUser },
    error: tokenError,
  } = await supabase.auth.getUser(token)

  if (tokenError || !tokenUser) return null

  const { user } = await ensureUserProfile(tokenUser)
  return user
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const businessId = searchParams.get('businessId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const sortBy = searchParams.get('sortBy') || 'newest'

  if (!businessId) {
    return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 })
  }

  try {
    const orderBy = sortBy === 'helpful'
      ? [{ helpfulCount: 'desc' as const }]
      : sortBy === 'highest'
      ? [{ rating: 'desc' as const }]
      : sortBy === 'lowest'
      ? [{ rating: 'asc' as const }]
      : [{ createdAt: 'desc' as const }]

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { businessId, status: 'PUBLISHED', deletedAt: null },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true, firstName: true, lastName: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { votes: true } },
        },
      }),
      prisma.review.count({ where: { businessId, status: 'PUBLISHED', deletedAt: null } }),
    ])

    // Get rating distribution
    const ratingDist = await prisma.review.groupBy({
      by: ['rating'],
      where: { businessId, status: 'PUBLISHED' },
      _count: { rating: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        ratingDistribution: Object.fromEntries(
          ratingDist.map(r => [r.rating, r._count.rating])
        ),
      },
    })
  } catch (error) {
    console.error('GET /api/reviews:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const requester = await getRequester(request)
    if (!requester) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createReviewSchema.parse(body)

    // Check if user already reviewed this business
    const existing = await prisma.review.findUnique({
      where: { businessId_userId: { businessId: data.businessId, userId: requester.id } },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'You already reviewed this business' }, { status: 409 })
    }

    // Check business exists
    const business = await prisma.business.findFirst({
      where: { id: data.businessId, status: 'ACTIVE' },
    })
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })

    const review = await prisma.review.create({
      data: {
        ...data,
        userId: requester.id,
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
        status: 'PENDING_MODERATION',
      },
    })

    // Update business rating asynchronously
    updateBusinessRating(data.businessId).catch(() => {})

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/reviews:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function updateBusinessRating(businessId: string) {
  const result = await prisma.review.aggregate({
    where: { businessId, status: 'PUBLISHED' },
    _avg: { rating: true },
    _count: { id: true },
  })

  await prisma.business.update({
    where: { id: businessId },
    data: {
      avgRating: result._avg.rating || 0,
      totalReviews: result._count.id,
    },
  })
}
