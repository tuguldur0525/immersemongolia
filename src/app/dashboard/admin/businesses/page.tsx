'use client'
// src/app/dashboard/admin/businesses/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search, Filter, CheckCircle, XCircle, Eye, Edit3, MoreVertical,
  Building2, BadgeCheck, Star, Clock, Shield, TrendingUp, Trash2, ChevronDown
} from 'lucide-react'
import { cn, formatDate, formatNumber } from '@/lib/utils'

type Status = 'ALL' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Хүлээгдэж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: Clock },
  ACTIVE: { label: 'Идэвхтэй', color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
  SUSPENDED: { label: 'Түдгэлзүүлэгдсэн', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: XCircle },
  CLOSED: { label: 'Хаасан', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: XCircle },
}

const MOCK_BUSINESSES = [
  { id: '1', nameMn: 'Монголын Элч Ресторан', category: 'Ресторан', owner: 'Б. Мөнхбаяр', status: 'ACTIVE', isVerified: true, isFeatured: true, avgRating: 4.3, totalReviews: 247, totalViews: 8420, plan: 'PROFESSIONAL', createdAt: '2024-03-15', slug: 'mongolian-ambassador' },
  { id: '2', nameMn: 'Blue Sky Hotel', category: 'Зочид буудал', owner: 'О. Ганбаатар', status: 'PENDING_REVIEW', isVerified: false, isFeatured: false, avgRating: 0, totalReviews: 0, totalViews: 0, plan: 'STARTER', createdAt: '2025-01-28', slug: 'blue-sky-hotel' },
  { id: '3', nameMn: 'Nature Camp Resort', category: 'Кемп', owner: 'Д. Батцэрэн', status: 'PENDING_REVIEW', isVerified: false, isFeatured: false, avgRating: 0, totalReviews: 0, totalViews: 0, plan: 'PROFESSIONAL', createdAt: '2025-01-27', slug: 'nature-camp' },
  { id: '4', nameMn: 'State Department Store', category: 'Дэлгүүр', owner: 'С. Нарантуяа', status: 'ACTIVE', isVerified: true, isFeatured: false, avgRating: 3.9, totalReviews: 134, totalViews: 5230, plan: 'ENTERPRISE', createdAt: '2024-01-10', slug: 'state-store' },
  { id: '5', nameMn: 'Cheap Cafe XYZ', category: 'Кафе', owner: 'Э. Баяр', status: 'SUSPENDED', isVerified: false, isFeatured: false, avgRating: 2.1, totalReviews: 12, totalViews: 320, plan: 'FREE', createdAt: '2024-08-20', slug: 'cheap-cafe' },
]

const FILTER_TABS: { label: string; value: Status; count?: number }[] = [
  { label: 'Бүгд', value: 'ALL', count: 2418 },
  { label: 'Хүлээгдэж байна', value: 'PENDING_REVIEW', count: 16 },
  { label: 'Идэвхтэй', value: 'ACTIVE', count: 2380 },
  { label: 'Түдгэлзүүлэгдсэн', value: 'SUSPENDED', count: 22 },
]

export default function AdminBusinessesPage() {
  const [statusFilter, setStatusFilter] = useState<Status>('ALL')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = MOCK_BUSINESSES.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (search && !b.nameMn.toLowerCase().includes(search.toLowerCase()) && !b.owner.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map(b => b.id))
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Бизнесүүд</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Бизнесүүдийн удирдлага</h1>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-foreground-muted">{selected.length} сонгосон</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-success/10 text-brand-success text-xs font-medium hover:bg-brand-success/20 transition-colors">
                  <CheckCircle size={13} /> Бүгдийг зөвшөөрөх
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-danger/10 text-brand-danger text-xs font-medium hover:bg-brand-danger/20 transition-colors">
                  <XCircle size={13} /> Бүгдийг татгалзах
                </button>
              </div>
            )}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хайх..."
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-52 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <button className="size-9 rounded-xl border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
              <Filter size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Status tabs */}
        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1 w-fit">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                statusFilter === tab.value ? 'bg-brand-primary text-white shadow-sm' : 'text-foreground-muted hover:text-foreground')}>
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                  statusFilter === tab.value ? 'bg-white/25' : 'bg-background-secondary')}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background-secondary text-xs text-foreground-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded border-border" />
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
              {filtered.map((biz, i) => {
                const statusCfg = STATUS_CONFIG[biz.status as keyof typeof STATUS_CONFIG]
                const StatusIcon = statusCfg?.icon
                const isSelected = selected.includes(biz.id)

                return (
                  <motion.tr key={biz.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className={cn('hover:bg-background-secondary transition-colors', isSelected && 'bg-brand-primary/4')}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(biz.id)} className="rounded border-border" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-background-secondary flex items-center justify-center text-base flex-shrink-0">
                          {biz.category === 'Ресторан' ? '🍜' : biz.category === 'Зочид буудал' ? '🏨' : biz.category === 'Кемп' ? '⛺' : biz.category === 'Дэлгүүр' ? '🛍️' : '🏢'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm truncate max-w-[140px]">{biz.nameMn}</p>
                            {biz.isVerified && <BadgeCheck size={13} className="text-brand-success flex-shrink-0" />}
                            {biz.isFeatured && <Star size={12} className="text-brand-accent fill-current flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-foreground-muted">{biz.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-foreground-secondary">{biz.owner}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {statusCfg && (
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.bg, statusCfg.color)}>
                          <StatusIcon size={11} />
                          {statusCfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {biz.avgRating > 0 ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={12} className="text-brand-accent fill-current" />
                          <span className="font-medium">{biz.avgRating}</span>
                          <span className="text-foreground-muted">({biz.totalReviews})</span>
                        </div>
                      ) : <span className="text-xs text-foreground-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-sm text-foreground-secondary">{formatNumber(biz.totalViews)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={cn('px-2 py-0.5 rounded-lg text-xs font-medium',
                        biz.plan === 'ENTERPRISE' ? 'bg-brand-accent/10 text-brand-accent' :
                        biz.plan === 'PROFESSIONAL' ? 'bg-brand-primary/10 text-brand-primary' :
                        biz.plan === 'STARTER' ? 'bg-brand-success/10 text-brand-success' :
                        'bg-background-tertiary text-foreground-muted')}>
                        {biz.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-foreground-muted">{formatDate(biz.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {biz.status === 'PENDING_REVIEW' && (
                          <>
                            <button className="size-8 rounded-lg bg-brand-success/10 text-brand-success hover:bg-brand-success/20 flex items-center justify-center transition-colors" title="Зөвшөөрөх">
                              <CheckCircle size={14} />
                            </button>
                            <button className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 flex items-center justify-center transition-colors" title="Татгалзах">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <Link href={`/business/${biz.slug}`} target="_blank"
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                          <Eye size={14} />
                        </Link>
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === biz.id ? null : biz.id)}
                            className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                            <MoreVertical size={14} />
                          </button>
                          {openMenu === biz.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-card border border-border shadow-xl py-1 z-20">
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Edit3 size={13} /> Засах
                              </button>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <BadgeCheck size={13} className="text-brand-success" /> Баталгаажуулах
                              </button>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Star size={13} className="text-brand-accent" /> Онцлохоор тэмдэглэх
                              </button>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Shield size={13} className="text-brand-warning" /> Түдгэлзүүлэх
                              </button>
                              <div className="my-1 border-t border-border" />
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-brand-danger hover:bg-brand-danger/8 transition-colors">
                                <Trash2 size={13} /> Устгах
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <Building2 size={36} className="text-foreground-subtle mx-auto mb-3" />
              <p className="font-medium">Бизнес олдсонгүй</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-foreground-muted">
          <span>{filtered.length} үр дүн харагдаж байна</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-background-secondary transition-colors disabled:opacity-40" disabled>
              Өмнөх
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs">1</span>
            <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-background-secondary transition-colors">
              Дараах
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
