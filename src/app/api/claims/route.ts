// src/app/api/claims/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'

const createClaimSchema = z.object({
  businessId: z.string().uuid(),
  message: z.string().min(20).max(2000),
  verificationDocs: z.array(z.string().url()).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    })
    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const data = createClaimSchema.parse(body)

    // Check if business exists
    const business = await prisma.business.findUnique({ where: { id: data.businessId } })
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })

    // Check if already claimed
    if (business.ownerId) {
      return NextResponse.json({ success: false, error: 'Business is already claimed' }, { status: 409 })
    }

    // Check for existing pending claim
    const existingClaim = await prisma.businessClaim.findFirst({
      where: { businessId: data.businessId, userId: dbUser.id, status: 'PENDING' },
    })
    if (existingClaim) {
      return NextResponse.json({ success: false, error: 'You already have a pending claim' }, { status: 409 })
    }

    const claim = await prisma.businessClaim.create({
      data: {
        businessId: data.businessId,
        userId: dbUser.id,
        message: data.message,
        verificationDocs: data.verificationDocs,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: claim }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('POST /api/claims:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, role: true },
    })

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(dbUser?.role || '')

    const claims = await prisma.businessClaim.findMany({
      where: isAdmin ? {} : { userId: dbUser!.id },
      include: {
        business: { select: { id: true, slug: true, nameMn: true, coverImageUrl: true } },
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: claims })
  } catch (error) {
    console.error('GET /api/claims:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
