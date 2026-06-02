// src/app/api/businesses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

type Params = { params: Promise<{ id: string }> }

const businessStatuses = ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'CLAIMED'] as const
const uuidPattern = /^[0-9a-f-]{36}$/i

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalString = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional())

const optionalEmail = z.preprocess(blankToUndefined, z.string().trim().email().optional())
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url().optional())
const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional())

const updateSchema = z.object({
  ownerEmail: optionalEmail,
  nameMn: z.string().trim().min(2).max(200).optional(),
  nameEn: optionalString(200),
  descriptionMn: optionalString(5000),
  descriptionEn: optionalString(5000),
  taglineMn: optionalString(300),
  taglineEn: optionalString(300),
  categoryId: z.string().uuid().optional(),
  addressMn: optionalString(500),
  addressEn: optionalString(500),
  district: optionalString(100),
  city: optionalString(100),
  phone: optionalString(20),
  phone2: optionalString(20),
  email: optionalEmail,
  website: optionalUrl,
  whatsapp: optionalString(30),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
  amenities: z.array(z.string().trim().min(1).max(80)).optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalUrl,
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
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
    hours: { orderBy: { dayOfWeek: 'asc' } },
    media: {
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
    },
    _count: {
      select: { reviews: { where: { status: 'PUBLISHED' } }, savedBy: true },
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

function canManageBusiness(
  requester: Awaited<ReturnType<typeof getRequester>>,
  business: { ownerId: string | null }
) {
  if (!requester) return false
  return isAdminRole(requester.role) || business.ownerId === requester.id
}

async function resolveOwnerByEmail(ownerEmail: string | undefined) {
  if (!ownerEmail) return undefined

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, role: true },
  })

  if (!owner) throw new Error('OWNER_NOT_FOUND')

  if (owner.role === 'USER') {
    await prisma.user.update({
      where: { id: owner.id },
      data: { role: 'BUSINESS_OWNER' },
    })
  }

  return owner.id
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const isUuid = uuidPattern.test(id)
    const editable = request.nextUrl.searchParams.get('editable') === 'true'

    const business = await prisma.business.findFirst({
      where: {
        ...(isUuid ? { id } : { slug: id }),
        ...(editable ? {} : { status: 'ACTIVE' as const }),
        deletedAt: null,
      },
      select: businessSelect(),
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    if (editable) {
      const requester = await getRequester()
      if (!canManageBusiness(requester, business)) {
        return NextResponse.json({ success: false, error: requester ? 'Forbidden' : 'Unauthorized' }, { status: requester ? 403 : 401 })
      }
    } else {
      prisma.business.update({
        where: { id: business.id },
        data: { totalViews: { increment: 1 }, weeklyViews: { increment: 1 }, monthlyViews: { increment: 1 } },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, data: serializeBusiness(business) })
  } catch (error) {
    console.error('GET /api/businesses/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getRequester()
    if (!requester) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business || business.deletedAt) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const isAdmin = isAdminRole(requester.role)
    if (!isAdmin && business.ownerId !== requester.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, isActive: true },
        select: { id: true },
      })
      if (!category) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 422 })
      }
    }

    const {
      ownerEmail,
      status,
      isVerified,
      isFeatured,
      isPremium,
      ...editableData
    } = data

    const updateData: Prisma.BusinessUncheckedUpdateInput = { ...editableData }

    if (isAdmin) {
      const ownerId = await resolveOwnerByEmail(ownerEmail)
      if (ownerId) updateData.ownerId = ownerId
      if (status) updateData.status = status
      if (typeof isVerified === 'boolean') updateData.isVerified = isVerified
      if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured
      if (typeof isPremium === 'boolean') updateData.isPremium = isPremium
      if (status === 'ACTIVE' && !business.approvedAt) {
        updateData.approvedAt = new Date()
        updateData.approvedBy = requester.id
      }
    }

    const updated = await prisma.business.update({
      where: { id },
      data: updateData,
      select: businessSelect(),
    })

    return NextResponse.json({ success: true, data: serializeBusiness(updated) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    if (error instanceof Error && error.message === 'OWNER_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Owner email was not found' }, { status: 422 })
    }
    console.error('PATCH /api/businesses/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getRequester()
    if (!requester) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({ where: { id } })
    if (!business || business.deletedAt) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    if (!isAdminRole(requester.role) && business.ownerId !== requester.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

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
