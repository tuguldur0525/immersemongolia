'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Search,
  Settings,
  Star,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import UserDashboardShell from '@/components/dashboard/user/UserDashboardShell'
import { cn, formatDate, formatInteger, formatRelativeTime } from '@/lib/utils'

type UserDashboardData = {
  profile: {
    id: string
    email: string
    firstName: string
    lastName: string
    displayName: string | null
    avatarUrl: string | null
    preferredLanguage: 'mn' | 'en'
    createdAt: string
    _count: { reviews: number; savedBusinesses: number; businesses: number }
  }
  savedBusinesses: Array<DashboardBusiness & { savedAt: string }>
  recentlyViewed: Array<DashboardBusiness & { viewedAt: string; source: string | null }>
  reviews: Array<{
    id: string
    status: 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED'
    rating: number
    title: string | null
    body: string | null
    createdAt: string
    business: {
      slug: string
      nameMn: string
      nameEn: string | null
      category: { nameMn: string; nameEn: string; icon: string | null }
    }
  }>
}

type DashboardBusiness = {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  coverImageUrl?: string | null
  logoUrl?: string | null
  avgRating: number
  totalReviews: number
  city?: string
  district?: string | null
  category: { nameMn: string; nameEn: string; icon: string | null }
}

type DashboardTab = 'overview' | 'saved' | 'recent' | 'reviews'

const TABS: Array<{ id: DashboardTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Ерөнхий', icon: User },
  { id: 'saved', label: 'Хадгалсан', icon: Heart },
  { id: 'recent', label: 'Сүүлд үзсэн', icon: Clock },
  { id: 'reviews', label: 'Санал хүсэлт', icon: Star },
]

function isDashboardTab(value: string | null): value is DashboardTab {
  return TABS.some((tab) => tab.id === value)
}

const REVIEW_STATUS = {
  PUBLISHED: { label: 'Нийтлэгдсэн', className: 'bg-brand-success/10 text-brand-success' },
  PENDING_MODERATION: { label: 'Хянагдаж байна', className: 'bg-brand-warning/10 text-brand-warning' },
  FLAGGED: { label: 'Тэмдэглэгдсэн', className: 'bg-brand-danger/10 text-brand-danger' },
  REJECTED: { label: 'Татгалзсан', className: 'bg-background-tertiary text-foreground-muted' },
}

function initials(profile?: UserDashboardData['profile']) {
  if (!profile) return 'U'
  return `${profile.lastName.charAt(0)}${profile.firstName.charAt(0)}`.trim().toUpperCase() || 'U'
}

function displayName(profile?: UserDashboardData['profile']) {
  if (!profile) return 'Хэрэглэгч'
  return profile.displayName || `${profile.lastName} ${profile.firstName}`.trim() || profile.email
}

function BusinessRow({
  business,
  timestamp,
}: {
  business: DashboardBusiness
  timestamp?: string
}) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand-primary/40 hover:shadow-md"
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background-secondary text-xl">
        {business.logoUrl || business.coverImageUrl ? (
          <img
            src={business.logoUrl || business.coverImageUrl || ''}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          business.category.icon || <Building2 size={20} className="text-foreground-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold transition-colors group-hover:text-brand-primary">
          {business.nameMn}
        </p>
        <p className="truncate text-xs text-foreground-muted">
          {business.category.nameMn}
          {business.district ? ` - ${business.district}` : ''}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Star size={11} className="fill-current text-brand-accent" />
          <span className="font-medium">{business.avgRating.toFixed(1)}</span>
          <span className="text-foreground-subtle">({formatInteger(business.totalReviews)})</span>
          {timestamp && <span className="text-foreground-subtle">- {formatRelativeTime(timestamp)}</span>}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-foreground-muted transition-colors group-hover:text-brand-primary" />
    </Link>
  )
}

function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon
  title: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="rounded-2xl border border-border bg-card py-16 text-center">
      <Icon size={36} className="mx-auto mb-3 text-foreground-subtle" />
      <p className="text-sm font-medium text-foreground-secondary">{title}</p>
      {action && (
        <Link href={action.href} className="btn-brand mt-4 py-2 text-sm">
          {action.label}
        </Link>
      )}
    </div>
  )
}

function UserDashboardContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  useEffect(() => {
    const nextTab = searchParams.get('tab')
    if (isDashboardTab(nextTab)) setActiveTab(nextTab)
  }, [searchParams])

  function selectTab(tab: DashboardTab) {
    setActiveTab(tab)

    const url = new URL(window.location.href)
    if (tab === 'overview') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }

  const { data, isLoading, error } = useQuery<UserDashboardData>({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/user')
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Хэрэглэгчийн dashboard ачаалж чадсангүй')
      }
      return payload.data
    },
    staleTime: 60_000,
  })

  const profile = data?.profile
  const saved = data?.savedBusinesses ?? []
  const recent = data?.recentlyViewed ?? []
  const reviews = data?.reviews ?? []

  const stats = [
    { label: 'Хадгалсан', value: profile?._count.savedBusinesses ?? saved.length, icon: Heart, bg: 'bg-brand-danger/10', color: 'text-brand-danger' },
    { label: 'Санал хүсэлт', value: profile?._count.reviews ?? reviews.length, icon: Star, bg: 'bg-brand-accent/10', color: 'text-brand-accent' },
    { label: 'Сүүлд үзсэн', value: recent.length, icon: Clock, bg: 'bg-brand-primary/10', color: 'text-brand-primary' },
    { label: 'Хэл', value: profile?.preferredLanguage?.toUpperCase() ?? 'MN', icon: Settings, bg: 'bg-brand-success/10', color: 'text-brand-success', textValue: true },
  ]

  return (
    <UserDashboardShell
      title={isLoading ? 'Хэрэглэгчийн самбар' : `Сайн уу, ${displayName(profile)}`}
      subtitle={profile?.email}
      actions={
        <Link href="/business/search" className="btn-brand py-2 text-sm">
          <Search size={16} />
          <span className="hidden sm:inline">Газар хайх</span>
        </Link>
      }
    >
      <div className="max-w-7xl space-y-6">
        {error && (
          <div className="rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger">
            Хэрэглэгчийн бодит мэдээлэл ачаалж чадсангүй.
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-4">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="size-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white shadow-glow-brand">
                  {initials(profile)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{displayName(profile)}</p>
                <p className="truncate text-sm text-foreground-muted">{profile?.email || 'Ачаалж байна...'}</p>
                {profile?.createdAt && (
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {formatDate(profile.createdAt)}-аас хэрэглэж байна
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className={cn('mb-4 flex size-10 items-center justify-center rounded-xl', stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stat.textValue ? stat.value : formatInteger(Number(stat.value))}
                </p>
                <p className="text-xs text-foreground-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card py-20 text-center text-sm text-foreground-muted">
            <Loader2 size={22} className="mx-auto mb-3 animate-spin" />
            Ачаалж байна...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                <section className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold">Хадгалсан газрууд</h2>
                    <button onClick={() => selectTab('saved')} className="text-xs font-medium text-brand-primary hover:underline">
                      Бүгдийг харах
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {saved.slice(0, 4).map((business) => (
                      <BusinessRow key={business.id} business={business} timestamp={business.savedAt} />
                    ))}
                  </div>
                  {saved.length === 0 && (
                    <EmptyState icon={Heart} title="Одоогоор хадгалсан газар алга." action={{ href: '/business/search', label: 'Газар хайх' }} />
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold">Сүүлийн идэвх</h2>
                    <MapPin size={17} className="text-brand-primary" />
                  </div>
                  <div className="space-y-3">
                    {recent.slice(0, 5).map((business) => (
                      <BusinessRow key={`${business.id}-${business.viewedAt}`} business={business} timestamp={business.viewedAt} />
                    ))}
                  </div>
                  {recent.length === 0 && (
                    <EmptyState icon={Clock} title="Сүүлд үзсэн газрын мэдээлэл одоогоор алга." />
                  )}
                </section>
              </div>
            )}

            {activeTab === 'saved' && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Хадгалсан газрууд ({saved.length})</h2>
                {saved.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {saved.map((business, index) => (
                      <motion.div key={business.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                        <BusinessRow business={business} timestamp={business.savedAt} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Heart} title="Одоогоор хадгалсан газар байхгүй байна." action={{ href: '/business/search', label: 'Газар хайх' }} />
                )}
              </section>
            )}

            {activeTab === 'recent' && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Сүүлд үзсэн ({recent.length})</h2>
                {recent.length > 0 ? (
                  <div className="space-y-3">
                    {recent.map((business, index) => (
                      <motion.div key={`${business.id}-${business.viewedAt}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                        <BusinessRow business={business} timestamp={business.viewedAt} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Clock} title="Сүүлд үзсэн газрын мэдээлэл одоогоор алга." action={{ href: '/map', label: 'Газраар аялах' }} />
                )}
              </section>
            )}

            {activeTab === 'reviews' && (
              <section>
                <h2 className="mb-4 text-lg font-bold">Санал хүсэлт ({reviews.length})</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => {
                      const status = REVIEW_STATUS[review.status]
                      return (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="rounded-2xl border border-border bg-card p-5"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/business/${review.business.slug}`} className="font-semibold hover:text-brand-primary">
                                {review.business.nameMn}
                              </Link>
                              <div className="mt-1 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={13}
                                    className={star <= review.rating ? 'fill-current text-brand-accent' : 'text-foreground-subtle'}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', status.className)}>
                              {status.label}
                            </span>
                          </div>
                          {review.title && <p className="mb-1 text-sm font-semibold">{review.title}</p>}
                          {review.body && <p className="text-sm leading-6 text-foreground-secondary">{review.body}</p>}
                          <p className="mt-3 text-xs text-foreground-muted">{formatRelativeTime(review.createdAt)}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Star} title="Та одоогоор санал хүсэлт бичээгүй байна." action={{ href: '/business/search', label: 'Газар хайх' }} />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </UserDashboardShell>
  )
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <UserDashboardContent />
    </Suspense>
  )
}
