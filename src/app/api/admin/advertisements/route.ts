import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getAdminRequester } from '@/lib/admin/auth'

const adTypes = ['BANNER', 'FEATURED_LISTING', 'CATEGORY_SPONSOR', 'MAP_PIN'] as const

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalString = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional())

const optionalMoney = z.preprocess(blankToUndefined, z.coerce.number().min(0).optional())
const optionalDate = z.preprocess(
  blankToUndefined,
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date').optional()
)

const listAdsSchema = z.object({
  query: z.string().trim().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).default('ALL'),
  type: z.enum(['ALL', ...adTypes]).default('ALL'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

const createAdSchema = z.object({
  businessId: z.string().uuid(),
  type: z.enum(adTypes),
  titleMn: z.string().trim().min(2).max(200),
  titleEn: optionalString(200),
  imageUrl: optionalString(500),
  targetUrl: optionalString(500),
  targetCategory: optionalString(100),
  budget: optionalMoney,
  cpmRate: optionalMoney,
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().default(true),
})

function serializeAd(ad: Prisma.AdvertisementGetPayload<{
  include: {
    business: {
      select: {
        id: true
        slug: true
        nameMn: true
        category: { select: { nameMn: true; icon: true } }
      }
    }
  }
}>) {
  const impressions = ad.impressions
  const clicks = ad.clicks
  return {
    id: ad.id,
    businessId: ad.businessId,
    type: ad.type,
    titleMn: ad.titleMn,
    titleEn: ad.titleEn,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
    targetCategory: ad.targetCategory,
    budget: ad.budget === null ? null : Number(ad.budget),
    cpmRate: ad.cpmRate === null ? null : Number(ad.cpmRate),
    impressions,
    clicks,
    spend: Number(ad.spend),
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    isActive: ad.isActive,
    startsAt: ad.startsAt,
    endsAt: ad.endsAt,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
    business: {
      id: ad.business.id,
      slug: ad.business.slug,
      name: ad.business.nameMn,
      category: ad.business.category.nameMn,
      categoryIcon: ad.business.category.icon,
    },
  }
}

function normalizeAdPayload(data: z.infer<typeof createAdSchema>) {
  return {
    ...data,
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
  }
}

export async function GET(request: NextRequest) {
  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { query, status, type, page, limit } = listAdsSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const where: Prisma.AdvertisementWhereInput = {}
    const countBaseWhere: Prisma.AdvertisementWhereInput = {}

    if (status !== 'ALL') where.isActive = status === 'ACTIVE'
    if (type !== 'ALL') where.type = type
    if (query) {
      where.OR = [
        { titleMn: { contains: query, mode: 'insensitive' } },
        { titleEn: { contains: query, mode: 'insensitive' } },
        { business: { nameMn: { contains: query, mode: 'insensitive' } } },
      ]
      countBaseWhere.OR = where.OR
    }

    const [advertisements, total, typeGroups, activeCount, inactiveCount, businesses, adSums] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              slug: true,
              nameMn: true,
              category: { select: { nameMn: true, icon: true } },
            },
          },
        },
      }),
      prisma.advertisement.count({ where }),
      prisma.advertisement.groupBy({
        by: ['type'],
        where: countBaseWhere,
        _count: { _all: true },
      }),
      prisma.advertisement.count({ where: { ...countBaseWhere, isActive: true } }),
      prisma.advertisement.count({ where: { ...countBaseWhere, isActive: false } }),
      prisma.business.findMany({
        where: { deletedAt: null },
        orderBy: { nameMn: 'asc' },
        select: { id: true, nameMn: true, slug: true, category: { select: { nameMn: true, icon: true } } },
      }),
      prisma.advertisement.aggregate({
        where: countBaseWhere,
        _sum: { impressions: true, clicks: true, spend: true },
      }),
    ])

    const typeCounts = typeGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.type] = group._count._all
      return acc
    }, {})
    const impressions = adSums._sum.impressions ?? 0
    const clicks = adSums._sum.clicks ?? 0

    return NextResponse.json({
      success: true,
      data: {
        advertisements: advertisements.map(serializeAd),
        businesses: businesses.map((business) => ({
          id: business.id,
          name: business.nameMn,
          slug: business.slug,
          category: business.category.nameMn,
          categoryIcon: business.category.icon,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        typeCounts,
        statusCounts: {
          ACTIVE: activeCount,
          INACTIVE: inactiveCount,
        },
        summary: {
          impressions,
          clicks,
          spend: Number(adSums._sum.spend ?? 0),
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters', details: error.errors }, { status: 400 })
    }
    console.error('GET /api/admin/advertisements:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createAdSchema.parse(body)

    const business = await prisma.business.findFirst({
      where: { id: data.businessId, deletedAt: null },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 422 })
    }

    const advertisement = await prisma.advertisement.create({
      data: normalizeAdPayload(data),
      include: {
        business: {
          select: {
            id: true,
            slug: true,
            nameMn: true,
            category: { select: { nameMn: true, icon: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: serializeAd(advertisement) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/admin/advertisements:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
