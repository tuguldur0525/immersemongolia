import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getAdminRequester } from '@/lib/admin/auth'

const roles = ['USER', 'BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'] as const

const usersQuerySchema = z.object({
  query: z.string().trim().optional(),
  role: z.enum(['ALL', ...roles]).default('ALL'),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).default('ALL'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

export async function GET(request: NextRequest) {
  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const { query, role, status, page, limit } = usersQuerySchema.parse(Object.fromEntries(searchParams))
    const where: Prisma.UserWhereInput = { deletedAt: null }
    const countBaseWhere: Prisma.UserWhereInput = { deletedAt: null }

    if (role !== 'ALL') where.role = role
    if (status !== 'ALL') where.isActive = status === 'ACTIVE'

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ]
      countBaseWhere.OR = where.OR
    }

    const [users, total, roleGroups, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          loginCount: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { businesses: true, reviews: true, savedBusinesses: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['role'],
        where: countBaseWhere,
        _count: { _all: true },
      }),
      prisma.user.count({ where: { ...countBaseWhere, isActive: true } }),
      prisma.user.count({ where: { ...countBaseWhere, isActive: false } }),
    ])

    const roleCounts = roleGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.role] = group._count._all
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        roleCounts,
        statusCounts: {
          ACTIVE: activeUsers,
          INACTIVE: inactiveUsers,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid parameters', details: error.errors }, { status: 400 })
    }
    console.error('GET /api/admin/users:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
