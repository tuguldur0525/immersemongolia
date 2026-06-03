import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/auth/profile'

export function isAdminRole(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function getAdminRequester() {
  const supabase = await createClient()
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) return null

  const { user } = await ensureUserProfile(authUser)
  return isAdminRole(user.role) ? user : null
}

export function getUserDisplayName(user: {
  displayName: string | null
  firstName: string | null
  lastName: string | null
  email?: string | null
}) {
  return user.displayName ||
    [user.lastName, user.firstName].filter(Boolean).join(' ') ||
    user.email ||
    'Тодорхойгүй'
}
