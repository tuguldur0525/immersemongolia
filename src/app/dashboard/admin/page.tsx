'use client'
// src/app/dashboard/admin/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Building2, CreditCard, Star, Shield, TrendingUp,
  AlertTriangle, CheckCircle, Clock, XCircle, Eye, BarChart2,
  MapPin, Megaphone, Tag, Globe, MoreVertical, Search, Menu, X
} from 'lucide-react'
import { cn, formatInteger, formatPrice, formatRelativeTime } from '@/lib/utils'

const ADMIN_NAV = [
  { href: '/dashboard/admin', label: 'Хяналт', icon: BarChart2, active: true },
  { href: '/dashboard/admin/businesses', label: 'Бизнесүүд', icon: Building2 },
  { href: '/dashboard/admin/users', label: 'Хэрэглэгчид', icon: Users },
  { href: '/dashboard/admin/analytics', label: 'Аналитик', icon: TrendingUp },
  { href: '/dashboard/admin/content', label: 'Агуулга', icon: Globe },
  { href: '/dashboard/admin/categories', label: 'Ангилал', icon: Tag },
  { href: '/dashboard/admin/advertisements', label: 'Зар сурталчилгаа', icon: Megaphone },
]

type AdminDashboardData = {
  stats: {
    totalUsers: number
    newUsersLast7Days: number
    totalBusinesses: number
    newBusinessesLast7Days: number
    monthlyRevenueMnt: number
    revenueDeltaPct: number
    pendingBusinesses: number
    pendingReviews: number
    activeSubscriptions: number
  }
  recentApprovals: Array<{
    id: string
    slug: string
    name: string
    category: string
    owner: string
    status: string
    createdAt: string
  }>
  recentReviews: Array<{
    id: string
    business: string
    businessSlug: string
    user: string
    rating: number
    status: string
    reason: string
  }>
}

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data } = useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin')
      if (!res.ok) throw new Error('Failed to fetch admin dashboard')
      const { data } = await res.json()
      return data
    },
    staleTime: 60_000,
  })
  const dashboardStats = data?.stats

  const stats = [
    { label: 'Нийт хэрэглэгч', value: formatInteger(dashboardStats?.totalUsers ?? 0), delta: `+${formatInteger(dashboardStats?.newUsersLast7Days ?? 0)} сүүлийн 7 хоногт`, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Нийт бизнес', value: formatInteger(dashboardStats?.totalBusinesses ?? 0), delta: `+${formatInteger(dashboardStats?.newBusinessesLast7Days ?? 0)} сүүлийн 7 хоногт`, icon: Building2, color: 'text-brand-success', bg: 'bg-brand-success/10' },
    { label: 'Орлого (сар)', value: formatPrice(dashboardStats?.monthlyRevenueMnt ?? 0), delta: `${(dashboardStats?.revenueDeltaPct ?? 0).toFixed(1)}% өмнөх сараас`, icon: CreditCard, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
    { label: 'Хүлээгдэж буй', value: formatInteger((dashboardStats?.pendingBusinesses ?? 0) + (dashboardStats?.pendingReviews ?? 0)), delta: `${formatInteger(dashboardStats?.pendingBusinesses ?? 0)} бизнес, ${formatInteger(dashboardStats?.pendingReviews ?? 0)} санал`, icon: Clock, color: 'text-brand-warning', bg: 'bg-brand-warning/10' },
  ]
  const recentApprovals = data?.recentApprovals ?? []
  const recentReviews = data?.recentReviews ?? []
  const averageMrr = dashboardStats?.activeSubscriptions
    ? (dashboardStats.monthlyRevenueMnt / dashboardStats.activeSubscriptions)
    : 0

  return (
    <div className="min-h-screen bg-background-secondary flex">
      {/* Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
          <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="size-8 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm gradient-text">Immerse Mongolia</span>
            <span className="text-xs text-foreground-muted block">Админ панел</span>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-0.5">
            {ADMIN_NAV.map(link => (
              <Link key={link.href} href={link.href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  link.active ? 'bg-brand-primary/10 text-brand-primary' : 'text-foreground-secondary hover:bg-background-secondary'
                )}>
                <link.icon size={17} />
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground-muted hover:bg-background-secondary transition-colors">
            <Globe size={16} />
            Сайт руу буцах
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(v => !v)} className="lg:hidden size-9 rounded-xl border border-border flex items-center justify-center">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1">
            <h1 className="font-bold">Хяналтын самбар</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input placeholder="Хайх..." className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-52" />
            </div>
            <div className="size-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-xs font-bold text-brand-primary">А</div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('size-10 rounded-xl flex items-center justify-center', stat.bg)}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
                <p className="text-xs text-foreground-muted mt-1">{stat.delta}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Pending Approvals */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-brand-warning" />
                  <h2 className="font-semibold">Хүлээгдэж буй бизнесүүд</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-warning/15 text-brand-warning">{recentApprovals.length}</span>
                </div>
                <Link href="/dashboard/admin/businesses?status=PENDING_REVIEW" className="text-sm text-brand-primary hover:underline">Бүгдийг харах</Link>
              </div>
              <div className="divide-y divide-border">
                {recentApprovals.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-background-secondary transition-colors">
                    <div className="size-10 rounded-xl bg-background-tertiary flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-foreground-muted">{item.category} • {item.owner} • {formatRelativeTime(item.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button className="size-8 rounded-lg bg-brand-success/10 text-brand-success hover:bg-brand-success/20 flex items-center justify-center transition-colors">
                        <CheckCircle size={15} />
                      </button>
                      <button className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 flex items-center justify-center transition-colors">
                        <XCircle size={15} />
                      </button>
                      <Link href={`/dashboard/admin/businesses/${item.id}/edit`}
                        className="size-8 rounded-lg border border-border hover:bg-background-tertiary flex items-center justify-center text-foreground-muted transition-colors">
                        <Eye size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
                {recentApprovals.length === 0 && (
                  <div className="p-8 text-center text-sm text-foreground-muted">
                    Хүлээгдэж буй бизнес алга
                  </div>
                )}
              </div>
            </motion.div>

            {/* Flagged Reviews */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-brand-danger" />
                  <h2 className="font-semibold">Шалгах шаардлагатай</h2>
                </div>
                <Link href="/dashboard/admin/content" className="text-sm text-brand-primary hover:underline">Бүгдийг харах</Link>
              </div>
              <div className="divide-y divide-border">
                {recentReviews.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-background-secondary transition-colors">
                    <div className={cn('size-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                      item.status === 'FLAGGED' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-warning/10 text-brand-warning'
                    )}>
                      {item.rating}★
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.business}</p>
                      <p className="text-xs text-foreground-muted">{item.user}
                        {item.reason && <span className="text-brand-danger"> • {item.reason}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button className="size-8 rounded-lg bg-brand-success/10 text-brand-success flex items-center justify-center">
                        <CheckCircle size={15} />
                      </button>
                      <button className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger flex items-center justify-center">
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {recentReviews.length === 0 && (
                  <div className="p-8 text-center text-sm text-foreground-muted">
                    Шалгах санал хүсэлт алга
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Revenue chart placeholder */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Орлогын график</h2>
              <div className="flex items-center gap-2">
                {['7 хоног', '30 хоног', '3 сар', '1 жил'].map(period => (
                  <button key={period} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    period === '30 хоног' ? 'bg-brand-primary text-white' : 'hover:bg-background-secondary text-foreground-muted'
                  )}>
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 bg-background-secondary rounded-xl flex items-center justify-center">
              <div className="text-center">
                <BarChart2 size={36} className="text-foreground-subtle mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">Recharts-ээр график холбогдоно</p>
              </div>
            </div>

            {/* Quick stats below chart */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
              {[
                { label: 'Нийт орлого', value: formatPrice(dashboardStats?.monthlyRevenueMnt ?? 0) },
                { label: 'Идэвхтэй захиалга', value: formatInteger(dashboardStats?.activeSubscriptions ?? 0) },
                { label: 'Дундаж MRR', value: formatPrice(averageMrr) },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-foreground-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
