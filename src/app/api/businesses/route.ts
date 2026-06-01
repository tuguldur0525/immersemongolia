// src/app/api/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import type { ApiResponse, SearchFilters } from '@/types'

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
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const params = searchSchema.parse(Object.fromEntries(searchParams))

    const { page, limit, sortBy, ...filters } = params
    const skip = (page - 1) * limit

    // Build WHERE clause
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      deletedAt: null,
    }

    if (filters.query) {
      where.OR = [
        { nameMn: { contains: filters.query, mode: 'insensitive' } },
        { nameEn: { contains: filters.query, mode: 'insensitive' } },
        { descriptionMn: { contains: filters.query, mode: 'insensitive' } },
        { tags: { has: filters.query } },
      ]
    }

    if (filters.categorySlug) {
      where.category = { slug: filters.categorySlug }
    }

    if (filters.city) where.city = { equals: filters.city, mode: 'insensitive' }
    if (filters.district) where.district = { equals: filters.district, mode: 'insensitive' }
    if (filters.isVerified === 'true') where.isVerified = true
    if (filters.isFeatured === 'true') where.isFeatured = true
    if (filters.hasVirtualTour === 'true') where.virtualTourUrl = { not: null }
    if (filters.minRating) where.avgRating = { gte: filters.minRating }
    if (filters.priceRange) {
      where.priceRange = { in: filters.priceRange.split(',') }
    }

    // Build ORDER BY
    const orderBy: Record<string, unknown>[] = []
    switch (sortBy) {
      case 'rating':
        orderBy.push({ avgRating: 'desc' }, { totalReviews: 'desc' })
        break
      case 'reviews':
        orderBy.push({ totalReviews: 'desc' })
        break
      case 'newest':
        orderBy.push({ createdAt: 'desc' })
        break
      default:
        orderBy.push({ isFeatured: 'desc' }, { isPremium: 'desc' }, { avgRating: 'desc' })
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      prisma.business.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        businesses,
        total,
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

const createBusinessSchema = z.object({
  nameMn: z.string().min(2).max(200),
  nameEn: z.string().min(2).max(200).optional(),
  descriptionMn: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  categoryId: z.string().uuid(),
  addressMn: z.string().max(500).optional(),
  addressEn: z.string().max(500).optional(),
  district: z.string().max(100).optional(),
  city: z.string().default('Ulaanbaatar'),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, role: true },
    })
    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const data = createBusinessSchema.parse(body)

    const baseSlug = slugify(data.nameMn)
    let slug = baseSlug
    let counter = 1
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const business = await prisma.business.create({
      data: {
        ...data,
        slug,
        ownerId: dbUser.id,
        status: 'PENDING_REVIEW',
      },
    })

    // Update user role if needed
    if (dbUser.role === 'USER') {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'BUSINESS_OWNER' },
      })
    }

    return NextResponse.json({ success: true, data: business }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/businesses error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
