// src/lib/auth/index.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User, UserRole } from '@/types'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_id', user.id)
    .single()

  return data as User | null
}

export async function requireAuth(redirectTo = '/auth/login') {
  const user = await getCurrentUser()
  if (!user) redirect(redirectTo)
  return user
}

export async function requireRole(roles: UserRole[], redirectTo = '/') {
  const user = await requireAuth()
  if (!roles.includes(user.role)) redirect(redirectTo)
  return user
}

export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN'], '/')
}

export async function requireBusinessOwner() {
  return requireRole(['BUSINESS_OWNER', 'ADMIN', 'SUPER_ADMIN'], '/')
}

export function isAdmin(role: UserRole) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function isBusinessOwner(role: UserRole) {
  return role === 'BUSINESS_OWNER' || isAdmin(role)
}
