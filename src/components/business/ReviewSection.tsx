'use client'
// src/components/business/ReviewSection.tsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ThumbsUp, Flag, ChevronDown, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useCreateReview, useReviews } from '@/hooks'
import type { Review } from '@/types'

interface ReviewSectionProps {
  businessId: string
  businessName: string
  avgRating?: number | string
  totalReviews?: number
}

const reviewSchema = z.object({
  rating: z.number().min(1, 'Үнэлгээ өгнө үү').max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10, 'Хамгийн багадаа 10 тэмдэгт').max(5000),
  pros: z.string().max(500).optional(),
  cons: z.string().max(500).optional(),
  visitType: z.enum(['solo', 'couple', 'family', 'business', 'friends']).optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

const VISIT_TYPES = [
  { value: 'solo', label: 'Ганцаар' },
  { value: 'couple', label: 'Хоёулаа' },
  { value: 'family', label: 'Гэр бүлтэй' },
  { value: 'friends', label: 'Найзуудтай' },
  { value: 'business', label: 'Ажлаар' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Шинэ эхэнд' },
  { value: 'helpful', label: 'Хамгийн хэрэгтэй' },
  { value: 'highest', label: 'Өндөр үнэлгээтэй' },
  { value: 'lowest', label: 'Бага үнэлгээтэй' },
]

export default function ReviewSection({
  businessId,
  businessName,
  avgRating = 0,
  totalReviews = 0,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const { data: reviewData, isLoading } = useReviews(businessId, sortBy)
  const createReview = useCreateReview()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  })

  const ratingLabels = ['', 'Маш муу', 'Муу', 'Дундаж', 'Сайн', 'Маш сайн']

  async function onSubmit(data: ReviewFormData) {
    setSubmitError('')
    try {
      await createReview.mutateAsync({ ...data, businessId })
      reset({ rating: 0 })
      setSelectedRating(0)
      setShowForm(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Санал хадгалахад алдаа гарлаа.')
    }
  }

  const dist = reviewData?.ratingDistribution || {}
  const total = reviewData?.total ?? totalReviews
  const numericAvgRating = Number(avgRating || 0)
  const reviews = (reviewData?.reviews || []) as Review[]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Санал хүсэлт</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 btn-brand py-2 px-4 text-sm"
        >
          <Plus size={16} />
          Санал бичих
        </button>
      </div>

      {/* Rating Summary */}
      <div className="grid sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-background-secondary border border-border mb-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-5xl font-bold gradient-text">{numericAvgRating.toFixed(1)}</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} className={s <= Math.round(numericAvgRating) ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />
            ))}
          </div>
          <p className="text-sm text-foreground-muted">{total} санал хүсэлт</p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm w-3">{star}</span>
              <Star size={13} className="text-brand-accent fill-current flex-shrink-0" />
              <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent rounded-full transition-all duration-700"
                  style={{ width: `${total > 0 ? ((Number(dist[star]) || 0) / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-foreground-muted w-6 text-right">{Number(dist[star]) || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl border border-brand-primary/30 bg-brand-primary/4 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Санал бичих — {businessName}</h3>
                <button onClick={() => setShowForm(false)} className="size-7 rounded-lg hover:bg-background-secondary flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {submitError && (
                  <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
                    {submitError}
                  </div>
                )}

                {/* Star Rating */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Үнэлгээ *</label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => { setSelectedRating(star); setValue('rating', star) }}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={cn(
                              'transition-colors',
                              (hoverRating || selectedRating) >= star
                                ? 'text-brand-accent fill-current'
                                : 'text-foreground-subtle'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {(hoverRating || selectedRating) > 0 && (
                      <span className="text-sm font-medium text-brand-accent">
                        {ratingLabels[hoverRating || selectedRating]}
                      </span>
                    )}
                  </div>
                  {errors.rating && <p className="text-xs text-brand-danger mt-1">{errors.rating.message}</p>}
                </div>

                {/* Visit type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Очсон байдал</label>
                  <div className="flex flex-wrap gap-2">
                    {VISIT_TYPES.map(type => {
                      const current = watch('visitType')
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('visitType', type.value as any)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm border transition-all',
                            current === type.value
                              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                              : 'border-border hover:border-brand-primary text-foreground-secondary'
                          )}
                        >
                          {type.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Гарчиг</label>
                  <input
                    {...register('title')}
                    placeholder="Санал хүсэлтийн гарчиг"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Санал хүсэлт *</label>
                  <textarea
                    {...register('body')}
                    rows={4}
                    placeholder="Туршлагаа дэлгэрэнгүй бичнэ үү..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none"
                  />
                  {errors.body && <p className="text-xs text-brand-danger mt-1">{errors.body.message}</p>}
                </div>

                {/* Pros / Cons */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                      <span className="text-brand-success">+</span> Давуу тал
                    </label>
                    <textarea
                      {...register('pros')}
                      rows={2}
                      placeholder="Сайн талууд..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-success/30 focus:border-brand-success transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                      <span className="text-brand-danger">−</span> Сул тал
                    </label>
                    <textarea
                      {...register('cons')}
                      rows={2}
                      placeholder="Сайжруулах зүйл..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-danger/30 focus:border-brand-danger transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors">
                    Болих
                  </button>
                  <button type="submit" disabled={isSubmitting || createReview.isPending}
                    className="btn-brand disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSubmitting || createReview.isPending ? 'Хадгалж байна...' : 'Нийтлэх'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground-muted">{total} санал хүсэлт</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-muted">Эрэмбэлэх:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm border border-border rounded-lg px-2 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card">
                <div className="h-4 w-40 rounded bg-background-tertiary mb-4" />
                <div className="h-3 w-full rounded bg-background-tertiary mb-2" />
                <div className="h-3 w-2/3 rounded bg-background-tertiary" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            {/* User + Rating */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-semibold text-brand-primary">
                  {review.user.firstName?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{review.user.displayName}</p>
                    {review.isVerified && <span className="verified-badge text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-foreground-muted">{formatRelativeTime(review.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={13} className={s <= review.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />
                ))}
              </div>
            </div>

            {/* Visit type badge */}
            {review.visitType && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs border border-border text-foreground-muted mb-2">
                {VISIT_TYPES.find(t => t.value === review.visitType)?.label}
              </span>
            )}

            {review.title && <h4 className="font-semibold mb-1.5">{review.title}</h4>}
            <p className="text-sm text-foreground-secondary leading-relaxed mb-3">{review.body}</p>

            {/* Pros / Cons */}
            {(review.pros || review.cons) && (
              <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
                {review.pros && (
                  <div className="p-3 rounded-xl bg-brand-success/6 border border-brand-success/20">
                    <p className="font-medium text-brand-success mb-1">👍 Давуу тал</p>
                    <p className="text-foreground-secondary text-xs">{review.pros}</p>
                  </div>
                )}
                {review.cons && (
                  <div className="p-3 rounded-xl bg-brand-danger/6 border border-brand-danger/20">
                    <p className="font-medium text-brand-danger mb-1">👎 Сул тал</p>
                    <p className="text-foreground-secondary text-xs">{review.cons}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 text-xs text-foreground-muted">
              <button className="flex items-center gap-1.5 hover:text-brand-primary transition-colors">
                <ThumbsUp size={13} />
                Хэрэгтэй ({review.helpfulCount})
              </button>
              <button className="flex items-center gap-1.5 hover:text-brand-danger transition-colors">
                <Flag size={13} />
                Мэдэгдэх
              </button>
            </div>
          </motion.div>
        ))}
        {!isLoading && reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm font-medium text-foreground">Одоогоор санал хүсэлт алга</p>
            <p className="mt-1 text-sm text-foreground-muted">Эхний санал хүсэлтийг үлдээгээрэй.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {reviewData?.hasNextPage && (
      <div className="mt-6 text-center">
        <button className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors flex items-center gap-2 mx-auto">
          Илүү харах
          <ChevronDown size={15} />
        </button>
      </div>
      )}
    </div>
  )
}
