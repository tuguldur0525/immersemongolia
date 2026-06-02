// src/app/api/map/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'

const mapQuerySchema = z.object({
  swLat: z.coerce.number(),
  swLng: z.coerce.number(),
  neLat: z.coerce.number(),
  neLng: z.coerce.number(),
  query: z.string().trim().max(120).optional(),
  categorySlug: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  priceRange: z.string().optional(),
  isVerified: z.enum(['true', 'false']).optional(),
  hasVirtualTour: z.enum(['true', 'false']).optional(),
  zoom: z.coerce.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const params = mapQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      deletedAt: null,
      latitude: { gte: params.swLat, lte: params.neLat },
      longitude: { gte: params.swLng, lte: params.neLng },
    }

    if (params.categorySlug) where.category = { slug: params.categorySlug }
    if (params.isVerified === 'true') where.isVerified = true
    if (params.hasVirtualTour === 'true') where.virtualTourUrl = { not: null }
    if (params.minRating) where.avgRating = { gte: params.minRating }
    if (params.priceRange) {
      where.priceRange = { in: params.priceRange.split(',').filter(Boolean) }
    }
    if (params.query) {
      where.OR = [
        { nameMn: { contains: params.query, mode: 'insensitive' } },
        { nameEn: { contains: params.query, mode: 'insensitive' } },
        { addressMn: { contains: params.query, mode: 'insensitive' } },
        { addressEn: { contains: params.query, mode: 'insensitive' } },
        { district: { contains: params.query, mode: 'insensitive' } },
        { city: { contains: params.query, mode: 'insensitive' } },
        { category: { nameMn: { contains: params.query, mode: 'insensitive' } } },
        { category: { nameEn: { contains: params.query, mode: 'insensitive' } } },
      ]
    }

    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        slug: true,
        nameMn: true,
        nameEn: true,
        latitude: true,
        longitude: true,
        avgRating: true,
        totalReviews: true,
        logoUrl: true,
        coverImageUrl: true,
        isVerified: true,
        isFeatured: true,
        priceRange: true,
        category: {
          select: { slug: true, nameMn: true, nameEn: true, color: true, icon: true },
        },
      },
      take: 500, // Limit for performance
    })

    // Transform to GeoJSON for Mapbox
    const geojson = {
      type: 'FeatureCollection',
      features: businesses
        .filter(b => b.latitude && b.longitude)
        .map(b => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(b.longitude), Number(b.latitude)],
          },
          properties: {
            id: b.id,
            slug: b.slug,
            nameMn: b.nameMn,
            nameEn: b.nameEn,
            avgRating: Number(b.avgRating),
            totalReviews: b.totalReviews,
            logoUrl: b.logoUrl,
            coverImageUrl: b.coverImageUrl,
            isVerified: b.isVerified,
            isFeatured: b.isFeatured,
            priceRange: b.priceRange,
            categorySlug: b.category.slug,
            categoryColor: b.category.color,
            categoryIcon: b.category.icon,
            categoryNameMn: b.category.nameMn,
          },
        })),
    }

    return NextResponse.json({ success: true, data: geojson, count: businesses.length })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    console.error('GET /api/map:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Nearby businesses (by coordinates)
export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radiusKm = 5, limit = 20, categorySlug } = await request.json()

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'lat and lng required' }, { status: 400 })
    }

    // Use Haversine formula approximation with bounding box
    const kmPerDegLat = 111
    const kmPerDegLng = 111 * Math.cos(lat * Math.PI / 180)
    const latDelta = radiusKm / kmPerDegLat
    const lngDelta = radiusKm / kmPerDegLng

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      deletedAt: null,
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    }

    if (categorySlug) where.category = { slug: categorySlug }

    const businesses = await prisma.business.findMany({
      where,
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
      select: {
        id: true,
        slug: true,
        nameMn: true,
        nameEn: true,
        coverImageUrl: true,
        avgRating: true,
        totalReviews: true,
        isVerified: true,
        priceRange: true,
        addressMn: true,
        latitude: true,
        longitude: true,
        category: { select: { slug: true, nameMn: true, icon: true, color: true } },
      },
    })

    // Calculate actual distance
    const withDistance = businesses.map(b => {
      const dLat = (Number(b.latitude) - lat) * Math.PI / 180
      const dLng = (Number(b.longitude) - lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(Number(b.latitude) * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return { ...b, distanceKm: Math.round(distanceKm * 10) / 10 }
    }).sort((a, b) => a.distanceKm - b.distanceKm)

    return NextResponse.json({ success: true, data: withDistance })
  } catch (error) {
    console.error('POST /api/map:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
