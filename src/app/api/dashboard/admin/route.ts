import { NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: { role: true },
    })

    if (!adminUser || !['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalUsers,
      newUsersLast7Days,
      totalBusinesses,
      newBusinessesLast7Days,
      pendingBusinesses,
      pendingReviews,
      activeSubscriptions,
      monthlyRevenue,
      previousMonthlyRevenue,
      recentApprovals,
      recentReviews,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { isActive: true, deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.business.count({ where: { status: 'ACTIVE', deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      prisma.business.count({ where: { status: 'PENDING_REVIEW', deletedAt: null } }),
      prisma.review.count({
        where: {
          deletedAt: null,
          status: { in: ['PENDING_MODERATION', 'FLAGGED'] },
        },
      }),
      prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: previousMonthStart, lt: monthStart } },
        _sum: { amount: true },
      }),
      prisma.business.findMany({
        where: { status: 'PENDING_REVIEW', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          slug: true,
          nameMn: true,
          status: true,
          createdAt: true,
          category: { select: { nameMn: true } },
          owner: { select: { displayName: true, firstName: true, lastName: true } },
        },
      }),
      prisma.review.findMany({
        where: {
          deletedAt: null,
          status: { in: ['PENDING_MODERATION', 'FLAGGED'] },
        },
        orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          rating: true,
          status: true,
          reportCount: true,
          business: { select: { nameMn: true, slug: true } },
          user: { select: { displayName: true, firstName: true, lastName: true } },
        },
      }),
    ])

    const revenueMnt = Number(monthlyRevenue._sum.amount ?? 0)
    const previousRevenueMnt = Number(previousMonthlyRevenue._sum.amount ?? 0)
    const revenueDeltaPct = previousRevenueMnt > 0
      ? ((revenueMnt - previousRevenueMnt) / previousRevenueMnt) * 100
      : revenueMnt > 0 ? 100 : 0

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        stats: {
          totalUsers,
          newUsersLast7Days,
          totalBusinesses,
          newBusinessesLast7Days,
          monthlyRevenueMnt: revenueMnt,
          revenueDeltaPct,
          pendingBusinesses,
          pendingReviews,
          activeSubscriptions,
        },
        recentApprovals: recentApprovals.map((business) => ({
          id: business.id,
          slug: business.slug,
          name: business.nameMn,
          category: business.category.nameMn,
          owner: business.owner?.displayName || [business.owner?.firstName, business.owner?.lastName].filter(Boolean).join(' ') || 'Тодорхойгүй',
          status: business.status,
          createdAt: business.createdAt,
        })),
        recentReviews: recentReviews.map((review) => ({
          id: review.id,
          business: review.business.nameMn,
          businessSlug: review.business.slug,
          user: review.user.displayName || [review.user.firstName, review.user.lastName].filter(Boolean).join(' ') || 'Хэрэглэгч',
          rating: review.rating,
          status: review.status,
          reason: review.status === 'FLAGGED'
            ? `${review.reportCount} мэдэгдэл`
            : 'Модерац хүлээгдэж байна',
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
