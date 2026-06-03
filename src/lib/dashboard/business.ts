import type { User } from '@prisma/client'
import prisma from '@/lib/supabase/prisma'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

export type BusinessDashboardUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'displayName' | 'role'>

export async function getBusinessDashboardUser(): Promise<BusinessDashboardUser | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)

  if (!['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return null
  }

  return user
}

export async function getManagedBusinessIds(userId: string) {
  const businesses = await prisma.business.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    select: { id: true },
  })

  return businesses.map((business) => business.id)
}

export async function canManageBusiness(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: userId, deletedAt: null },
    select: { id: true },
  })

  return Boolean(business)
}
