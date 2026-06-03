'use client'
// src/app/dashboard/admin/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Users, Building2, CreditCard,
  AlertTriangle, CheckCircle, Clock, XCircle, Eye, BarChart2,
} from 'lucide-react'
import { cn, formatInteger, formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'

const REVENUE_PERIODS = [
  { label: '7 хоног', days: 7 },
  { label: '30 хоног', days: 30 },
  { label: '3 сар', days: 90 },
  { label: '1 жил', days: 365 },
] as const

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
  revenueSeries: Array<{
    date: string
    revenueMnt: number
    payments: number
  }>
}

export default function AdminDashboardPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<(typeof REVENUE_PERIODS)[number]['days']>(30)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin')
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to fetch admin dashboard')
      }
      const { data } = payload
      return data
    },
    retry: 0,
    staleTime: 60_000,
  })
  const dashboardStats = data?.stats
  const hasDashboardError = Boolean(error)

  const stats = [
    {
      label: 'Нийт хэрэглэгч',
      value: isLoading ? '...' : hasDashboardError ? '—' : formatInteger(dashboardStats?.totalUsers ?? 0),
      delta: isLoading ? 'Ачаалж байна...' : hasDashboardError ? 'Ачаалж чадсангүй' : `+${formatInteger(dashboardStats?.newUsersLast7Days ?? 0)} сүүлийн 7 хоногт`,
      icon: Users,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    },
    {
      label: 'Нийт бизнес',
      value: isLoading ? '...' : hasDashboardError ? '—' : formatInteger(dashboardStats?.totalBusinesses ?? 0),
      delta: isLoading ? 'Ачаалж байна...' : hasDashboardError ? 'Ачаалж чадсангүй' : `+${formatInteger(dashboardStats?.newBusinessesLast7Days ?? 0)} сүүлийн 7 хоногт`,
      icon: Building2,
      color: 'text-brand-success',
      bg: 'bg-brand-success/10',
    },
    {
      label: 'Орлого (сар)',
      value: isLoading ? '...' : hasDashboardError ? '—' : formatPrice(dashboardStats?.monthlyRevenueMnt ?? 0),
      delta: isLoading ? 'Ачаалж байна...' : hasDashboardError ? 'Ачаалж чадсангүй' : `${(dashboardStats?.revenueDeltaPct ?? 0).toFixed(1)}% өмнөх сараас`,
      icon: CreditCard,
      color: 'text-brand-accent',
      bg: 'bg-brand-accent/10',
    },
    {
      label: 'Хүлээгдэж буй',
      value: isLoading ? '...' : hasDashboardError ? '—' : formatInteger((dashboardStats?.pendingBusinesses ?? 0) + (dashboardStats?.pendingReviews ?? 0)),
      delta: isLoading ? 'Ачаалж байна...' : hasDashboardError ? 'Ачаалж чадсангүй' : `${formatInteger(dashboardStats?.pendingBusinesses ?? 0)} бизнес, ${formatInteger(dashboardStats?.pendingReviews ?? 0)} санал`,
      icon: Clock,
      color: 'text-brand-warning',
      bg: 'bg-brand-warning/10',
    },
  ]
  const recentApprovals = data?.recentApprovals ?? []
  const recentReviews = data?.recentReviews ?? []
  const revenueChartData = (data?.revenueSeries ?? [])
    .slice(-revenuePeriod)
    .map((item) => ({
      ...item,
      label: new Intl.DateTimeFormat('mn-MN', { month: 'short', day: 'numeric' }).format(new Date(item.date)),
    }))
  const selectedRevenueTotal = revenueChartData.reduce((sum, item) => sum + item.revenueMnt, 0)
  const hasRevenueData = revenueChartData.some((item) => item.revenueMnt > 0)
  const averageMrr = dashboardStats?.activeSubscriptions
    ? (dashboardStats.monthlyRevenueMnt / dashboardStats.activeSubscriptions)
    : 0

  async function updateBusiness(id: string, payload: Record<string, unknown>) {
    setActionError('')
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const responsePayload = await res.json().catch(() => null)

    if (!res.ok || !responsePayload?.success) {
      setActionError(responsePayload?.error || 'Бизнесийн төлөв шинэчлэхэд алдаа гарлаа')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  async function deleteBusiness(id: string) {
    if (!window.confirm('Энэ бизнесийг устгах уу?')) return

    setActionError('')
    const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
    const responsePayload = await res.json().catch(() => null)

    if (!res.ok || !responsePayload?.success) {
      setActionError(responsePayload?.error || 'Бизнес устгахад алдаа гарлаа')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  async function moderateReview(id: string, action: 'approve' | 'delete') {
    if (action === 'delete' && !window.confirm('Энэ санал хүсэлтийг устгах уу?')) return

    setActionError('')
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: action === 'approve' ? 'PATCH' : 'DELETE',
      headers: action === 'approve' ? { 'Content-Type': 'application/json' } : undefined,
      body: action === 'approve' ? JSON.stringify({ action: 'approve' }) : undefined,
    })
    const responsePayload = await res.json().catch(() => null)

    if (!res.ok || !responsePayload?.success) {
      setActionError(responsePayload?.error || 'Санал хүсэлт шинэчлэхэд алдаа гарлаа')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium text-foreground-muted">Админ</p>
          <h1 className="font-bold">Хяналтын самбар</h1>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
          {actionError && (
            <div className="mb-4 rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
              {actionError}
            </div>
          )}
          {hasDashboardError && (
            <div className="mb-4 rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
              Хяналтын самбарын мэдээлэл ачаалж чадсангүй. Датабаазын холболт болон session-ээ шалгаад дахин оролдоно уу.
            </div>
          )}

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
                      <button
                        onClick={() => updateBusiness(item.id, { status: 'ACTIVE', isVerified: true })}
                        className="size-8 rounded-lg bg-brand-success/10 text-brand-success hover:bg-brand-success/20 flex items-center justify-center transition-colors"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => deleteBusiness(item.id)}
                        className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 flex items-center justify-center transition-colors"
                      >
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
                      <button
                        onClick={() => moderateReview(item.id, 'approve')}
                        className="size-8 rounded-lg bg-brand-success/10 text-brand-success flex items-center justify-center hover:bg-brand-success/20 transition-colors"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => moderateReview(item.id, 'delete')}
                        className="size-8 rounded-lg bg-brand-danger/10 text-brand-danger flex items-center justify-center hover:bg-brand-danger/20 transition-colors"
                      >
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

          {/* Revenue chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Орлогын график</h2>
              <div className="flex items-center gap-2">
                {REVENUE_PERIODS.map(period => (
                  <button
                    key={period.days}
                    onClick={() => setRevenuePeriod(period.days)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      period.days === revenuePeriod ? 'bg-brand-primary text-white' : 'hover:bg-background-secondary text-foreground-muted'
                  )}>
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 rounded-xl bg-background-secondary px-2 py-4">
              {hasRevenueData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }}
                      minTickGap={18}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={68}
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }}
                      tickFormatter={(value) => `₮${formatNumber(Number(value))}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatPrice(Number(value)), 'Орлого']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? formatRelativeTime(payload[0].payload.date) : ''}
                      contentStyle={{
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12,
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueMnt"
                      stroke="hsl(var(--brand-primary))"
                      strokeWidth={2.5}
                      fill="url(#adminRevenueGradient)"
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart2 size={36} className="text-foreground-subtle mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">Сонгосон хугацаанд төлөгдсөн орлого алга</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats below chart */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
              {[
                { label: 'Нийт орлого', value: isLoading ? '...' : hasDashboardError ? '—' : formatPrice(selectedRevenueTotal) },
                { label: 'Идэвхтэй захиалга', value: isLoading ? '...' : hasDashboardError ? '—' : formatInteger(dashboardStats?.activeSubscriptions ?? 0) },
                { label: 'Дундаж MRR', value: isLoading ? '...' : hasDashboardError ? '—' : formatPrice(averageMrr) },
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
  )
}
