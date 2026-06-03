'use client'
// src/app/dashboard/admin/users/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Shield, User, Building2, Crown, Ban, CheckCircle, MoreVertical, Mail, Eye, Loader2 } from 'lucide-react'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'

const ROLES = {
  USER: { label: 'Хэрэглэгч', color: 'text-foreground-secondary', bg: 'bg-background-tertiary', icon: User },
  BUSINESS_OWNER: { label: 'Бизнес эзэн', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Building2 },
  ADMIN: { label: 'Админ', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', icon: Shield },
  SUPER_ADMIN: { label: 'Ерөнхий админ', color: 'text-brand-accent', bg: 'bg-brand-accent/10', icon: Crown },
}

type Role = keyof typeof ROLES
type RoleFilter = 'ALL' | Role
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

type AdminUser = {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  email: string
  avatarUrl: string | null
  role: Role
  isActive: boolean
  loginCount: number
  lastLoginAt: string | null
  createdAt: string
  _count: { businesses: number; reviews: number; savedBusinesses: number }
}

type AdminUsersData = {
  users: AdminUser[]
  total: number
  roleCounts: Partial<Record<Role, number>>
  statusCounts: Partial<Record<'ACTIVE' | 'INACTIVE', number>>
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdminUsersData>({
    queryKey: ['admin-users', roleFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        role: roleFilter,
        status: statusFilter,
        limit: '100',
      })
      if (search.trim()) params.set('query', search.trim())

      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Хэрэглэгчдийг ачаалж чадсангүй')
      }
      return payload.data
    },
    staleTime: 20_000,
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Pick<AdminUser, 'role' | 'isActive'>> }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responsePayload = await res.json().catch(() => null)

      if (!res.ok || !responsePayload?.success) {
        throw new Error(responsePayload?.error || 'Хэрэглэгч шинэчлэхэд алдаа гарлаа')
      }

      return responsePayload.data
    },
    onMutate: () => setActionError(''),
    onSuccess: () => {
      setOpenMenu(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (mutationError) => {
      setActionError(mutationError instanceof Error ? mutationError.message : 'Үйлдэл амжилтгүй боллоо')
    },
  })

  const users = data?.users ?? []
  const totalUsers = data?.total ?? 0
  const roleTabs = [
    { value: 'ALL' as const, label: 'Бүгд', count: totalUsers },
    ...Object.entries(ROLES).map(([value, role]) => ({
      value: value as Role,
      label: role.label,
      count: data?.roleCounts[value as Role] ?? 0,
    })),
  ]
  const statusTabs: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'ALL', label: 'Бүх төлөв', count: totalUsers },
    { value: 'ACTIVE', label: 'Идэвхтэй', count: data?.statusCounts.ACTIVE ?? 0 },
    { value: 'INACTIVE', label: 'Идэвхгүй', count: data?.statusCounts.INACTIVE ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Хэрэглэгчид</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-bold text-lg">Хэрэглэгчдийн удирдлага</h1>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Нэр, имэйл хайх..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex gap-2 flex-wrap mb-4">
          {roleTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={cn('px-4 py-2 rounded-full border text-sm font-medium transition-all',
                roleFilter === tab.value ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary hover:text-brand-primary')}
            >
              {tab.label}
              <span className={cn('ml-2 text-xs', roleFilter === tab.value ? 'text-white/80' : 'text-foreground-muted')}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1 w-fit">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                statusFilter === tab.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
            {actionError}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary text-xs text-foreground-muted border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Хэрэглэгч</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Эрх</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Бизнес / Санал</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Сүүлд нэвтэрсэн</th>
                  <th className="px-5 py-3 text-left font-medium hidden xl:table-cell">Бүртгүүлсэн</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Төлөв</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user, i) => {
                  const roleCfg = ROLES[user.role]
                  const RoleIcon = roleCfg.icon
                  return (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                      className="hover:bg-background-secondary transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('size-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden',
                            user.isActive ? 'bg-brand-primary/15 text-brand-primary' : 'bg-background-tertiary text-foreground-muted')}>
                            {user.avatarUrl
                              ? <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                              : user.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.displayName || `${user.lastName} ${user.firstName}`.trim()}</p>
                            <p className="text-xs text-foreground-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', roleCfg.bg, roleCfg.color)}>
                          <RoleIcon size={11} />
                          <select
                            value={user.role}
                            disabled={updateUserMutation.isPending}
                            onChange={(event) => updateUserMutation.mutate({ id: user.id, payload: { role: event.target.value as Role } })}
                            className="border-0 bg-transparent p-0 pr-5 text-xs font-medium focus:ring-0"
                          >
                            {Object.entries(ROLES).map(([value, role]) => (
                              <option key={value} value={value}>{role.label}</option>
                            ))}
                          </select>
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Building2 size={12} />
                            {user._count.businesses}
                          </span>
                          <span className="flex items-center gap-1">
                            ★ {user._count.reviews}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-xs text-foreground-muted">
                        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Нэвтрээгүй'}
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell text-xs text-foreground-muted">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          user.isActive ? 'bg-brand-success/10 text-brand-success' : 'bg-background-tertiary text-foreground-muted')}>
                          <div className={cn('size-1.5 rounded-full', user.isActive ? 'bg-brand-success' : 'bg-foreground-muted')} />
                          {user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end relative">
                          <a href={`mailto:${user.email}`}
                            className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-brand-primary transition-colors">
                            <Mail size={14} />
                          </a>
                          <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                            <MoreVertical size={14} />
                          </button>
                          {openMenu === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-card border border-border shadow-xl py-1 z-10">
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Eye size={13} /> Профайл харах
                              </button>
                              <div className="my-1 border-t border-border" />
                              <button
                                onClick={() => updateUserMutation.mutate({ id: user.id, payload: { isActive: !user.isActive } })}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors"
                              >
                                {user.isActive
                                  ? <><Ban size={13} className="text-brand-danger" /> Идэвхгүй болгох</>
                                  : <><CheckCircle size={13} className="text-brand-success" /> Идэвхжүүлэх</>
                                }
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(isLoading || error || users.length === 0) && (
            <div className="py-16 text-center">
              {isLoading ? (
                <Loader2 size={32} className="text-foreground-muted mx-auto mb-2 animate-spin" />
              ) : (
                <User size={32} className="text-foreground-subtle mx-auto mb-2" />
              )}
              <p className="text-sm text-foreground-muted">
                {isLoading ? 'Ачаалж байна...' : error ? 'Хэрэглэгчдийг ачаалж чадсангүй' : 'Хэрэглэгч олдсонгүй'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-foreground-muted">
          <span>{totalUsers} хэрэглэгч</span>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40">Өмнөх</button>
            <span className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs">1</span>
            <button disabled className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40">Дараах</button>
          </div>
        </div>
      </main>
    </div>
  )
}
