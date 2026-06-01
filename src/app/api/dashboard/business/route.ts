import { NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

function trend(current: number, previous: number) {
  if (previous > 0) return ((current - previous) / previous) * 100
  return current > 0 ? 100 : 0
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: { id: true, firstName: true, displayName: true, role: true },
    })

    if (!dbUser || !['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const businesses = await prisma.business.findMany({
      where: { ownerId: dbUser.id, deletedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        nameMn: true,
        nameEn: true,
        status: true,
        totalViews: true,
        totalSaves: true,
        totalClicks: true,
        avgRating: true,
        totalReviews: true,
      },
    })

    const businessIds = businesses.map((business) => business.id)
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const [
      totals,
      currentWeekAnalytics,
      previousWeekAnalytics,
      recentReviews,
      subscription,
    ] = businessIds.length > 0 ? await Promise.all([
      prisma.business.aggregate({
        where: { id: { in: businessIds } },
        _sum: {
          totalViews: true,
          totalSaves: true,
          totalClicks: true,
          totalReviews: true,
        },
        _avg: { avgRating: true },
      }),
      prisma.businessAnalytics.aggregate({
        where: { businessId: { in: businessIds }, date: { gte: sevenDaysAgo } },
        _sum: { views: true, saves: true, clicks: true, phoneClicks: true, websiteClicks: true, mapClicks: true },
      }),
      prisma.businessAnalytics.aggregate({
        where: { businessId: { in: businessIds }, date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        _sum: { views: true, saves: true, clicks: true, phoneClicks: true, websiteClicks: true, mapClicks: true },
      }),
      prisma.review.findMany({
        where: { businessId: { in: businessIds }, status: 'PUBLISHED', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          user: { select: { displayName: true, firstName: true, lastName: true } },
          business: { select: { nameMn: true, slug: true } },
        },
      }),
      prisma.subscription.findFirst({
        where: {
          userId: dbUser.id,
          status: 'ACTIVE',
          endDate: { gte: now },
        },
        orderBy: { endDate: 'desc' },
      }),
    ]) : [
      null,
      null,
      null,
      [],
      await prisma.subscription.findFirst({
        where: { userId: dbUser.id, status: 'ACTIVE', endDate: { gte: now } },
        orderBy: { endDate: 'desc' },
      }),
    ]

    const totalViews = totals?._sum.totalViews ?? 0
    const totalSaves = totals?._sum.totalSaves ?? 0
    const totalClicks = totals?._sum.totalClicks ?? 0
    const phoneClicks = currentWeekAnalytics?._sum.phoneClicks ?? 0
    const avgRating = Number(totals?._avg.avgRating ?? 0)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          firstName: dbUser.firstName,
          displayName: dbUser.displayName,
        },
        primaryBusiness: businesses[0] || null,
        businesses,
        stats: {
          totalViews,
          totalSaves,
          totalClicks,
          phoneClicks,
          avgRating,
          totalReviews: totals?._sum.totalReviews ?? 0,
          viewsTrend: trend(currentWeekAnalytics?._sum.views ?? 0, previousWeekAnalytics?._sum.views ?? 0),
          savesTrend: trend(currentWeekAnalytics?._sum.saves ?? 0, previousWeekAnalytics?._sum.saves ?? 0),
          phoneClicksTrend: trend(currentWeekAnalytics?._sum.phoneClicks ?? 0, previousWeekAnalytics?._sum.phoneClicks ?? 0),
          ratingTrend: 0,
        },
        recentReviews: recentReviews.map((review) => ({
          id: review.id,
          user: review.user.displayName || [review.user.firstName, review.user.lastName].filter(Boolean).join(' ') || 'Хэрэглэгч',
          business: review.business.nameMn,
          businessSlug: review.business.slug,
          rating: review.rating,
          body: review.body,
          createdAt: review.createdAt,
        })),
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          isAnnual: subscription.isAnnual,
          endDate: subscription.endDate,
          renewalDate: subscription.renewalDate,
          priceAtPurchase: Number(subscription.priceAtPurchase),
          currency: subscription.currency,
        } : null,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/business:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
