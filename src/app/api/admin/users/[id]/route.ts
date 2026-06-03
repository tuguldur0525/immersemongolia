import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getAdminRequester } from '@/lib/admin/auth'

type Params = { params: Promise<{ id: string }> }

const roles = ['USER', 'BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'] as const

const updateUserSchema = z.object({
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => typeof data.role !== 'undefined' || typeof data.isActive !== 'undefined', {
  message: 'Nothing to update',
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, deletedAt: true },
    })

    if (!target || target.deletedAt) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    if (requester.role !== 'SUPER_ADMIN' && target.role === 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can update super admins' }, { status: 403 })
    }

    if (data.role && ['ADMIN', 'SUPER_ADMIN'].includes(data.role) && requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can grant admin roles' }, { status: 403 })
    }

    if (requester.id === id && data.isActive === false) {
      return NextResponse.json({ success: false, error: 'You cannot deactivate your own account' }, { status: 422 })
    }

    if (requester.id === id && data.role && data.role !== requester.role) {
      return NextResponse.json({ success: false, error: 'You cannot change your own role' }, { status: 422 })
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('PATCH /api/admin/users/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
