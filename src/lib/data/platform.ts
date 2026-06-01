import type { Prisma } from '@prisma/client'
import prisma from '@/lib/supabase/prisma'

const activeBusinessWhere = {
  status: 'ACTIVE',
  deletedAt: null,
} satisfies Prisma.BusinessWhereInput

const featuredBusinessWhere = (now: Date) => ({
  ...activeBusinessWhere,
  isFeatured: true,
  OR: [{ featuredUntil: null }, { featuredUntil: { gte: now } }],
}) satisfies Prisma.BusinessWhereInput

const publishedReviewWhere = {
  status: 'PUBLISHED',
  deletedAt: null,
} satisfies Prisma.ReviewWhereInput

export interface PlatformStats {
  totalBusinesses: number
  totalReviews: number
  totalUsers: number
  coveredCities: number
  businessesWithLocation: number
  featuredBusinesses: number
  virtualTourBusinesses: number
  averageRating: number
  newUsersLast7Days: number
  newBusinessesLast7Days: number
  pendingBusinesses: number
  pendingReviews: number
  monthlyRevenueMnt: number
  activeSubscriptions: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalBusinesses,
    totalReviews,
    totalUsers,
    coveredCities,
    businessesWithLocation,
    featuredBusinesses,
    virtualTourBusinesses,
    ratingAggregate,
    newUsersLast7Days,
    newBusinessesLast7Days,
    pendingBusinesses,
    pendingReviews,
    monthlyRevenue,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.business.count({ where: activeBusinessWhere }),
    prisma.review.count({ where: publishedReviewWhere }),
    prisma.user.count({ where: { isActive: true, deletedAt: null } }),
    prisma.business.findMany({
      where: { ...activeBusinessWhere, city: { not: '' } },
      distinct: ['city'],
      select: { city: true },
    }),
    prisma.business.count({
      where: {
        ...activeBusinessWhere,
        latitude: { not: null },
        longitude: { not: null },
      },
    }),
    prisma.business.count({ where: featuredBusinessWhere(now) }),
    prisma.business.count({
      where: { ...activeBusinessWhere, virtualTourUrl: { not: null } },
    }),
    prisma.business.aggregate({
      where: { ...activeBusinessWhere, totalReviews: { gt: 0 } },
      _avg: { avgRating: true },
    }),
    prisma.user.count({
      where: { isActive: true, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.business.count({
      where: { ...activeBusinessWhere, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.business.count({ where: { status: 'PENDING_REVIEW', deletedAt: null } }),
    prisma.review.count({
      where: {
        deletedAt: null,
        status: { in: ['PENDING_MODERATION', 'FLAGGED'] },
      },
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
  ])

  return {
    totalBusinesses,
    totalReviews,
    totalUsers,
    coveredCities: coveredCities.length,
    businessesWithLocation,
    featuredBusinesses,
    virtualTourBusinesses,
    averageRating: Number(ratingAggregate._avg.avgRating ?? 0),
    newUsersLast7Days,
    newBusinessesLast7Days,
    pendingBusinesses,
    pendingReviews,
    monthlyRevenueMnt: Number(monthlyRevenue._sum.amount ?? 0),
    activeSubscriptions,
  }
}
