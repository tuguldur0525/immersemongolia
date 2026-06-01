import { NextResponse } from 'next/server'
import { getPlatformStats } from '@/lib/data/platform'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const stats = await getPlatformStats()
    return NextResponse.json<ApiResponse<typeof stats>>({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('GET /api/stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
