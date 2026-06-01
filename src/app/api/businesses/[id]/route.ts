// src/app/api/businesses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    // Support lookup by id or slug
    const isUuid = /^[0-9a-f-]{36}$/.test(id)
    const business = await prisma.business.findFirst({
      where: {
        ...(isUuid ? { id } : { slug: id }),
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        category: true,
        hours: { orderBy: { dayOfWeek: 'asc' } },
        media: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
        },
        owner: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: {
          select: { reviews: { where: { status: 'PUBLISHED' } }, savedBy: true },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Increment view count asynchronously (don't await)
    prisma.business.update({
      where: { id: business.id },
      data: { totalViews: { increment: 1 }, weeklyViews: { increment: 1 }, monthlyViews: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: business })
  } catch (error) {
    console.error('GET /api/businesses/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

const updateSchema = z.object({
  nameMn: z.string().min(2).max(200).optional(),
  nameEn: z.string().max(200).optional(),
  descriptionMn: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  taglineMn: z.string().max(300).optional(),
  taglineEn: z.string().max(300).optional(),
  addressMn: z.string().max(500).optional(),
  addressEn: z.string().max(500).optional(),
  district: z.string().max(100).optional(),
  city: z.string().optional(),
  phone: z.string().max(20).optional(),
  phone2: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  whatsapp: z.string().max(30).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  tags: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  tiktok: z.string().url().optional().or(z.literal('')),
  virtualTourUrl: z.string().url().optional().or(z.literal('')),
  virtualTourType: z.string().optional(),
}).partial()

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, role: true },
    })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    // Only owner or admin can update
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(dbUser?.role || '')
    if (!isAdmin && business.ownerId !== dbUser?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.business.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('PATCH /api/businesses/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, role: true },
    })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(dbUser?.role || '')
    if (!isAdmin && business.ownerId !== dbUser?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await prisma.business.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    })

    return NextResponse.json({ success: true, message: 'Business deleted' })
  } catch (error) {
    console.error('DELETE /api/businesses/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
