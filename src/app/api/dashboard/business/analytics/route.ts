import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/supabase/prisma'
import { getBusinessDashboardUser } from '@/lib/dashboard/business'

const PERIODS: Record<string, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
  '365': 365,
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  direct: { label: 'Шууд хандалт', color: '#3b82f6' },
  search: { label: 'Хайлтаас', color: '#8b5cf6' },
  map: { label: 'Газрын зургаас', color: '#22c55e' },
  featured: { label: 'Онцлох хэсгээс', color: '#f59e0b' },
  social: { label: 'Сошиалаас', color: '#ef4444' },
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
}

function trend(current: number, previous: number) {
  if (previous > 0) return ((current - previous) / previous) * 100
  return current > 0 ? 100 : 0
}

function emptyPoint(date: Date) {
  return {
    date: dateKey(date),
    label: dayLabel(date),
    views: 0,
    saves: 0,
    clicks: 0,
    phoneClicks: 0,
    websiteClicks: 0,
    mapClicks: 0,
    reviewsCount: 0,
  }
}

function readSources(value: Prisma.JsonValue | null): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.entries(value).reduce<Record<string, number>>((acc, [key, raw]) => {
    if (typeof raw === 'number' && Number.isFinite(raw)) acc[key] = raw
    return acc
  }, {})
}

export async function GET(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const period = request.nextUrl.searchParams.get('period') ?? '30'
    const days = PERIODS[period] ?? 30
    const businessId = request.nextUrl.searchParams.get('businessId')

    const businesses = await prisma.business.findMany({
      where: {
        ownerId: user.id,
        deletedAt: null,
        ...(businessId ? { id: businessId } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        nameMn: true,
        nameEn: true,
        avgRating: true,
        totalViews: true,
        totalSaves: true,
        totalClicks: true,
        totalReviews: true,
        category: { select: { nameMn: true, icon: true } },
      },
    })

    if (businessId && businesses.length === 0) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const businessIds = businesses.map((business) => business.id)
    const today = startOfToday()
    const currentStart = addDays(today, -(days - 1))
    const previousStart = addDays(currentStart, -days)

    const [currentRows, previousRows] = businessIds.length
      ? await Promise.all([
          prisma.businessAnalytics.findMany({
            where: {
              businessId: { in: businessIds },
              date: { gte: currentStart },
            },
            orderBy: { date: 'asc' },
          }),
          prisma.businessAnalytics.findMany({
            where: {
              businessId: { in: businessIds },
              date: { gte: previousStart, lt: currentStart },
            },
          }),
        ])
      : [[], []]

    const chartByDate = new Map<string, ReturnType<typeof emptyPoint>>()
    for (let i = 0; i < Math.min(days, 60); i += 1) {
      const date = addDays(currentStart, i)
      chartByDate.set(dateKey(date), emptyPoint(date))
    }

    const sources = Object.fromEntries(Object.keys(SOURCE_LABELS).map((key) => [key, 0])) as Record<string, number>
    const businessPerformance = new Map<string, {
      views: number
      saves: number
      clicks: number
      phoneClicks: number
      websiteClicks: number
      mapClicks: number
      reviewsCount: number
    }>()

    businessIds.forEach((id) => {
      businessPerformance.set(id, {
        views: 0,
        saves: 0,
        clicks: 0,
        phoneClicks: 0,
        websiteClicks: 0,
        mapClicks: 0,
        reviewsCount: 0,
      })
    })

    for (const row of currentRows) {
      const key = dateKey(row.date)
      const point = chartByDate.get(key)
      if (point) {
        point.views += row.views
        point.saves += row.saves
        point.clicks += row.clicks
        point.phoneClicks += row.phoneClicks
        point.websiteClicks += row.websiteClicks
        point.mapClicks += row.mapClicks
        point.reviewsCount += row.reviewsCount
      }

      const business = businessPerformance.get(row.businessId)
      if (business) {
        business.views += row.views
        business.saves += row.saves
        business.clicks += row.clicks
        business.phoneClicks += row.phoneClicks
        business.websiteClicks += row.websiteClicks
        business.mapClicks += row.mapClicks
        business.reviewsCount += row.reviewsCount
      }

      const rowSources = readSources(row.sources)
      Object.entries(rowSources).forEach(([key, value]) => {
        sources[key] = (sources[key] ?? 0) + value
      })
    }

    const current = currentRows.reduce(
      (acc, row) => ({
        views: acc.views + row.views,
        saves: acc.saves + row.saves,
        clicks: acc.clicks + row.clicks,
        phoneClicks: acc.phoneClicks + row.phoneClicks,
        websiteClicks: acc.websiteClicks + row.websiteClicks,
        mapClicks: acc.mapClicks + row.mapClicks,
        reviewsCount: acc.reviewsCount + row.reviewsCount,
      }),
      { views: 0, saves: 0, clicks: 0, phoneClicks: 0, websiteClicks: 0, mapClicks: 0, reviewsCount: 0 }
    )

    const previous = previousRows.reduce(
      (acc, row) => ({
        views: acc.views + row.views,
        saves: acc.saves + row.saves,
        clicks: acc.clicks + row.clicks,
        phoneClicks: acc.phoneClicks + row.phoneClicks,
        websiteClicks: acc.websiteClicks + row.websiteClicks,
        mapClicks: acc.mapClicks + row.mapClicks,
        reviewsCount: acc.reviewsCount + row.reviewsCount,
      }),
      { views: 0, saves: 0, clicks: 0, phoneClicks: 0, websiteClicks: 0, mapClicks: 0, reviewsCount: 0 }
    )

    const ratedBusinesses = businesses.filter((business) => Number(business.avgRating) > 0)
    const avgRating = ratedBusinesses.length
      ? ratedBusinesses.reduce((sum, business) => sum + Number(business.avgRating), 0) / ratedBusinesses.length
      : 0

    const sourceTotal = Object.values(sources).reduce((sum, value) => sum + value, 0)
    const sourceData = Object.entries(SOURCE_LABELS).map(([key, config]) => ({
      key,
      name: config.label,
      value: sources[key] ?? 0,
      percent: sourceTotal > 0 ? ((sources[key] ?? 0) / sourceTotal) * 100 : 0,
      color: config.color,
    }))

    const topBusinesses = businesses
      .map((business) => {
        const performance = businessPerformance.get(business.id)
        return {
          id: business.id,
          slug: business.slug,
          name: business.nameMn || business.nameEn || 'Нэргүй бизнес',
          category: business.category.nameMn,
          icon: business.category.icon,
          views: performance?.views ?? 0,
          saves: performance?.saves ?? 0,
          clicks: performance?.clicks ?? 0,
          phoneClicks: performance?.phoneClicks ?? 0,
          reviewsCount: performance?.reviewsCount ?? 0,
          totalViews: business.totalViews,
          totalSaves: business.totalSaves,
          totalClicks: business.totalClicks,
          totalReviews: business.totalReviews,
          avgRating: Number(business.avgRating),
        }
      })
      .sort((a, b) => b.views - a.views || b.totalViews - a.totalViews)
      .slice(0, 8)

    return NextResponse.json({
      success: true,
      data: {
        period,
        days,
        businesses: businesses.map((business) => ({
          id: business.id,
          name: business.nameMn || business.nameEn || 'Нэргүй бизнес',
          slug: business.slug,
        })),
        metrics: {
          views: current.views,
          saves: current.saves,
          clicks: current.clicks,
          phoneClicks: current.phoneClicks,
          websiteClicks: current.websiteClicks,
          mapClicks: current.mapClicks,
          reviewsCount: current.reviewsCount,
          avgRating,
          viewsTrend: trend(current.views, previous.views),
          savesTrend: trend(current.saves, previous.saves),
          clicksTrend: trend(current.clicks, previous.clicks),
          phoneClicksTrend: trend(current.phoneClicks, previous.phoneClicks),
          websiteClicksTrend: trend(current.websiteClicks, previous.websiteClicks),
          mapClicksTrend: trend(current.mapClicks, previous.mapClicks),
        },
        chart: Array.from(chartByDate.values()),
        clickTypes: [
          { name: 'Утас', value: current.phoneClicks },
          { name: 'Вэбсайт', value: current.websiteClicks },
          { name: 'Газрын зураг', value: current.mapClicks },
          { name: 'Бусад товшилт', value: Math.max(0, current.clicks - current.phoneClicks - current.websiteClicks - current.mapClicks) },
        ],
        sources: sourceData,
        topBusinesses,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/business/analytics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
