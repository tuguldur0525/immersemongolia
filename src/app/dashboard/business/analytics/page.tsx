'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  Download,
  Eye,
  Globe,
  Heart,
  MapPin,
  Phone,
  Star,
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
import BusinessDashboardShell from '@/components/dashboard/business/BusinessDashboardShell'
import { cn, formatInteger } from '@/lib/utils'

const PERIODS = [
  { value: '7', label: '7 хоног' },
  { value: '30', label: '30 хоног' },
  { value: '90', label: '3 сар' },
  { value: '365', label: '1 жил' },
]

type AnalyticsData = {
  period: string
  days: number
  businesses: Array<{ id: string; name: string; slug: string }>
  metrics: {
    views: number
    saves: number
    clicks: number
    phoneClicks: number
    websiteClicks: number
    mapClicks: number
    reviewsCount: number
    avgRating: number
    viewsTrend: number
    savesTrend: number
    clicksTrend: number
    phoneClicksTrend: number
    websiteClicksTrend: number
    mapClicksTrend: number
  }
  chart: Array<{
    date: string
    label: string
    views: number
    saves: number
    clicks: number
    phoneClicks: number
    websiteClicks: number
    mapClicks: number
  }>
  clickTypes: Array<{ name: string; value: number }>
  sources: Array<{ key: string; name: string; value: number; percent: number; color: string }>
  topBusinesses: Array<{
    id: string
    slug: string
    name: string
    category: string
    icon: string | null
    views: number
    saves: number
    clicks: number
    phoneClicks: number
    reviewsCount: number
    totalViews: number
    avgRating: number
  }>
}

function trendClass(delta: number) {
  return delta >= 0 ? 'text-brand-success' : 'text-brand-danger'
}

function downloadCsv(data: AnalyticsData | undefined) {
  if (!data) return

  const rows = [
    ['date', 'views', 'saves', 'clicks', 'phone_clicks', 'website_clicks', 'map_clicks'],
    ...data.chart.map((row) => [
      row.date,
      row.views,
      row.saves,
      row.clicks,
      row.phoneClicks,
      row.websiteClicks,
      row.mapClicks,
    ]),
  ]
  const csv = rows.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `business-analytics-${data.period}d.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function BusinessAnalyticsPage() {
  const [period, setPeriod] = useState('30')
  const [businessId, setBusinessId] = useState('all')

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['business-analytics', period, businessId],
    queryFn: async () => {
      const params = new URLSearchParams({ period })
      if (businessId !== 'all') params.set('businessId', businessId)
      const res = await fetch(`/api/dashboard/business/analytics?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Failed to fetch analytics')
      return payload.data
    },
    staleTime: 30_000,
  })

  const metricCards = useMemo(() => {
    const metrics = data?.metrics
    return [
      { label: 'Нийт харалт', value: metrics?.views ?? 0, delta: metrics?.viewsTrend ?? 0, icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
      { label: 'Хадгалсан', value: metrics?.saves ?? 0, delta: metrics?.savesTrend ?? 0, icon: Heart, color: 'text-brand-danger', bg: 'bg-brand-danger/10' },
      { label: 'Утас товших', value: metrics?.phoneClicks ?? 0, delta: metrics?.phoneClicksTrend ?? 0, icon: Phone, color: 'text-brand-success', bg: 'bg-brand-success/10' },
      { label: 'Вэб товших', value: metrics?.websiteClicks ?? 0, delta: metrics?.websiteClicksTrend ?? 0, icon: Globe, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
      { label: 'Газрын зураг', value: metrics?.mapClicks ?? 0, delta: metrics?.mapClicksTrend ?? 0, icon: MapPin, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
      { label: 'Дундаж үнэлгээ', value: metrics?.avgRating ?? 0, delta: 0, icon: Star, color: 'text-brand-accent', bg: 'bg-brand-accent/10', rating: true },
    ]
  }, [data])

  const hasSources = (data?.sources ?? []).some((source) => source.value > 0)

  return (
    <BusinessDashboardShell
      title="Аналитик тайлан"
      subtitle="Харалт, хадгалалт, товшилтын бодит үзүүлэлт"
      breadcrumbs={[{ label: 'Хяналтын самбар', href: '/dashboard/business' }, { label: 'Аналитик' }]}
      actions={
        <button
          onClick={() => downloadCsv(data)}
          disabled={!data || isLoading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors disabled:opacity-50"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Татах</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex gap-1 p-1 bg-card rounded-xl border border-border w-fit overflow-x-auto">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  period === item.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {data && data.businesses.length > 1 && (
            <select
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
              className="w-full lg:w-72 px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="all">Бүх бизнес</option>
              {data.businesses.map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger">
            Аналитик мэдээлэл ачаалж чадсангүй.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {metricCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl p-4 border border-border min-h-[142px]"
            >
              <div className={cn('size-9 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="text-xl font-bold mb-0.5">
                {isLoading ? '...' : card.rating ? Number(card.value).toFixed(1) : formatInteger(Number(card.value))}
              </p>
              <p className="text-xs text-foreground-muted mb-1.5">{card.label}</p>
              {!card.rating && (
                <div className={cn('flex items-center gap-1 text-xs font-medium', trendClass(card.delta))}>
                  {card.delta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {Math.abs(card.delta).toFixed(1)}%
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-bold text-base">Харалтын динамик</h2>
              <p className="text-sm text-foreground-muted">Сонгосон хугацааны өдрийн үзүүлэлт</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-primary" />Харалт</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-success" />Хадгалсан</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-accent" />Товших</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.chart ?? []}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 85% 57%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(220 85% 57%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155 65% 42%)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="hsl(155 65% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(220 10% 58%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 10% 58%)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(220 85% 57%)" strokeWidth={2} fill="url(#viewsGrad)" name="Харалт" />
              <Area type="monotone" dataKey="saves" stroke="hsl(155 65% 42%)" strokeWidth={2} fill="url(#savesGrad)" name="Хадгалсан" />
              <Area type="monotone" dataKey="clicks" stroke="hsl(35 95% 55%)" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Товших" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-base mb-1">Товших төрөл</h2>
            <p className="text-sm text-foreground-muted mb-5">Хэрэглэгч ямар action хийж байна</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.clickTypes ?? []} barSize={34}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(220 85% 57%)" radius={[6, 6, 0, 0]} name="Тоо" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-base mb-1">Хандалтын эх үүсвэр</h2>
            <p className="text-sm text-foreground-muted mb-5">Analytics `sources` JSON талбараас</p>
            {hasSources ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={data?.sources ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {(data?.sources ?? []).map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 flex-1">
                  {(data?.sources ?? []).map((source) => (
                    <div key={source.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-2.5 rounded-full flex-shrink-0" style={{ background: source.color }} />
                        <span className="text-xs text-foreground-secondary truncate">{source.name}</span>
                      </div>
                      <span className="text-xs font-semibold">{source.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-foreground-muted">
                Эх үүсвэрийн data одоогоор бүртгэгдээгүй байна.
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Бизнесүүдийн гүйцэтгэл</h2>
              <p className="text-sm text-foreground-muted">Сонгосон хугацааны бодит үзүүлэлт</p>
            </div>
            <BarChart2 size={18} className="text-brand-primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary text-xs text-foreground-muted">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Бизнес</th>
                  <th className="text-right px-5 py-3 font-medium">Харалт</th>
                  <th className="text-right px-5 py-3 font-medium">Хадгалалт</th>
                  <th className="text-right px-5 py-3 font-medium">Товшилт</th>
                  <th className="text-right px-5 py-3 font-medium">Утас</th>
                  <th className="text-right px-5 py-3 font-medium">Үнэлгээ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.topBusinesses ?? []).map((business) => (
                  <tr key={business.id} className="hover:bg-background-secondary transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-52">
                        <div className="size-9 rounded-xl bg-background-tertiary flex items-center justify-center">
                          {business.icon || '🏢'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{business.name}</p>
                          <p className="text-xs text-foreground-muted truncate">{business.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">{formatInteger(business.views)}</td>
                    <td className="px-5 py-4 text-right">{formatInteger(business.saves)}</td>
                    <td className="px-5 py-4 text-right">{formatInteger(business.clicks)}</td>
                    <td className="px-5 py-4 text-right">{formatInteger(business.phoneClicks)}</td>
                    <td className="px-5 py-4 text-right">{business.avgRating ? business.avgRating.toFixed(1) : '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && (data?.topBusinesses ?? []).length === 0 && (
              <div className="py-14 text-center text-sm text-foreground-muted">Аналитик data хараахан алга байна.</div>
            )}
          </div>
        </motion.div>
      </div>
    </BusinessDashboardShell>
  )
}
