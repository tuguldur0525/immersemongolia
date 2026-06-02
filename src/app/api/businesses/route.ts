// src/app/api/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'
import { slugify } from '@/lib/utils'
import type { ApiResponse } from '@/types'

const businessStatuses = ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'CLAIMED'] as const

const searchSchema = z.object({
  query: z.string().optional(),
  categorySlug: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  priceRange: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  isVerified: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  hasVirtualTour: z.enum(['true', 'false']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().default(10),
  sortBy: z.enum(['relevance', 'rating', 'reviews', 'distance', 'newest']).default('relevance'),
  scope: z.enum(['public', 'mine', 'admin']).default('public'),
  status: z.enum(['ALL', ...businessStatuses]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalString = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional())

const optionalEmail = z.preprocess(blankToUndefined, z.string().trim().email().optional())
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url().optional())
const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional())

const businessPayloadSchema = z.object({
  ownerEmail: optionalEmail,
  nameMn: z.string().trim().min(2).max(200),
  nameEn: optionalString(200),
  descriptionMn: optionalString(5000),
  descriptionEn: optionalString(5000),
  taglineMn: optionalString(300),
  taglineEn: optionalString(300),
  categoryId: z.string().uuid(),
  addressMn: optionalString(500),
  addressEn: optionalString(500),
  district: optionalString(100),
  city: z.string().trim().min(1).max(100).default('Ulaanbaatar'),
  phone: optionalString(20),
  phone2: optionalString(20),
  email: optionalEmail,
  website: optionalUrl,
  whatsapp: optionalString(30),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  amenities: z.array(z.string().trim().min(1).max(80)).default([]),
  facebook: optionalUrl,
  instagram: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalUrl,
  virtualTourUrl: optionalUrl,
  virtualTourType: optionalString(40),
  status: z.enum(businessStatuses).optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
})

async function getRequester() {
  const supabase = await createClient()
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return user
}

function isAdminRole(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function businessSelect() {
  return {
    id: true,
    slug: true,
    ownerId: true,
    categoryId: true,
    status: true,
    isVerified: true,
    isFeatured: true,
    isPremium: true,
    featuredUntil: true,
    nameMn: true,
    nameEn: true,
    descriptionMn: true,
    descriptionEn: true,
    taglineMn: true,
    taglineEn: true,
    addressMn: true,
    addressEn: true,
    district: true,
    city: true,
    country: true,
    latitude: true,
    longitude: true,
    phone: true,
    phone2: true,
    email: true,
    website: true,
    whatsapp: true,
    facebook: true,
    instagram: true,
    twitter: true,
    youtube: true,
    tiktok: true,
    priceRange: true,
    starRating: true,
    tags: true,
    amenities: true,
    avgRating: true,
    totalReviews: true,
    totalViews: true,
    totalSaves: true,
    totalClicks: true,
    weeklyViews: true,
    monthlyViews: true,
    logoUrl: true,
    coverImageUrl: true,
    virtualTourUrl: true,
    virtualTourType: true,
    createdAt: true,
    updatedAt: true,
    category: {
      select: { id: true, slug: true, nameMn: true, nameEn: true, icon: true, color: true },
    },
    owner: {
      select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
    },
  } satisfies Prisma.BusinessSelect
}

type BusinessRow = Prisma.BusinessGetPayload<{ select: ReturnType<typeof businessSelect> }>

function serializeBusiness(business: BusinessRow) {
  return {
    ...business,
    latitude: business.latitude === null ? null : Number(business.latitude),
    longitude: business.longitude === null ? null : Number(business.longitude),
    starRating: business.starRating === null ? null : Number(business.starRating),
    avgRating: Number(business.avgRating),
    ownerName:
      business.owner?.displayName ||
      [business.owner?.firstName, business.owner?.lastName].filter(Boolean).join(' ') ||
      business.owner?.email ||
      'Тодорхойгүй',
    plan: business.isPremium ? 'PROFESSIONAL' : 'FREE',
  }
}

function buildOrderBy(sortBy: z.infer<typeof searchSchema>['sortBy']): Prisma.BusinessOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'rating':
      return [{ avgRating: 'desc' }, { totalReviews: 'desc' }]
    case 'reviews':
      return [{ totalReviews: 'desc' }]
    case 'newest':
      return [{ createdAt: 'desc' }]
    default:
      return [{ isFeatured: 'desc' }, { isPremium: 'desc' }, { avgRating: 'desc' }]
  }
}

async function resolveOwnerByEmail(ownerEmail: string | undefined, fallbackOwnerId: string | null) {
  if (!ownerEmail) return fallbackOwnerId

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, role: true },
  })

  if (!owner) {
    throw new Error('OWNER_NOT_FOUND')
  }

  if (owner.role === 'USER') {
    await prisma.user.update({
      where: { id: owner.id },
      data: { role: 'BUSINESS_OWNER' },
    })
  }

  return owner.id
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const params = searchSchema.parse(Object.fromEntries(searchParams))

    const { page, limit, sortBy, scope, status, ...filters } = params
    const skip = (page - 1) * limit
    const where: Prisma.BusinessWhereInput = { deletedAt: null }
    let statusCountBaseWhere: Prisma.BusinessWhereInput | null = null

    if (scope === 'public') {
      where.status = 'ACTIVE'
    } else {
      const requester = await getRequester()
      if (!requester) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      const isAdmin = isAdminRole(requester.role)
      if (scope === 'admin') {
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }
      } else {
        where.ownerId = requester.id
      }

      statusCountBaseWhere = { ...where }
      if (status && status !== 'ALL') where.status = status
    }

    if (filters.query) {
      where.OR = [
        { nameMn: { contains: filters.query, mode: 'insensitive' } },
        { nameEn: { contains: filters.query, mode: 'insensitive' } },
        { descriptionMn: { contains: filters.query, mode: 'insensitive' } },
        { owner: { email: { contains: filters.query, mode: 'insensitive' } } },
        { tags: { has: filters.query } },
      ]
    }

    if (filters.categorySlug) where.category = { slug: filters.categorySlug }
    if (filters.city) where.city = { equals: filters.city, mode: 'insensitive' }
    if (filters.district) where.district = { equals: filters.district, mode: 'insensitive' }
    if (filters.isVerified === 'true') where.isVerified = true
    if (filters.isFeatured === 'true') where.isFeatured = true
    if (filters.hasVirtualTour === 'true') where.virtualTourUrl = { not: null }
    if (filters.minRating) where.avgRating = { gte: filters.minRating }
    if (filters.priceRange) where.priceRange = { in: filters.priceRange.split(',') }

    const [businesses, total, statusGroups] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: buildOrderBy(sortBy),
        skip,
        take: limit,
        select: businessSelect(),
      }),
      prisma.business.count({ where }),
      statusCountBaseWhere
        ? prisma.business.groupBy({
            by: ['status'],
            where: statusCountBaseWhere,
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ])

    const totalPages = Math.ceil(total / limit)
    const statusCounts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count._all
      return acc
    }, {})

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        businesses: businesses.map(serializeBusiness),
        total,
        statusCounts,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters', details: error.errors }, { status: 400 })
    }
    console.error('GET /api/businesses error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const requester = await getRequester()
    if (!requester) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = businessPayloadSchema.parse(body)
    const isAdmin = isAdminRole(requester.role)

    if (!isAdmin && requester.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
      select: { id: true },
    })
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 422 })
    }

    const ownerId = await resolveOwnerByEmail(
      isAdmin ? data.ownerEmail : undefined,
      requester.id
    )

    const baseSlug = slugify(data.nameMn) || `business-${Date.now()}`
    let slug = baseSlug
    let counter = 1
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const {
      ownerEmail,
      status,
      isVerified,
      isFeatured,
      isPremium,
      ...businessData
    } = data

    const business = await prisma.business.create({
      data: {
        ...businessData,
        slug,
        ownerId,
        status: isAdmin ? status ?? 'ACTIVE' : 'PENDING_REVIEW',
        isVerified: isAdmin ? isVerified ?? true : false,
        isFeatured: isAdmin ? isFeatured ?? false : false,
        isPremium: isAdmin ? isPremium ?? false : false,
      },
      select: businessSelect(),
    })

    if (ownerId && requester.role === 'USER') {
      await prisma.user.update({
        where: { id: ownerId },
        data: { role: 'BUSINESS_OWNER' },
      })
    }

    return NextResponse.json({ success: true, data: serializeBusiness(business) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    if (error instanceof Error && error.message === 'OWNER_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Owner email was not found' }, { status: 422 })
    }
    console.error('POST /api/businesses error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
