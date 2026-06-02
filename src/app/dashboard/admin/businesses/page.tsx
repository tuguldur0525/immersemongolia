'use client'

// src/app/dashboard/admin/businesses/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  Building2,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  Filter,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react'
import { cn, formatDate, formatNumber } from '@/lib/utils'

type Status = 'ALL' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'CLAIMED'

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Хүлээгдэж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: Clock },
  ACTIVE: { label: 'Идэвхтэй', color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
  SUSPENDED: { label: 'Түдгэлзүүлсэн', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: XCircle },
  CLOSED: { label: 'Хаасан', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: XCircle },
  CLAIMED: { label: 'Эзэмшилтэй', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: CheckCircle },
}

const FILTER_TABS: { label: string; value: Status }[] = [
  { label: 'Бүгд', value: 'ALL' },
  { label: 'Хүлээгдэж байна', value: 'PENDING_REVIEW' },
  { label: 'Идэвхтэй', value: 'ACTIVE' },
  { label: 'Түдгэлзүүлсэн', value: 'SUSPENDED' },
  { label: 'Хаасан', value: 'CLOSED' },
]

type AdminBusiness = {
  id: string
  slug: string
  nameMn: string
  category: { nameMn: string; icon: string | null }
  ownerName: string
  owner: { email: string | null } | null
  status: keyof typeof STATUS_CONFIG
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  avgRating: number
  totalReviews: number
  totalViews: number
  plan: string
  createdAt: string
}

type AdminBusinessData = {
  businesses: AdminBusiness[]
  total: number
  statusCounts: Record<string, number>
}

export default function AdminBusinessesPage() {
  const [statusFilter, setStatusFilter] = useState<Status>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdminBusinessData>({
    queryKey: ['admin-businesses', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: 'admin',
        status: statusFilter,
        limit: '100',
      })
      if (search.trim()) params.set('query', search.trim())

      const res = await fetch(`/api/businesses?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch businesses')
      const payload = await res.json()
      return payload.data
    },
    staleTime: 20_000,
  })

  const businesses = data?.businesses ?? []
  const statusCounts = data?.statusCounts ?? {}

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelected(selected.length === businesses.length ? [] : businesses.map((business) => business.id))
  }

  async function updateBusiness(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setSelected((prev) => prev.filter((item) => item !== id))
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] })
    }
  }

  async function deleteBusiness(id: string) {
    if (!window.confirm('Энэ бизнесийг устгах уу?')) return

    const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSelected((prev) => prev.filter((item) => item !== id))
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] })
    }
  }

  async function approveSelected() {
    await Promise.all(selected.map((id) => updateBusiness(id, { status: 'ACTIVE', isVerified: true })))
  }

  async function suspendSelected() {
    await Promise.all(selected.map((id) => updateBusiness(id, { status: 'SUSPENDED' })))
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Бизнесүүд</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-bold text-lg">Бизнесүүдийн удирдлага</h1>
          <div className="flex flex-wrap items-center gap-2">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-foreground-muted">{selected.length} сонгосон</span>
                <button onClick={approveSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-success/10 text-brand-success text-xs font-medium hover:bg-brand-success/20 transition-colors">
                  <CheckCircle size={13} /> Зөвшөөрөх
                </button>
                <button onClick={suspendSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-danger/10 text-brand-danger text-xs font-medium hover:bg-brand-danger/20 transition-colors">
                  <XCircle size={13} /> Түдгэлзүүлэх
                </button>
              </div>
            )}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Хайх..."
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <button className="size-9 rounded-xl border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
              <Filter size={15} />
            </button>
            <Link href="/dashboard/admin/businesses/new" className="btn-brand py-2 text-sm">
              <Plus size={15} />
              Нэмэх
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1 w-fit overflow-x-auto max-w-full">
          {FILTER_TABS.map((tab) => {
            const count = tab.value === 'ALL'
              ? Object.values(statusCounts).reduce((sum, value) => sum + value, 0)
              : statusCounts[tab.value] ?? 0

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value)
                  setSelected([])
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  statusFilter === tab.value ? 'bg-brand-primary text-white shadow-sm' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                  statusFilter === tab.value ? 'bg-white/25' : 'bg-background-secondary'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background-secondary text-xs text-foreground-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === businesses.length && businesses.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Бизнес</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Эзэн</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Төлөв</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Үнэлгээ</th>
                <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Харалт</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Тарифф</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Бүртгэсэн</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map((business, index) => {
                const statusCfg = STATUS_CONFIG[business.status] ?? STATUS_CONFIG.PENDING_REVIEW
                const StatusIcon = statusCfg.icon
                const isSelected = selected.includes(business.id)

                return (
                  <motion.tr
                    key={business.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    className={cn('hover:bg-background-secondary transition-colors', isSelected && 'bg-brand-primary/4')}
                  >
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(business.id)} className="rounded border-border" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-background-secondary flex items-center justify-center text-base flex-shrink-0">
                          {business.category.icon || '🏢'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm truncate max-w-[160px]">{business.nameMn}</p>
                            {business.isVerified && <BadgeCheck size={13} className="text-brand-success flex-shrink-0" />}
                            {business.isFeatured && <Star size={12} className="text-brand-accent fill-current flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-foreground-muted">{business.category.nameMn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-foreground-secondary">{business.ownerName}</p>
                      {business.owner?.email && <p className="text-xs text-foreground-muted">{business.owner.email}</p>}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.bg, statusCfg.color)}>
                        <StatusIcon size={11} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {Number(business.avgRating) > 0 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={12} className="text-brand-accent fill-current" />
                          <span className="font-medium">{Number(business.avgRating).toFixed(1)}</span>
                          <span className="text-foreground-muted">({business.totalReviews})</span>
                        </div>
                      ) : <span className="text-xs text-foreground-muted">-</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-sm text-foreground-secondary">{formatNumber(business.totalViews)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={cn('px-2 py-0.5 rounded-lg text-xs font-medium',
                        business.isPremium ? 'bg-brand-primary/10 text-brand-primary' : 'bg-background-tertiary text-foreground-muted'
                      )}>
                        {business.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-foreground-muted">{formatDate(business.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {business.status === 'PENDING_REVIEW' && (
                          <>
                            <button onClick={() => updateBusiness(business.id, { status: 'ACTIVE', isVerified: true })}
                              className="size-8 rounded-lg bg-brand-success/10 text-brand-success hover:bg-brand-success/20 flex items-center justify-center transition-colors" title="Зөвшөөрөх">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => updateBusiness(business.id, { status: 'SUSPENDED' })}
                              className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 flex items-center justify-center transition-colors" title="Түдгэлзүүлэх">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {business.status === 'ACTIVE' && (
                          <Link href={`/business/${business.slug}`} target="_blank"
                            className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                            <Eye size={14} />
                          </Link>
                        )}
                        <Link href={`/dashboard/admin/businesses/${business.id}/edit`}
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                          <Edit3 size={14} />
                        </Link>
                        <button onClick={() => updateBusiness(business.id, { isVerified: !business.isVerified })}
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-brand-success transition-colors" title="Баталгаажуулах">
                          <BadgeCheck size={14} />
                        </button>
                        <button onClick={() => updateBusiness(business.id, { isFeatured: !business.isFeatured })}
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-brand-accent transition-colors" title="Онцлох">
                          <Star size={14} />
                        </button>
                        <button onClick={() => updateBusiness(business.id, { status: 'SUSPENDED' })}
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-brand-warning transition-colors" title="Түдгэлзүүлэх">
                          <Shield size={14} />
                        </button>
                        <button onClick={() => deleteBusiness(business.id)}
                          className="size-8 rounded-lg hover:bg-brand-danger/8 flex items-center justify-center text-foreground-muted hover:text-brand-danger transition-colors" title="Устгах">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          {(isLoading || error || businesses.length === 0) && (
            <div className="py-20 text-center">
              <Building2 size={36} className="text-foreground-subtle mx-auto mb-3" />
              <p className="font-medium">
                {isLoading ? 'Ачаалж байна...' : error ? 'Бизнесүүдийг ачаалж чадсангүй' : 'Бизнес олдсонгүй'}
              </p>
              {!isLoading && !error && (
                <Link href="/dashboard/admin/businesses/new" className="btn-brand mt-4 inline-flex">
                  <Plus size={16} />
                  Нэмэх
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
