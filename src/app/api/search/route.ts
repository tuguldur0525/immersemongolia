// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const take = Math.min(Math.max(limit, 1), 20)
    const where: Prisma.BusinessWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      OR: [
        { nameMn: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { descriptionMn: { contains: q, mode: 'insensitive' } },
        { descriptionEn: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ],
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
      take,
      select: {
        id: true,
        slug: true,
        nameMn: true,
        nameEn: true,
        coverImageUrl: true,
        avgRating: true,
        totalReviews: true,
        isVerified: true,
      },
    })

    const results = businesses.map((business) => ({
      ...business,
      avgRating: Number(business.avgRating),
    }))

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('GET /api/search:', error)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}
