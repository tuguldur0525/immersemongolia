// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/supabase/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const includeCount = searchParams.get('includeCount') !== 'false'

    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        ...(includeCount && {
          _count: { select: { businesses: { where: { status: 'ACTIVE' } } } },
        }),
      },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('GET /api/categories:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
