import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getAdminRequester } from '@/lib/admin/auth'

const analyticsQuerySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(30),
})

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addToSeries(
  series: Map<string, {
    newUsers: number
    newBusinesses: number
    reviews: number
    revenueMnt: number
    views: number
    clicks: number
  }>,
  date: Date,
  patch: Partial<{
    newUsers: number
    newBusinesses: number
    reviews: number
    revenueMnt: number
    views: number
    clicks: number
  }>
) {
  const key = dateKey(date)
  const current = series.get(key)
  if (!current) return

  series.set(key, {
    newUsers: current.newUsers + (patch.newUsers ?? 0),
    newBusinesses: current.newBusinesses + (patch.newBusinesses ?? 0),
    reviews: current.reviews + (patch.reviews ?? 0),
    revenueMnt: current.revenueMnt + (patch.revenueMnt ?? 0),
    views: current.views + (patch.views ?? 0),
    clicks: current.clicks + (patch.clicks ?? 0),
  })
}

export async function GET(request: NextRequest) {
  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { days } = analyticsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    const previousStart = new Date(start)
    previousStart.setDate(previousStart.getDate() - days)

    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      activeSubscriptions,
      newUsers,
      newBusinesses,
      newReviews,
      rangePayments,
      previousRevenue,
      businessAnalytics,
      topBusinesses,
      businessesForCategories,
      reviewGroups,
      allAds,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.business.count({ where: { deletedAt: null } }),
      prisma.review.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
      prisma.user.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.business.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.review.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: start } },
        select: {
          amount: true,
          paidAt: true,
          subscription: { select: { plan: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: previousStart, lt: start } },
        _sum: { amount: true },
      }),
      prisma.businessAnalytics.findMany({
        where: { date: { gte: start } },
        select: { date: true, views: true, clicks: true, saves: true },
      }),
      prisma.business.findMany({
        where: { deletedAt: null },
        orderBy: [{ totalViews: 'desc' }, { totalReviews: 'desc' }],
        take: 8,
        select: {
          id: true,
          slug: true,
          nameMn: true,
          avgRating: true,
          totalReviews: true,
          totalViews: true,
          totalClicks: true,
          totalSaves: true,
          category: { select: { nameMn: true, icon: true } },
        },
      }),
      prisma.business.findMany({
        where: { deletedAt: null },
        select: {
          totalViews: true,
          totalReviews: true,
          category: { select: { id: true, nameMn: true, icon: true } },
        },
      }),
      prisma.review.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.advertisement.findMany({
        select: {
          isActive: true,
          impressions: true,
          clicks: true,
          spend: true,
        },
      }),
    ])

    const trend = new Map<string, {
      newUsers: number
      newBusinesses: number
      reviews: number
      revenueMnt: number
      views: number
      clicks: number
    }>()

    for (let i = 0; i < days; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      trend.set(dateKey(day), { newUsers: 0, newBusinesses: 0, reviews: 0, revenueMnt: 0, views: 0, clicks: 0 })
    }

    newUsers.forEach((user) => addToSeries(trend, user.createdAt, { newUsers: 1 }))
    newBusinesses.forEach((business) => addToSeries(trend, business.createdAt, { newBusinesses: 1 }))
    newReviews.forEach((review) => addToSeries(trend, review.createdAt, { reviews: 1 }))
    rangePayments.forEach((payment) => {
      if (payment.paidAt) addToSeries(trend, payment.paidAt, { revenueMnt: Number(payment.amount) })
    })
    businessAnalytics.forEach((row) => addToSeries(trend, row.date, { views: row.views, clicks: row.clicks }))

    const totalRevenueMnt = rangePayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const previousRevenueMnt = Number(previousRevenue._sum.amount ?? 0)
    const revenueDeltaPct = previousRevenueMnt > 0
      ? ((totalRevenueMnt - previousRevenueMnt) / previousRevenueMnt) * 100
      : totalRevenueMnt > 0 ? 100 : 0
    const totalViews = businessAnalytics.reduce((sum, row) => sum + row.views, 0)
    const totalClicks = businessAnalytics.reduce((sum, row) => sum + row.clicks, 0)
    const totalSaves = businessAnalytics.reduce((sum, row) => sum + row.saves, 0)

    const categoryMap = new Map<string, {
      id: string
      name: string
      icon: string | null
      businessCount: number
      views: number
      reviews: number
    }>()
    businessesForCategories.forEach((business) => {
      const current = categoryMap.get(business.category.id) ?? {
        id: business.category.id,
        name: business.category.nameMn,
        icon: business.category.icon,
        businessCount: 0,
        views: 0,
        reviews: 0,
      }
      current.businessCount += 1
      current.views += business.totalViews
      current.reviews += business.totalReviews
      categoryMap.set(business.category.id, current)
    })

    const paymentsByPlanMap = new Map<string, { plan: string; payments: number; revenueMnt: number }>()
    rangePayments.forEach((payment) => {
      const plan = payment.subscription?.plan ?? 'DIRECT'
      const current = paymentsByPlanMap.get(plan) ?? { plan, payments: 0, revenueMnt: 0 }
      current.payments += 1
      current.revenueMnt += Number(payment.amount)
      paymentsByPlanMap.set(plan, current)
    })

    const adTotals = allAds.reduce((acc, ad) => {
      acc.total += 1
      if (ad.isActive) acc.active += 1
      acc.impressions += ad.impressions
      acc.clicks += ad.clicks
      acc.spendMnt += Number(ad.spend)
      return acc
    }, { total: 0, active: 0, impressions: 0, clicks: 0, spendMnt: 0 })

    const reviewStatusCounts = reviewGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count._all
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalBusinesses,
          totalReviews,
          activeSubscriptions,
          newUsers: newUsers.length,
          newBusinesses: newBusinesses.length,
          newReviews: newReviews.length,
          totalRevenueMnt,
          revenueDeltaPct,
          totalViews,
          totalClicks,
          totalSaves,
          adCtr: adTotals.impressions > 0 ? (adTotals.clicks / adTotals.impressions) * 100 : 0,
        },
        trend: Array.from(trend.entries()).map(([date, value]) => ({ date, ...value })),
        topBusinesses: topBusinesses.map((business) => ({
          id: business.id,
          slug: business.slug,
          name: business.nameMn,
          category: business.category.nameMn,
          categoryIcon: business.category.icon,
          rating: Number(business.avgRating),
          reviews: business.totalReviews,
          views: business.totalViews,
          clicks: business.totalClicks,
          saves: business.totalSaves,
        })),
        categories: Array.from(categoryMap.values())
          .sort((a, b) => b.views - a.views)
          .slice(0, 8),
        paymentsByPlan: Array.from(paymentsByPlanMap.values()).sort((a, b) => b.revenueMnt - a.revenueMnt),
        reviewStatusCounts,
        ads: adTotals,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters', details: error.errors }, { status: 400 })
    }
    console.error('GET /api/admin/analytics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
