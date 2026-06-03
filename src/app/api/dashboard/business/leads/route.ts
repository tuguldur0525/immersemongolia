import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { getBusinessDashboardUser, getManagedBusinessIds } from '@/lib/dashboard/business'

const leadUpdateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['mark_read', 'mark_unread', 'mark_responded']),
})

function leadWhere(
  businessIds: string[],
  filter: string | null,
  search: string | null
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = { businessId: { in: businessIds } }

  if (filter === 'unread') where.isRead = false
  if (filter === 'responded') where.respondedAt = { not: null }

  const query = search?.trim()
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { message: { contains: query, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const businessIds = await getManagedBusinessIds(user.id)
    if (businessIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { leads: [], stats: { total: 0, unread: 0, responded: 0 }, businesses: [] },
      })
    }

    const filter = request.nextUrl.searchParams.get('filter')
    const search = request.nextUrl.searchParams.get('search')
    const businessId = request.nextUrl.searchParams.get('businessId')
    const scopedBusinessIds = businessId && businessIds.includes(businessId) ? [businessId] : businessIds

    if (businessId && !businessIds.includes(businessId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const where = leadWhere(scopedBusinessIds, filter, search)

    const [leads, total, unread, responded, businesses] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.lead.count({ where: { businessId: { in: scopedBusinessIds } } }),
      prisma.lead.count({ where: { businessId: { in: scopedBusinessIds }, isRead: false } }),
      prisma.lead.count({ where: { businessId: { in: scopedBusinessIds }, respondedAt: { not: null } } }),
      prisma.business.findMany({
        where: { id: { in: businessIds }, deletedAt: null },
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
        select: { id: true, slug: true, nameMn: true, nameEn: true },
      }),
    ])

    const businessMap = new Map(
      businesses.map((business) => [
        business.id,
        {
          id: business.id,
          slug: business.slug,
          name: business.nameMn || business.nameEn || 'Нэргүй бизнес',
        },
      ])
    )

    return NextResponse.json({
      success: true,
      data: {
        leads: leads.map((lead) => ({
          ...lead,
          source: lead.source || 'contact_form',
          business: businessMap.get(lead.businessId) || null,
        })),
        stats: { total, unread, responded },
        businesses: Array.from(businessMap.values()),
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/business/leads:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getBusinessDashboardUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const businessIds = await getManagedBusinessIds(user.id)
    const data = leadUpdateSchema.parse(await request.json())

    const lead = await prisma.lead.findFirst({
      where: { id: data.id, businessId: { in: businessIds } },
      select: { id: true },
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
    }

    const updated = await prisma.lead.update({
      where: { id: data.id },
      data: {
        isRead: data.action === 'mark_unread' ? false : true,
        respondedAt: data.action === 'mark_responded' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }

    console.error('PATCH /api/dashboard/business/leads:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
