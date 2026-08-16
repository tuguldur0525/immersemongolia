import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { canManageBusiness, getBusinessDashboardUser } from '@/lib/dashboard/business'
import { nanoid } from 'nanoid'

const BUCKET = process.env.SUPABASE_STORAGE_BUSINESS_BUCKET || 'business-media'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const mediaActions = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('set_cover'),
    businessId: z.string().uuid(),
    mediaId: z.string().uuid(),
  }),
  z.object({
    action: z.literal('set_logo'),
    businessId: z.string().uuid(),
    mediaId: z.string().uuid(),
  }),
  z.object({
    action: z.literal('update_caption'),
    businessId: z.string().uuid(),
    mediaId: z.string().uuid(),
    caption: z.string().max(240).nullable(),
  }),
  z.object({
    action: z.literal('save_tour'),
    businessId: z.string().uuid(),
    url: z.string().trim().url(),
    tourType: z.string().trim().max(40).optional(),
  }),
  z.object({
    action: z.literal('clear_tour'),
    businessId: z.string().uuid(),
  }),
])

function fileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase()
  if (fromName) return fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'bin'
}

async function getStorageClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient()
  }

  return createClient()
}

function extractStoragePath(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const markerIndex = url.indexOf(marker)
  if (markerIndex < 0) return null

  const path = url.slice(markerIndex + marker.length).split('?')[0]
  return decodeURIComponent(path)
}

async function getOwnedBusinesses(userId: string) {
  return prisma.business.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      nameMn: true,
      nameEn: true,
      logoUrl: true,
      coverImageUrl: true,
      virtualTourUrl: true,
      virtualTourType: true,
      media: {
        where: { isPublic: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          type: true,
          url: true,
          thumbnailUrl: true,
          caption: true,
          altText: true,
          sortOrder: true,
          fileSize: true,
          mimeType: true,
          width: true,
          height: true,
          createdAt: true,
        },
      },
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const businesses = await getOwnedBusinesses(user.id)
    const selectedId = request.nextUrl.searchParams.get('businessId') || businesses[0]?.id || null
    const selectedBusiness = selectedId
      ? businesses.find((business) => business.id === selectedId) ?? null
      : null

    if (selectedId && !selectedBusiness) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
      select: { plan: true },
    })

    const planConfig = await prisma.subscriptionPlanConfig.findUnique({
      where: { plan: activeSubscription?.plan ?? 'FREE' },
      select: { maxPhotos: true, hasVirtualTour: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        businesses: businesses.map(({ media: _media, ...business }) => {
          void _media
          return business
        }),
        selectedBusiness,
        media: selectedBusiness?.media ?? [],
        limits: {
          maxPhotos: planConfig?.maxPhotos ?? 5,
          hasVirtualTour: planConfig?.hasVirtualTour ?? false,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/business/media:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const businessId = String(formData.get('businessId') || '')
    const rawType = String(formData.get('type') || 'PHOTO')
    const caption = String(formData.get('caption') || '').trim() || null
    const file = formData.get('file')

    if (!z.string().uuid().safeParse(businessId).success) {
      return NextResponse.json({ success: false, error: 'Invalid businessId' }, { status: 422 })
    }

    if (!['PHOTO', 'COVER', 'LOGO'].includes(rawType)) {
      return NextResponse.json({ success: false, error: 'Invalid media type' }, { status: 422 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 422 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 422 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File is too large' }, { status: 422 })
    }

    if (!(await canManageBusiness(user.id, businessId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storage = await getStorageClient()
    const path = `${businessId}/${Date.now()}-${nanoid(10)}.${fileExtension(file)}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await storage.storage
      .from(BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 502 })
    }

    const { data: publicUrlData } = storage.storage.from(BUCKET).getPublicUrl(path)
    const existingCount = await prisma.businessMedia.count({ where: { businessId } })
    const type = rawType as 'PHOTO' | 'COVER' | 'LOGO'

    const media = await prisma.businessMedia.create({
      data: {
        businessId,
        type,
        url: publicUrlData.publicUrl,
        caption,
        altText: caption,
        sortOrder: existingCount,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user.id,
      },
    })

    if (type === 'COVER') {
      await prisma.business.update({
        where: { id: businessId },
        data: { coverImageUrl: media.url },
      })
    }

    if (type === 'LOGO') {
      await prisma.business.update({
        where: { id: businessId },
        data: { logoUrl: media.url },
      })
    }

    return NextResponse.json({ success: true, data: media }, { status: 201 })
  } catch (error) {
    console.error('POST /api/dashboard/business/media:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const data = mediaActions.parse(await request.json())
    if (!(await canManageBusiness(user.id, data.businessId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (data.action === 'save_tour') {
      const business = await prisma.business.update({
        where: { id: data.businessId },
        data: {
          virtualTourUrl: data.url,
          virtualTourType: data.tourType || 'custom',
        },
        select: { id: true, virtualTourUrl: true, virtualTourType: true },
      })

      const existingTour = await prisma.businessMedia.findFirst({
        where: { businessId: data.businessId, type: 'VIRTUAL_TOUR_360' },
        select: { id: true },
      })

      if (existingTour) {
        await prisma.businessMedia.update({
          where: { id: existingTour.id },
          data: { url: data.url, caption: data.tourType || '360° virtual tour' },
        })
      } else {
        await prisma.businessMedia.create({
          data: {
            businessId: data.businessId,
            type: 'VIRTUAL_TOUR_360',
            url: data.url,
            caption: data.tourType || '360° virtual tour',
            uploadedBy: user.id,
          },
        })
      }

      return NextResponse.json({ success: true, data: business })
    }

    if (data.action === 'clear_tour') {
      await prisma.$transaction([
        prisma.business.update({
          where: { id: data.businessId },
          data: { virtualTourUrl: null, virtualTourType: null },
        }),
        prisma.businessMedia.deleteMany({
          where: { businessId: data.businessId, type: 'VIRTUAL_TOUR_360' },
        }),
      ])

      return NextResponse.json({ success: true })
    }

    const media = await prisma.businessMedia.findFirst({
      where: { id: data.mediaId, businessId: data.businessId },
      select: { id: true, url: true },
    })

    if (!media) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    if (data.action === 'set_cover') {
      await prisma.$transaction([
        prisma.business.update({
          where: { id: data.businessId },
          data: { coverImageUrl: media.url },
        }),
        prisma.businessMedia.update({
          where: { id: media.id },
          data: { type: 'COVER' },
        }),
      ])
      return NextResponse.json({ success: true })
    }

    if (data.action === 'set_logo') {
      await prisma.$transaction([
        prisma.business.update({
          where: { id: data.businessId },
          data: { logoUrl: media.url },
        }),
        prisma.businessMedia.update({
          where: { id: media.id },
          data: { type: 'LOGO' },
        }),
      ])
      return NextResponse.json({ success: true })
    }

    await prisma.businessMedia.update({
      where: { id: media.id },
      data: { caption: data.caption, altText: data.caption },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }

    console.error('PATCH /api/dashboard/business/media:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = z.object({
      businessId: z.string().uuid(),
      mediaId: z.string().uuid(),
    }).parse(await request.json())

    if (!(await canManageBusiness(user.id, body.businessId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const media = await prisma.businessMedia.findFirst({
      where: { id: body.mediaId, businessId: body.businessId },
      select: { id: true, url: true },
    })

    if (!media) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    const storagePath = extractStoragePath(media.url)
    if (storagePath) {
      const storage = await getStorageClient()
      await storage.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    }

    await prisma.$transaction(async (tx) => {
      await tx.businessMedia.delete({ where: { id: media.id } })

      const business = await tx.business.findUnique({
        where: { id: body.businessId },
        select: { coverImageUrl: true, logoUrl: true },
      })

      if (business?.coverImageUrl === media.url) {
        await tx.business.update({ where: { id: body.businessId }, data: { coverImageUrl: null } })
      }

      if (business?.logoUrl === media.url) {
        await tx.business.update({ where: { id: body.businessId }, data: { logoUrl: null } })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }

    console.error('DELETE /api/dashboard/business/media:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
