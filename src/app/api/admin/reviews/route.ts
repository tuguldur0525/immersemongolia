import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const reviewStatusFilterSchema = z.object({
  status: z.enum(['ALL', 'PENDING_MODERATION', 'FLAGGED']).default('ALL'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

async function getAdminRequester() {
  const supabase = await createClient()
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? user : null
}

function getUserName(user: {
  displayName: string | null
  firstName: string | null
  lastName: string | null
}) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Хэрэглэгч'
}

export async function GET(request: NextRequest) {
  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const { status, page, limit } = reviewStatusFilterSchema.parse(Object.fromEntries(searchParams))
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      status: status === 'ALL' ? { in: ['PENDING_MODERATION', 'FLAGGED'] } : status,
    }

    const [reviews, total, statusGroups] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          pros: true,
          cons: true,
          status: true,
          reportCount: true,
          createdAt: true,
          business: { select: { nameMn: true, slug: true } },
          user: { select: { displayName: true, firstName: true, lastName: true } },
          _count: { select: { images: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          status: { in: ['PENDING_MODERATION', 'FLAGGED'] },
        },
        _count: { _all: true },
      }),
    ])

    const statusCounts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count._all
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review.id,
          businessName: review.business.nameMn,
          businessSlug: review.business.slug,
          user: getUserName(review.user),
          rating: review.rating,
          title: review.title,
          body: review.body,
          pros: review.pros,
          cons: review.cons,
          status: review.status,
          reason: review.status === 'FLAGGED'
            ? `${review.reportCount} мэдэгдэл`
            : 'Модерац хүлээгдэж байна',
          reportCount: review.reportCount,
          createdAt: review.createdAt,
          hasImages: review._count.images > 0,
        })),
        total,
        statusCounts,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters', details: error.errors }, { status: 400 })
    }
    console.error('GET /api/admin/reviews:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
