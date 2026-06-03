import { NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = await ensureUserProfile(authUser)

    const [profile, savedBusinesses, recentlyViewed, reviews] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          preferredLanguage: true,
          createdAt: true,
          _count: { select: { reviews: true, savedBusinesses: true, businesses: true } },
        },
      }),
      prisma.savedBusiness.findMany({
        where: {
          userId: user.id,
          business: { status: 'ACTIVE', deletedAt: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          createdAt: true,
          business: {
            select: {
              id: true,
              slug: true,
              nameMn: true,
              nameEn: true,
              coverImageUrl: true,
              logoUrl: true,
              avgRating: true,
              totalReviews: true,
              city: true,
              district: true,
              category: { select: { nameMn: true, nameEn: true, icon: true } },
            },
          },
        },
      }),
      prisma.recentlyViewed.findMany({
        where: {
          userId: user.id,
          business: { status: 'ACTIVE', deletedAt: null },
        },
        orderBy: { viewedAt: 'desc' },
        take: 8,
        select: {
          viewedAt: true,
          source: true,
          business: {
            select: {
              id: true,
              slug: true,
              nameMn: true,
              nameEn: true,
              avgRating: true,
              totalReviews: true,
              category: { select: { nameMn: true, nameEn: true, icon: true } },
            },
          },
        },
      }),
      prisma.review.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          business: {
            select: {
              slug: true,
              nameMn: true,
              nameEn: true,
              category: { select: { nameMn: true, nameEn: true, icon: true } },
            },
          },
        },
      }),
    ])

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        savedBusinesses: savedBusinesses.map((item) => ({
          ...item.business,
          avgRating: Number(item.business.avgRating),
          savedAt: item.createdAt,
        })),
        recentlyViewed: recentlyViewed.map((item) => ({
          ...item.business,
          avgRating: Number(item.business.avgRating),
          viewedAt: item.viewedAt,
          source: item.source,
        })),
        reviews,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/user:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
