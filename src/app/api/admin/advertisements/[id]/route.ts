import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getAdminRequester } from '@/lib/admin/auth'

type Params = { params: Promise<{ id: string }> }

const adTypes = ['BANNER', 'FEATURED_LISTING', 'CATEGORY_SPONSOR', 'MAP_PIN'] as const

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalString = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional())

const optionalMoney = z.preprocess(blankToUndefined, z.coerce.number().min(0).optional())
const optionalDate = z.preprocess(
  blankToUndefined,
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date').optional()
)

const updateAdSchema = z.object({
  businessId: z.string().uuid().optional(),
  type: z.enum(adTypes).optional(),
  titleMn: z.string().trim().min(2).max(200).optional(),
  titleEn: optionalString(200),
  imageUrl: optionalString(500),
  targetUrl: optionalString(500),
  targetCategory: optionalString(100),
  budget: optionalMoney,
  cpmRate: optionalMoney,
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().optional(),
})

function normalizeAdPayload(data: z.infer<typeof updateAdSchema>) {
  return {
    ...data,
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateAdSchema.parse(body)

    if (data.businessId) {
      const business = await prisma.business.findFirst({
        where: { id: data.businessId, deletedAt: null },
        select: { id: true },
      })
      if (!business) {
        return NextResponse.json({ success: false, error: 'Business not found' }, { status: 422 })
      }
    }

    const advertisement = await prisma.advertisement.update({
      where: { id },
      data: normalizeAdPayload(data),
    })

    return NextResponse.json({ success: true, data: advertisement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('PATCH /api/admin/advertisements/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params

  try {
    const requester = await getAdminRequester()
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await prisma.advertisement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/advertisements/[id]:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
