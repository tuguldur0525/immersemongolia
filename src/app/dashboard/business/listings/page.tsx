'use client'

// src/app/dashboard/business/listings/page.tsx
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart2,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  Eye,
  Filter,
  LogOut,
  MapPin,
  Menu,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

const SIDEBAR_LINKS = [
  { href: '/dashboard/business', label: 'Хяналт', icon: BarChart2 },
  { href: '/dashboard/business/listings', label: 'Бизнесүүд', icon: Building2, active: true },
  { href: '/dashboard/business/analytics', label: 'Аналитик', icon: TrendingUp },
  { href: '/dashboard/business/media', label: 'Медиа', icon: Eye },
  { href: '/dashboard/business/leads', label: 'Лид & Харилцагч', icon: Users },
  { href: '/dashboard/business/payments', label: 'Төлбөр', icon: CreditCard },
  { href: '/dashboard/user/settings', label: 'Тохиргоо', icon: Settings },
]

const STATUS_CONFIG = {
  ACTIVE: { label: 'Идэвхтэй', color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
  PENDING_REVIEW: { label: 'Хүлээгдэж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: Clock },
  SUSPENDED: { label: 'Түдгэлзүүлсэн', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: XCircle },
  CLOSED: { label: 'Хаасан', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: XCircle },
  CLAIMED: { label: 'Эзэмшилтэй', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: CheckCircle },
}

type BusinessListing = {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  status: keyof typeof STATUS_CONFIG
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  avgRating: number
  totalReviews: number
  totalViews: number
  totalSaves: number
  plan: string
  category: { nameMn: string; icon: string | null }
}

type BusinessListData = {
  businesses: BusinessListing[]
  total: number
}

export default function BusinessListingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<BusinessListData>({
    queryKey: ['business-listings'],
    queryFn: async () => {
      const res = await fetch('/api/businesses?scope=mine&limit=100', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch business listings')
      const payload = await res.json()
      return payload.data
    },
    staleTime: 30_000,
  })

  const businesses = data?.businesses ?? []
  const filtered = businesses.filter((business) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      business.nameMn.toLowerCase().includes(query) ||
      business.nameEn?.toLowerCase().includes(query) ||
      business.category.nameMn.toLowerCase().includes(query)
    )
  })

  const stats = useMemo(() => {
    const totalViews = businesses.reduce((sum, business) => sum + business.totalViews, 0)
    const totalSaves = businesses.reduce((sum, business) => sum + business.totalSaves, 0)
    const totalReviews = businesses.reduce((sum, business) => sum + business.totalReviews, 0)
    const rated = businesses.filter((business) => business.avgRating > 0)
    const avgRating = rated.length
      ? rated.reduce((sum, business) => sum + Number(business.avgRating), 0) / rated.length
      : 0

    return [
      { label: 'Нийт харалт', value: formatNumber(totalViews), delta: `${businesses.length} бизнес`, icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
      { label: 'Хадгалсан', value: formatNumber(totalSaves), delta: 'DB', icon: TrendingUp, color: 'text-brand-success', bg: 'bg-brand-success/10' },
      { label: 'Үнэлгээ', value: avgRating ? avgRating.toFixed(1) : '0.0', delta: `${totalReviews} санал`, icon: Star, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
      { label: 'Идэвхтэй', value: formatNumber(businesses.filter((business) => business.status === 'ACTIVE').length), delta: 'нийт', icon: Users, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
    ]
  }, [businesses])

  async function deleteBusiness(id: string) {
    if (!window.confirm('Энэ бизнесийг устгах уу?')) return

    const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setOpenMenu(null)
      queryClient.invalidateQueries({ queryKey: ['business-listings'] })
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="size-8 rounded-xl bg-brand-gradient flex items-center justify-center">
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Immerse Mongolia</span>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider px-3 mb-2">Бизнес</p>
          <div className="space-y-0.5">
            {SIDEBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  link.active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
                )}
              >
                <link.icon size={17} />
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-foreground-muted hover:text-brand-danger hover:bg-brand-danger/8 transition-colors w-full">
            <LogOut size={16} />
            Гарах
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen((value) => !value)} className="lg:hidden size-9 rounded-xl border border-border flex items-center justify-center">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Бизнесүүд</h1>
            <p className="text-xs text-foreground-muted hidden sm:block">Таны эзэмшдэг бизнесүүд</p>
          </div>
          <Link href="/dashboard/business/listings/new" className="btn-brand py-2 text-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">Нэмэх</span>
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('size-9 rounded-xl flex items-center justify-center', stat.bg)}>
                    <stat.icon size={17} className={stat.color} />
                  </div>
                  <span className="text-xs font-medium text-foreground-muted">{stat.delta}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <h2 className="font-semibold">Бүртгэлтэй бизнесүүд ({businesses.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Хайх..."
                    className="w-full sm:w-52 pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <button className="size-9 rounded-xl border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                  <Filter size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary text-xs text-foreground-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Бизнес</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Төлөв</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Харалт</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Үнэлгээ</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Тарифф</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((business, index) => {
                    const statusConfig = STATUS_CONFIG[business.status] ?? STATUS_CONFIG.PENDING_REVIEW
                    const StatusIcon = statusConfig.icon

                    return (
                      <motion.tr
                        key={business.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-background-secondary transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-background-tertiary flex items-center justify-center text-lg flex-shrink-0">
                              {business.category.icon || '🏢'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{business.nameMn}</p>
                              <p className="text-xs text-foreground-muted">{business.category.nameMn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                            <StatusIcon size={11} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Eye size={14} className="text-foreground-muted" />
                            <span>{formatNumber(business.totalViews)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          {Number(business.avgRating) > 0 ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Star size={13} className="text-brand-accent fill-current" />
                              <span>{Number(business.avgRating).toFixed(1)}</span>
                              <span className="text-foreground-muted">({business.totalReviews})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-muted">Одоохондоо байхгүй</span>
                          )}
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium',
                            business.isPremium ? 'bg-brand-primary/10 text-brand-primary' : 'bg-background-tertiary text-foreground-muted'
                          )}>
                            {business.plan}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            {business.status === 'ACTIVE' && (
                              <Link href={`/business/${business.slug}`}
                                className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                                <Eye size={15} />
                              </Link>
                            )}
                            <Link href={`/dashboard/business/listings/${business.id}/edit`}
                              className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                              <Edit3 size={15} />
                            </Link>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenu(openMenu === business.id ? null : business.id)}
                                className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {openMenu === business.id && (
                                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-card border border-border shadow-lg py-1 z-10">
                                  <Link href="/dashboard/business/analytics" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:bg-background-secondary transition-colors">
                                    <TrendingUp size={14} />
                                    Аналитик
                                  </Link>
                                  <button onClick={() => deleteBusiness(business.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-danger hover:bg-brand-danger/8 transition-colors">
                                    <Trash2 size={14} />
                                    Устгах
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

              {(isLoading || error || filtered.length === 0) && (
                <div className="py-20 text-center">
                  <Building2 size={40} className="text-foreground-subtle mx-auto mb-4" />
                  <p className="font-medium mb-1">
                    {isLoading ? 'Ачаалж байна...' : error ? 'Бизнесүүдийг ачаалж чадсангүй' : 'Бизнес олдсонгүй'}
                  </p>
                  {!isLoading && !error && (
                    <>
                      <p className="text-sm text-foreground-muted mb-4">Эхлэхийн тулд шинэ бизнес нэмнэ үү</p>
                      <Link href="/dashboard/business/listings/new" className="btn-brand">
                        <Plus size={16} />
                        Нэмэх
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
