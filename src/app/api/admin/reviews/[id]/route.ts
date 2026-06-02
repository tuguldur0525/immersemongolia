import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

type Params = { params: Promise<{ id: string }> }

const moderateReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().trim().max(500).optional(),
})

async function getAdminRequester() {
  const supabase = await createClient()
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? user : null
}

async function updateBusinessRating(businessId: string) {
  const result = await prisma.review.aggregate({
    where: { businessId, status: 'PUBLISHED', deletedAt: null },
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

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = moderateReviewSchema.parse(body)
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, businessId: true, deletedAt: true },
    })

    if (!review || review.deletedAt) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    const updated = await prisma.review.update({
      where: { id },
      data: data.action === 'approve'
        ? {
            status: 'PUBLISHED',
            moderatedBy: requester.id,
            moderatedAt: new Date(),
            rejectionReason: null,
          }
        : {
            status: 'REJECTED',
            moderatedBy: requester.id,
            moderatedAt: new Date(),
            rejectionReason: data.rejectionReason ?? 'Админ устгасан',
          },
      select: { id: true, status: true, businessId: true },
    })

    await updateBusinessRating(review.businessId)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('PATCH /api/admin/reviews/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, businessId: true, deletedAt: true },
    })

    if (!review || review.deletedAt) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })
    }

    await prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        deletedAt: new Date(),
        moderatedBy: requester.id,
        moderatedAt: new Date(),
        rejectionReason: 'Админ устгасан',
      },
    })

    await updateBusinessRating(review.businessId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/reviews/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
