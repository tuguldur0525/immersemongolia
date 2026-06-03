'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  Building2,
  ChevronRight,
  CreditCard,
  Eye,
  Globe,
  Heart,
  Phone,
  Plus,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import BusinessDashboardShell from '@/components/dashboard/business/BusinessDashboardShell'
import { cn, formatInteger, formatPrice, formatRelativeTime } from '@/lib/utils'

const QUICK_LINKS = [
  { href: '/dashboard/business/listings/new', label: 'Бизнес нэмэх', icon: Plus, primary: true },
  { href: '/dashboard/business/analytics', label: 'Аналитик', icon: BarChart2 },
  { href: '/dashboard/business/media', label: 'Медиа', icon: Globe },
  { href: '/dashboard/business/leads', label: 'Лидүүд', icon: Users },
  { href: '/dashboard/business/payments', label: 'Төлбөр', icon: CreditCard },
]

type DashboardBusiness = {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  status: string
  totalViews: number
  totalSaves: number
  totalClicks: number
  avgRating: number
  totalReviews: number
}

type BusinessDashboardData = {
  user: { firstName: string; displayName: string | null }
  primaryBusiness: DashboardBusiness | null
  businesses: DashboardBusiness[]
  stats: {
    totalViews: number
    totalSaves: number
    totalClicks: number
    phoneClicks: number
    avgRating: number
    totalReviews: number
    viewsTrend: number
    savesTrend: number
    phoneClicksTrend: number
    ratingTrend: number
  }
  recentReviews: Array<{
    id: string
    user: string
    business: string
    businessSlug: string
    rating: number
    body: string | null
    createdAt: string
  }>
  subscription: {
    plan: string
    status: string
    isAnnual: boolean
    endDate: string
    renewalDate: string | null
    priceAtPurchase: number
    currency: string
  } | null
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Идэвхтэй', className: 'bg-brand-success/10 text-brand-success' },
  PENDING_REVIEW: { label: 'Хянагдаж байна', className: 'bg-brand-warning/10 text-brand-warning' },
  SUSPENDED: { label: 'Түдгэлзсэн', className: 'bg-brand-danger/10 text-brand-danger' },
  CLOSED: { label: 'Хаасан', className: 'bg-background-tertiary text-foreground-muted' },
  CLAIMED: { label: 'Эзэмшилтэй', className: 'bg-brand-primary/10 text-brand-primary' },
}

export default function BusinessDashboardPage() {
  const { data, isLoading, error } = useQuery<BusinessDashboardData>({
    queryKey: ['business-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/business', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Failed to fetch business dashboard')
      return payload.data
    },
    staleTime: 60_000,
  })

  const stats = data?.stats
  const subscription = data?.subscription
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0

  const quickStats = [
    { label: 'Нийт харалт', value: stats?.totalViews ?? 0, delta: stats?.viewsTrend ?? 0, icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Хадгалсан', value: stats?.totalSaves ?? 0, delta: stats?.savesTrend ?? 0, icon: Heart, color: 'text-brand-danger', bg: 'bg-brand-danger/10' },
    { label: 'Утас товших', value: stats?.phoneClicks ?? 0, delta: stats?.phoneClicksTrend ?? 0, icon: Phone, color: 'text-brand-success', bg: 'bg-brand-success/10' },
    { label: 'Дундаж үнэлгээ', value: stats?.avgRating ?? 0, delta: stats?.ratingTrend ?? 0, icon: Star, color: 'text-brand-accent', bg: 'bg-brand-accent/10', rating: true },
  ]

  const displayName = data?.user.displayName || data?.user.firstName || 'Бизнес эрхлэгч'
  const businessName = data?.primaryBusiness?.nameMn || data?.primaryBusiness?.nameEn || 'Бизнес сонгоогүй'
  const recentReviews = data?.recentReviews ?? []
  const businesses = data?.businesses ?? []

  return (
    <BusinessDashboardShell
      title={`Сайн уу, ${displayName}!`}
      subtitle={businessName}
      actions={
        <Link href="/dashboard/business/listings/new" className="btn-brand py-2 text-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">Бизнес нэмэх</span>
        </Link>
      }
    >
      <div className="space-y-6 max-w-7xl">
        {error && (
          <div className="rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger">
            Dashboard мэдээлэл ачаалж чадсангүй.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gradient rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-bold">{subscription?.plan || 'FREE'} тарифф</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                {subscription?.status || 'Идэвхгүй'}
              </span>
            </div>
            <p className="text-white/80 text-sm">
              {isLoading
                ? 'Тариффын мэдээлэл ачаалж байна...'
                : subscription
                  ? `Таны тарифф ${daysLeft} хоногийн дараа дуусна - ${formatPrice(subscription.priceAtPurchase)} / ${subscription.isAnnual ? 'жил' : 'сар'}`
                  : 'Идэвхтэй төлбөртэй тарифф одоогоор алга'}
            </p>
          </div>
          <Link
            href="/dashboard/business/payments"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors text-center"
          >
            Удирдах
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 min-h-[148px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('size-10 rounded-xl flex items-center justify-center', stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                {!stat.rating && (
                  <div className={cn('flex items-center gap-1 text-xs font-medium', stat.delta >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
                    {stat.delta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {Math.abs(stat.delta).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold mb-0.5">
                {isLoading ? '...' : stat.rating ? Number(stat.value).toFixed(1) : formatInteger(Number(stat.value))}
              </p>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {QUICK_LINKS.map((link, i) => (
            <motion.div key={link.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
              <Link
                href={link.href}
                className={cn(
                  'min-h-[74px] flex items-center gap-3 p-4 rounded-2xl border border-border text-sm font-medium hover:shadow-md transition-all',
                  link.primary ? 'bg-brand-primary text-white' : 'bg-card hover:border-brand-primary/40'
                )}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Building2 size={16} className="text-brand-primary" />
                Миний бизнесүүд
              </h2>
              <Link href="/dashboard/business/listings" className="text-xs text-brand-primary hover:underline">Удирдах</Link>
            </div>
            <div className="divide-y divide-border">
              {businesses.map((business) => {
                const status = STATUS_LABELS[business.status] ?? STATUS_LABELS.PENDING_REVIEW
                return (
                  <Link
                    key={business.id}
                    href={`/dashboard/business/listings/${business.id}/edit`}
                    className="flex items-center gap-4 p-4 hover:bg-background-secondary transition-colors group"
                  >
                    <div className="size-10 rounded-xl bg-background-tertiary flex items-center justify-center">
                      <Building2 size={18} className="text-foreground-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-brand-primary">{business.nameMn}</p>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', status.className)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {formatInteger(business.totalViews)} харалт - {formatInteger(business.totalClicks)} товшилт
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-foreground-muted group-hover:text-brand-primary" />
                  </Link>
                )
              })}
              {!isLoading && businesses.length === 0 && (
                <div className="py-12 text-center text-sm text-foreground-muted">
                  Одоогоор бүртгэлтэй бизнес алга.
                  <div className="mt-4">
                    <Link href="/dashboard/business/listings/new" className="btn-brand py-2 text-sm">
                      <Plus size={15} />
                      Эхний бизнесээ нэмэх
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Star size={16} className="text-brand-accent" />
                Сүүлийн санал хүсэлтүүд
              </h2>
              <Link href="/dashboard/business/analytics" className="text-xs text-brand-primary hover:underline">Аналитик харах</Link>
            </div>
            <div className="divide-y divide-border">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-full bg-brand-primary/15 flex items-center justify-center text-xs font-bold text-brand-primary">
                        {review.user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate">{review.user}</span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Star
                          key={score}
                          size={11}
                          className={score <= review.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2">{review.body}</p>
                  <p className="text-xs text-foreground-muted mt-1">{formatRelativeTime(review.createdAt)}</p>
                </div>
              ))}
              {!isLoading && recentReviews.length === 0 && (
                <div className="py-12 text-center text-sm text-foreground-muted">
                  Одоохондоо санал хүсэлт байхгүй байна.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-5 border-b border-border">
            <h2 className="font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-primary" />
              Дараагийн сайжруулалт
            </h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { title: 'Зургийн галерей', desc: 'Cover, logo, gallery зургаа шинэчилнэ', action: '/dashboard/business/media', impact: 'Өндөр' },
              { title: 'Лидүүдээ шалгах', desc: 'Уншаагүй харилцагч байгаа эсэхийг шалгана', action: '/dashboard/business/leads', impact: 'Өндөр' },
              { title: 'Аналитик татах', desc: 'CSV тайлангаа татаж хадгална', action: '/dashboard/business/analytics', impact: 'Дунд' },
              { title: 'Тарифф удирдах', desc: 'Premium боломжуудаа шалгана', action: '/dashboard/business/payments', impact: 'Дунд' },
            ].map((tip) => (
              <Link key={tip.title} href={tip.action} className="p-4 hover:bg-background-secondary transition-colors group">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium group-hover:text-brand-primary">{tip.title}</p>
                  <ChevronRight size={14} className="text-foreground-muted group-hover:text-brand-primary" />
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed">{tip.desc}</p>
                <span className="inline-flex mt-3 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                  {tip.impact}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </BusinessDashboardShell>
  )
}
