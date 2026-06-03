import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

const languageSchema = z.object({
  preferredLanguage: z.enum(['mn', 'en']),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { preferredLanguage } = languageSchema.parse(await request.json())
    const { user } = await ensureUserProfile(authUser)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { preferredLanguage },
      select: { id: true, preferredLanguage: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 422 }
      )
    }

    console.error('PATCH /api/users/language:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
