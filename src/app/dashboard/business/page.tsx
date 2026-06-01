'use client'
// src/app/dashboard/business/page.tsx
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Eye, Heart, Phone, Star, TrendingUp, ArrowUp, ArrowDown, BarChart2, Building2, CreditCard, Users, ChevronRight, Plus, Zap, Globe } from 'lucide-react'
import { cn, formatDate, formatInteger, formatPrice, formatRelativeTime } from '@/lib/utils'

const QUICK_LINKS = [
  { href: '/dashboard/business/listings/new', label: 'Бизнес нэмэх', icon: Plus, color: 'bg-brand-primary text-white' },
  { href: '/dashboard/business/analytics', label: 'Аналитик харах', icon: BarChart2, color: 'bg-background-secondary' },
  { href: '/dashboard/business/media', label: 'Зураг оруулах', icon: Globe, color: 'bg-background-secondary' },
  { href: '/dashboard/business/payments', label: 'Тарифф дээшлүүлэх', icon: Zap, color: 'bg-background-secondary' },
]

type BusinessDashboardData = {
  user: { firstName: string; displayName: string | null }
  primaryBusiness: { id: string; slug: string; nameMn: string; nameEn: string | null; status: string } | null
  stats: {
    totalViews: number
    totalSaves: number
    phoneClicks: number
    avgRating: number
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

export default function BusinessDashboardPage() {
  const { data } = useQuery<BusinessDashboardData>({
    queryKey: ['business-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/business')
      if (!res.ok) throw new Error('Failed to fetch business dashboard')
      const { data } = await res.json()
      return data
    },
    staleTime: 60_000,
  })
  const stats = data?.stats
  const subscription = data?.subscription
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0
  const quickStats = [
    { label: 'Нийт харалт', value: formatInteger(stats?.totalViews ?? 0), delta: stats?.viewsTrend ?? 0, positive: (stats?.viewsTrend ?? 0) >= 0, icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Хадгалсан', value: formatInteger(stats?.totalSaves ?? 0), delta: stats?.savesTrend ?? 0, positive: (stats?.savesTrend ?? 0) >= 0, icon: Heart, color: 'text-brand-danger', bg: 'bg-brand-danger/10' },
    { label: 'Утас товших', value: formatInteger(stats?.phoneClicks ?? 0), delta: stats?.phoneClicksTrend ?? 0, positive: (stats?.phoneClicksTrend ?? 0) >= 0, icon: Phone, color: 'text-brand-success', bg: 'bg-brand-success/10' },
    { label: 'Дундаж үнэлгээ', value: (stats?.avgRating ?? 0).toFixed(1), delta: stats?.ratingTrend ?? 0, positive: (stats?.ratingTrend ?? 0) >= 0, icon: Star, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  ]
  const displayName = data?.user.displayName || data?.user.firstName || 'Бизнес эрхлэгч'
  const businessName = data?.primaryBusiness?.nameMn || data?.primaryBusiness?.nameEn || 'Бизнес сонгоогүй'
  const recentReviews = data?.recentReviews ?? []

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl">Сайн уу, {displayName}!</h1>
            <p className="text-sm text-foreground-muted mt-0.5">{businessName}</p>
          </div>
          <Link href="/dashboard/business/listings/new" className="btn-brand py-2.5 text-sm hidden sm:flex">
            <Plus size={16} />
            Бизнес нэмэх
          </Link>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-6xl">
        {/* Subscription banner */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gradient rounded-2xl p-5 flex items-center justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-bold">{subscription?.plan || 'FREE'} тарифф</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">{subscription?.status || 'Идэвхгүй'}</span>
            </div>
            <p className="text-white/80 text-sm">
              {subscription
                ? `Таны тарифф ${daysLeft} хоногийн дараа дуусна • ${formatPrice(subscription.priceAtPurchase)} / ${subscription.isAnnual ? 'жил' : 'сар'}`
                : 'Идэвхтэй төлбөртэй тарифф одоогоор алга'}
            </p>
          </div>
          <Link href="/dashboard/business/payments"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors">
            Удирдах
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('size-10 rounded-xl flex items-center justify-center', stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div className={cn('flex items-center gap-1 text-xs font-medium', stat.positive ? 'text-brand-success' : 'text-brand-danger')}>
                  {stat.positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {Math.abs(stat.delta).toFixed(1)}%
                </div>
              </div>
              <p className="text-2xl font-bold mb-0.5">{stat.value}</p>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link, i) => (
            <motion.div key={link.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
              <Link href={link.href}
                className={cn('flex items-center gap-3 p-4 rounded-2xl border border-border text-sm font-medium hover:shadow-md transition-all', link.color)}>
                <link.icon size={18} />
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent reviews */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Star size={16} className="text-brand-accent" />
                Сүүлийн санал хүсэлтүүд
              </h2>
              <Link href="/dashboard/business/analytics" className="text-xs text-brand-primary hover:underline">Бүгдийг харах</Link>
            </div>
            <div className="divide-y divide-border">
              {recentReviews.map(review => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-brand-primary/15 flex items-center justify-center text-xs font-bold text-brand-primary">
                        {review.user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{review.user}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= review.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2">{review.body}</p>
                  <p className="text-xs text-foreground-muted mt-1">{formatRelativeTime(review.createdAt)}</p>
                </div>
              ))}
              {recentReviews.length === 0 && (
                <div className="py-10 text-center text-sm text-foreground-muted">
                  Одоохондоо санал хүсэлт байхгүй байна
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance tips */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" />
                Сайжруулах зөвлөмжүүд
              </h2>
            </div>
            <div className="divide-y divide-border">
              {[
                { title: '360° виртуал аялал нэмэх', desc: 'Харалтыг 3 дахин нэмэгдүүлнэ', action: '/dashboard/business/media', done: false, impact: 'Өндөр' },
                { title: 'Дэлгэрэнгүй цагийн хуваарь', desc: 'Хэрэглэгчдэд тустай', action: '/dashboard/business/listings', done: true, impact: 'Дунд' },
                { title: '10+ зураг байршуулах', desc: '5 зураг нэмсэн', action: '/dashboard/business/media', done: false, impact: 'Өндөр' },
                { title: 'Санал хүсэлтэд хариулах', desc: '2 хариулаагүй санал байна', action: '#', done: false, impact: 'Дунд' },
              ].map((tip, i) => (
                <Link key={i} href={tip.action}
                  className="flex items-center gap-4 p-4 hover:bg-background-secondary transition-colors group">
                  <div className={cn('size-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    tip.done ? 'bg-brand-success/10' : 'bg-background-tertiary')}>
                    {tip.done
                      ? <Star size={15} className="text-brand-success fill-current" />
                      : <div className="size-4 rounded-full border-2 border-border" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', tip.done && 'line-through text-foreground-muted')}>{tip.title}</p>
                    <p className="text-xs text-foreground-muted">{tip.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      tip.impact === 'Өндөр' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-warning/10 text-brand-warning')}>
                      {tip.impact}
                    </span>
                    <ChevronRight size={14} className="text-foreground-muted group-hover:text-brand-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
