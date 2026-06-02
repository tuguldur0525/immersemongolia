'use client'
// src/app/dashboard/admin/content/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, Flag, CheckCircle, XCircle, Eye, AlertTriangle, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

type ReviewStatus = 'PENDING_MODERATION' | 'FLAGGED'

type AdminReview = {
  id: string
  businessName: string
  businessSlug: string
  user: string
  rating: number
  title: string | null
  body: string | null
  status: ReviewStatus
  reason: string
  reportCount: number
  createdAt: string
  hasImages: boolean
}

type AdminReviewsData = {
  reviews: AdminReview[]
  total: number
  statusCounts: Record<string, number>
}

const STATUS_CONFIG = {
  PENDING_MODERATION: { label: 'Хянагдаж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: AlertTriangle },
  FLAGGED: { label: 'Тэмдэглэгдсэн', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: Flag },
}

export default function AdminContentPage() {
  const [filter, setFilter] = useState<'ALL' | ReviewStatus>('ALL')
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdminReviewsData>({
    queryKey: ['admin-reviews', filter],
    queryFn: async () => {
      const params = new URLSearchParams({ status: filter, limit: '100' })
      const res = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Санал хүсэлтүүдийг ачаалж чадсангүй')
      }

      return payload.data
    },
    staleTime: 20_000,
  })

  const reviews = data?.reviews ?? []
  const statusCounts = data?.statusCounts ?? {}
  const filtered = reviews

  async function handleAction(id: string, action: 'approve' | 'delete') {
    if (action === 'delete' && !window.confirm('Энэ санал хүсэлтийг устгах уу?')) return

    setActionError('')
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: action === 'approve' ? 'PATCH' : 'DELETE',
      headers: action === 'approve' ? { 'Content-Type': 'application/json' } : undefined,
      body: action === 'approve' ? JSON.stringify({ action: 'approve' }) : undefined,
    })
    const payload = await res.json().catch(() => null)

    if (!res.ok || !payload?.success) {
      setActionError(payload?.error || 'Үйлдэл амжилтгүй боллоо')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Агуулгын хяналт</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Агуулгын хяналт</h1>
          <div className="flex items-center gap-2">
            {(statusCounts.FLAGGED ?? 0) > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-brand-danger text-white text-xs font-bold">
                {statusCounts.FLAGGED ?? 0} тэмдэглэгдсэн
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1 w-fit">
          {[
            { value: 'ALL', label: `Бүгд (${Object.values(statusCounts).reduce((sum, count) => sum + count, 0)})` },
            { value: 'PENDING_MODERATION', label: `Хянагдаж байна (${statusCounts.PENDING_MODERATION ?? 0})` },
            { value: 'FLAGGED', label: `Тэмдэглэгдсэн (${statusCounts.FLAGGED ?? 0})` },
          ].map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value as typeof filter)}
              className={cn('px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                filter === tab.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
            {actionError}
          </div>
        )}

        {/* Reviews */}
        <div className="space-y-4">
          {isLoading || error ? (
            <div className="bg-card rounded-2xl border border-border py-20 text-center">
              <MessageSquare size={36} className="text-foreground-subtle mx-auto mb-3" />
              <p className="font-medium">{isLoading ? 'Ачаалж байна...' : 'Санал хүсэлтүүдийг ачаалж чадсангүй'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border py-20 text-center">
              <CheckCircle size={36} className="text-brand-success mx-auto mb-3" />
              <p className="font-medium text-brand-success">Бүх санал хүсэлт шалгагдсан байна!</p>
            </div>
          ) : (
            filtered.map((review, i) => {
              const statusCfg = STATUS_CONFIG[review.status]
              const StatusIcon = statusCfg.icon

              return (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={cn('bg-card rounded-2xl border overflow-hidden',
                    review.status === 'FLAGGED' ? 'border-brand-danger/40' : 'border-brand-warning/40')}>
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.bg, statusCfg.color)}>
                            <StatusIcon size={11} />
                            {statusCfg.label}
                          </span>
                          {review.reportCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-danger/10 text-brand-danger text-xs font-medium">
                              {review.reportCount}x мэдэгдсэн
                            </span>
                          )}
                          {review.reason && (
                            <span className="text-xs text-foreground-muted">Шалтгаан: {review.reason}</span>
                          )}
                        </div>
                        <Link href={`/business/${review.businessSlug}`} target="_blank"
                          className="text-sm font-semibold hover:text-brand-primary transition-colors flex items-center gap-1">
                          {review.businessName}
                          <Eye size={12} className="text-foreground-muted" />
                        </Link>
                      </div>
                      <p className="text-xs text-foreground-muted flex-shrink-0">{formatRelativeTime(review.createdAt)}</p>
                    </div>

                    {/* Review content */}
                    <div className="p-4 rounded-xl bg-background-secondary mb-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-brand-primary/15 flex items-center justify-center text-xs font-bold text-brand-primary">
                            {review.user.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{review.user}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} className={s <= review.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />
                          ))}
                          <span className="text-xs font-medium ml-1">{review.rating}/5</span>
                        </div>
                      </div>
                      {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                      <p className="text-sm text-foreground-secondary leading-relaxed">{review.body}</p>
                      {review.hasImages && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-foreground-muted">
                          <ImageIcon size={12} />
                          <span>Зурагтай</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleAction(review.id, 'approve')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-success text-white text-sm font-semibold hover:brightness-110 transition-all">
                        <CheckCircle size={15} />
                        Зөвшөөрөх
                      </button>
                      <button onClick={() => handleAction(review.id, 'delete')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-danger text-white text-sm font-semibold hover:brightness-110 transition-all">
                        <XCircle size={15} />
                        Устгах
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors ml-auto">
                        <Eye size={15} />
                        Дэлгэрэнгүй
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
