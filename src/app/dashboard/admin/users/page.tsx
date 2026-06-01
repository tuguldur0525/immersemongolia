'use client'
// src/app/dashboard/admin/users/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Shield, User, Building2, Crown, Ban, CheckCircle, MoreVertical, Mail, Eye } from 'lucide-react'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'

const ROLES = {
  USER: { label: 'Хэрэглэгч', color: 'text-foreground-secondary', bg: 'bg-background-tertiary', icon: User },
  BUSINESS_OWNER: { label: 'Бизнес эзэн', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Building2 },
  ADMIN: { label: 'Админ', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', icon: Shield },
  SUPER_ADMIN: { label: 'Ерөнхий админ', color: 'text-brand-accent', bg: 'bg-brand-accent/10', icon: Crown },
}

const MOCK_USERS = [
  { id: '1', firstName: 'Мөнхбаяр', lastName: 'Батхуяг', email: 'munkh@gmail.com', role: 'BUSINESS_OWNER', isActive: true, loginCount: 142, lastLoginAt: new Date(Date.now() - 3600000).toISOString(), createdAt: '2024-03-15', _count: { businesses: 2, reviews: 5 } },
  { id: '2', firstName: 'Энхтуяа', lastName: 'Оюун', email: 'enkhtuya@gmail.com', role: 'USER', isActive: true, loginCount: 34, lastLoginAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2024-06-20', _count: { businesses: 0, reviews: 12 } },
  { id: '3', firstName: 'Баярсайхан', lastName: 'Дорж', email: 'baysaikhan@company.mn', role: 'ADMIN', isActive: true, loginCount: 890, lastLoginAt: new Date(Date.now() - 7200000).toISOString(), createdAt: '2024-01-01', _count: { businesses: 0, reviews: 0 } },
  { id: '4', firstName: 'Нарантуяа', lastName: 'Сэрээнэн', email: 'nara@outlook.com', role: 'USER', isActive: false, loginCount: 8, lastLoginAt: new Date(Date.now() - 86400000 * 30).toISOString(), createdAt: '2024-09-10', _count: { businesses: 0, reviews: 2 } },
  { id: '5', firstName: 'Гантулга', lastName: 'Бат', email: 'gantulga@business.mn', role: 'BUSINESS_OWNER', isActive: true, loginCount: 67, lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: '2024-04-05', _count: { businesses: 1, reviews: 3 } },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = MOCK_USERS.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
    const q = search.toLowerCase()
    return !q || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Хэрэглэгчид</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Хэрэглэгчдийн удирдлага</h1>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Нэр, имэйл хайх..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Role filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[{ value: 'ALL', label: 'Бүгд' }, ...Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label }))].map(tab => (
            <button key={tab.value} onClick={() => setRoleFilter(tab.value)}
              className={cn('px-4 py-2 rounded-full border text-sm font-medium transition-all',
                roleFilter === tab.value ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary hover:text-brand-primary')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
              {filtered.map((user, i) => {
                const roleCfg = ROLES[user.role as keyof typeof ROLES]
                const RoleIcon = roleCfg.icon
                return (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-background-secondary transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('size-9 rounded-full flex items-center justify-center text-sm font-bold',
                          user.isActive ? 'bg-brand-primary/15 text-brand-primary' : 'bg-background-tertiary text-foreground-muted')}>
                          {user.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.lastName} {user.firstName}</p>
                          <p className="text-xs text-foreground-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', roleCfg.bg, roleCfg.color)}>
                        <RoleIcon size={11} />
                        {roleCfg.label}
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
                      {formatRelativeTime(user.lastLoginAt)}
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
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                              <Shield size={13} className="text-brand-secondary" /> Эрх өөрчлөх
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
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

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <User size={32} className="text-foreground-subtle mx-auto mb-2" />
              <p className="text-sm text-foreground-muted">Хэрэглэгч олдсонгүй</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-foreground-muted">
          <span>{filtered.length} хэрэглэгч</span>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40">Өмнөх</button>
            <span className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs">1</span>
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm">Дараах</button>
          </div>
        </div>
      </main>
    </div>
  )
}
