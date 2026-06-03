'use client'
// src/app/dashboard/admin/analytics/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  BarChart2,
  Building2,
  CreditCard,
  Eye,
  Loader2,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn, formatInteger, formatNumber, formatPrice } from '@/lib/utils'

const PERIODS = [
  { label: '7 хоног', days: 7 },
  { label: '30 хоног', days: 30 },
  { label: '90 хоног', days: 90 },
  { label: '1 жил', days: 365 },
] as const

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Эхлэгч',
  PROFESSIONAL: 'Мэргэжлийн',
  ENTERPRISE: 'Корпорат',
  FREE: 'Үнэгүй',
  DIRECT: 'Шууд төлбөр',
}

const REVIEW_LABELS: Record<string, string> = {
  PUBLISHED: 'Нийтлэгдсэн',
  PENDING_MODERATION: 'Хянагдаж байна',
  FLAGGED: 'Тэмдэглэгдсэн',
  REJECTED: 'Татгалзсан',
}

const PIE_COLORS = [
  'hsl(var(--brand-primary))',
  'hsl(var(--brand-secondary))',
  'hsl(var(--brand-accent))',
  'hsl(var(--brand-success))',
  'hsl(var(--brand-warning))',
]

type AdminAnalyticsData = {
  summary: {
    totalUsers: number
    totalBusinesses: number
    totalReviews: number
    activeSubscriptions: number
    newUsers: number
    newBusinesses: number
    newReviews: number
    totalRevenueMnt: number
    revenueDeltaPct: number
    totalViews: number
    totalClicks: number
    totalSaves: number
    adCtr: number
  }
  trend: Array<{
    date: string
    newUsers: number
    newBusinesses: number
    reviews: number
    revenueMnt: number
    views: number
    clicks: number
  }>
  topBusinesses: Array<{
    id: string
    slug: string
    name: string
    category: string
    categoryIcon: string | null
    rating: number
    reviews: number
    views: number
    clicks: number
    saves: number
  }>
  categories: Array<{
    id: string
    name: string
    icon: string | null
    businessCount: number
    views: number
    reviews: number
  }>
  paymentsByPlan: Array<{ plan: string; payments: number; revenueMnt: number }>
  reviewStatusCounts: Record<string, number>
  ads: { total: number; active: number; impressions: number; clicks: number; spendMnt: number }
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['days']>(30)

  const { data, isLoading, error } = useQuery<AdminAnalyticsData>({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?days=${period}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Аналитик мэдээлэл ачаалж чадсангүй')
      }
      return payload.data
    },
    staleTime: 30_000,
  })

  const summary = data?.summary
  const trend = (data?.trend ?? []).map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat('mn-MN', { month: 'short', day: 'numeric' }).format(new Date(item.date)),
  }))
  const maxCategoryViews = Math.max(...(data?.categories ?? []).map((category) => category.views), 1)
  const paymentPieData = data?.paymentsByPlan.map((item) => ({
    name: PLAN_LABELS[item.plan] ?? item.plan,
    value: item.revenueMnt,
  })) ?? []
  const reviewStatusData = Object.entries(data?.reviewStatusCounts ?? {}).map(([status, count]) => ({
    status,
    label: REVIEW_LABELS[status] ?? status,
    count,
  }))

  const stats = [
    { label: 'Нийт хэрэглэгч', value: formatInteger(summary?.totalUsers ?? 0), delta: `+${formatInteger(summary?.newUsers ?? 0)} энэ хугацаанд`, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Нийт бизнес', value: formatInteger(summary?.totalBusinesses ?? 0), delta: `+${formatInteger(summary?.newBusinesses ?? 0)} энэ хугацаанд`, icon: Building2, color: 'text-brand-success', bg: 'bg-brand-success/10' },
    { label: 'Орлого', value: formatPrice(summary?.totalRevenueMnt ?? 0), delta: `${(summary?.revenueDeltaPct ?? 0).toFixed(1)}% өмнөх үеэс`, icon: CreditCard, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
    { label: 'Хандалт', value: formatInteger(summary?.totalViews ?? 0), delta: `${formatInteger(summary?.totalClicks ?? 0)} click, ${formatInteger(summary?.totalSaves ?? 0)} save`, icon: Eye, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
  ]

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Аналитик</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-bold text-lg">Платформ аналитик</h1>
          <div className="flex gap-1 bg-background-secondary rounded-xl border border-border p-1 w-fit">
            {PERIODS.map((item) => (
              <button
                key={item.days}
                onClick={() => setPeriod(item.days)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  period === item.days ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-8 space-y-6">
        {isLoading || error ? (
          <div className="bg-card rounded-2xl border border-border py-24 text-center">
            {isLoading ? (
              <Loader2 size={36} className="text-foreground-muted mx-auto mb-3 animate-spin" />
            ) : (
              <Activity size={36} className="text-foreground-subtle mx-auto mb-3" />
            )}
            <p className="font-medium">{isLoading ? 'Аналитик ачаалж байна...' : 'Аналитик мэдээлэл ачаалж чадсангүй'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-card rounded-2xl border border-border p-5"
                >
                  <div className={cn('size-10 rounded-xl flex items-center justify-center mb-4', stat.bg)}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
                  <p className="text-xs text-foreground-muted mt-1">{stat.delta}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
              <section className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold">Орлогын trend</h2>
                    <p className="text-xs text-foreground-muted mt-1">Төлөгдсөн төлбөрүүдийн өдөр тутмын нийлбэр</p>
                  </div>
                  <TrendingUp size={18} className="text-brand-primary" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.36} />
                          <stop offset="95%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} minTickGap={18} />
                      <YAxis axisLine={false} tickLine={false} width={72} tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} tickFormatter={(value) => `₮${formatNumber(Number(value))}`} />
                      <Tooltip
                        formatter={(value) => [formatPrice(Number(value)), 'Орлого']}
                        contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 12, background: 'hsl(var(--card))' }}
                      />
                      <Area type="monotone" dataKey="revenueMnt" stroke="hsl(var(--brand-primary))" strokeWidth={2.5} fill="url(#analyticsRevenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold">Идэвхжил</h2>
                    <p className="text-xs text-foreground-muted mt-1">Хэрэглэгч, бизнес, review өсөлт</p>
                  </div>
                  <BarChart2 size={18} className="text-brand-secondary" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} minTickGap={18} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground-muted))' }} />
                      <Tooltip contentStyle={{ border: '1px solid hsl(var(--border))', borderRadius: 12, background: 'hsl(var(--card))' }} />
                      <Bar dataKey="newUsers" name="Шинэ хэрэглэгч" fill="hsl(var(--brand-primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="newBusinesses" name="Шинэ бизнес" fill="hsl(var(--brand-success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reviews" name="Review" fill="hsl(var(--brand-accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <section className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-semibold">Шилдэг бизнесүүд</h2>
                  <Link href="/dashboard/admin/businesses" className="text-sm text-brand-primary hover:underline">Удирдах</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background-secondary text-xs text-foreground-muted">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Бизнес</th>
                        <th className="px-5 py-3 text-right font-medium">Харалт</th>
                        <th className="px-5 py-3 text-right font-medium hidden sm:table-cell">Click</th>
                        <th className="px-5 py-3 text-right font-medium hidden md:table-cell">Үнэлгээ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(data?.topBusinesses ?? []).map((business) => (
                        <tr key={business.id} className="hover:bg-background-secondary transition-colors">
                          <td className="px-5 py-4">
                            <Link href={`/business/${business.slug}`} target="_blank" className="font-medium hover:text-brand-primary">{business.name}</Link>
                            <p className="text-xs text-foreground-muted">{business.categoryIcon || '•'} {business.category}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-medium">{formatInteger(business.views)}</td>
                          <td className="px-5 py-4 text-right hidden sm:table-cell">{formatInteger(business.clicks)}</td>
                          <td className="px-5 py-4 text-right hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 justify-end">
                              <Star size={12} className="text-brand-accent fill-current" />
                              {business.rating.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(data?.topBusinesses ?? []).length === 0 && (
                    <div className="py-16 text-center text-sm text-foreground-muted">Бизнесийн мэдээлэл алга</div>
                  )}
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-5">
                <h2 className="font-semibold mb-5">Ангиллын гүйцэтгэл</h2>
                <div className="space-y-4">
                  {(data?.categories ?? []).map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="size-7 rounded-lg bg-background-secondary flex items-center justify-center text-sm">{category.icon || '•'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{category.name}</p>
                            <p className="text-xs text-foreground-muted">{category.businessCount} бизнес • {formatInteger(category.reviews)} review</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{formatInteger(category.views)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-background-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(4, (category.views / maxCategoryViews) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  {(data?.categories ?? []).length === 0 && (
                    <div className="py-12 text-center text-sm text-foreground-muted">Ангиллын мэдээлэл алга</div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <section className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold">Төлбөр тариффаар</h2>
                  <CreditCard size={18} className="text-brand-accent" />
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentPieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={3}>
                        {paymentPieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Орлого']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {(data?.paymentsByPlan ?? []).map((item, index) => (
                    <div key={item.plan} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {PLAN_LABELS[item.plan] ?? item.plan}
                      </span>
                      <span className="font-medium">{formatPrice(item.revenueMnt)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold">Review төлөв</h2>
                  <MessageSquare size={18} className="text-brand-primary" />
                </div>
                <div className="space-y-3">
                  {reviewStatusData.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded-xl bg-background-secondary px-3 py-2.5">
                      <span className="text-sm text-foreground-secondary">{item.label}</span>
                      <span className="font-bold">{formatInteger(item.count)}</span>
                    </div>
                  ))}
                  {reviewStatusData.length === 0 && (
                    <div className="py-12 text-center text-sm text-foreground-muted">Review мэдээлэл алга</div>
                  )}
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold">Зар сурталчилгаа</h2>
                  <Megaphone size={18} className="text-brand-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Идэвхтэй', value: `${formatInteger(data?.ads.active ?? 0)} / ${formatInteger(data?.ads.total ?? 0)}`, icon: Activity },
                    { label: 'Impression', value: formatInteger(data?.ads.impressions ?? 0), icon: Eye },
                    { label: 'Click', value: formatInteger(data?.ads.clicks ?? 0), icon: MousePointerClick },
                    { label: 'CTR', value: `${(summary?.adCtr ?? 0).toFixed(2)}%`, icon: TrendingUp },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-background-secondary p-3">
                      <item.icon size={15} className="text-foreground-muted mb-2" />
                      <p className="font-bold">{item.value}</p>
                      <p className="text-xs text-foreground-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
