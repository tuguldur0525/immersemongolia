import { NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlanConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        plan: true,
        nameMn: true,
        nameEn: true,
        descriptionMn: true,
        descriptionEn: true,
        monthlyPriceMnt: true,
        annualPriceMnt: true,
        features: true,
        maxPhotos: true,
        maxListings: true,
        hasVirtualTour: true,
        hasAnalytics: true,
        hasPrioritySupport: true,
        isFeatured: true,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: plans.map((plan) => ({
        ...plan,
        monthlyPriceMnt: Number(plan.monthlyPriceMnt),
        annualPriceMnt: Number(plan.annualPriceMnt),
      })),
    })
  } catch (error) {
    console.error('GET /api/pricing/plans:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
