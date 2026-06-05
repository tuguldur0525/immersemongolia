'use client'
// src/components/business/BusinessCard.tsx

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, Heart, Zap, Building2 } from 'lucide-react'
import { useState } from 'react'
import { getCategoryImage } from '@/lib/category-assets'
import { cn } from '@/lib/utils'
import type { BusinessListItem } from '@/types'
import { useBusinesses, useToggleSaved } from '@/hooks'

interface BusinessCardProps {
  business: BusinessListItem
  index?: number
  variant?: 'default' | 'compact' | 'horizontal'
  showSaveButton?: boolean
  onSave?: (id: string) => void
  isSaved?: boolean
}

export function BusinessCard({
  business,
  index = 0,
  variant = 'default',
  showSaveButton = true,
  onSave,
  isSaved = false,
}: BusinessCardProps) {
  const router = useRouter()
  const toggleSaved = useToggleSaved()
  const [saved, setSaved] = useState(isSaved)
  const [imageError, setImageError] = useState(false)

  const name = business.nameMn || business.nameEn || ''
  const tagline = business.taglineMn || business.taglineEn || ''
  const address = business.addressMn || business.district || business.city
  const categoryImage = getCategoryImage(business.category?.slug)

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (toggleSaved.isPending) return

    const wasSaved = saved
    setSaved(!wasSaved)

    try {
      await toggleSaved.mutateAsync({ businessId: business.id, isSaved: wasSaved })
      onSave?.(business.id)
    } catch (error) {
      setSaved(wasSaved)
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push(`/auth/login?redirect=${encodeURIComponent(`/business/${business.slug}`)}`)
      }
    }
  }

  const priceColors: Record<string, string> = {
    '$': 'text-brand-success',
    '$$': 'text-brand-warning',
    '$$$': 'text-orange-500',
    '$$$$': 'text-brand-danger',
  }

  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ x: 4 }}
      >
        <Link href={`/business/${business.slug}`} className="business-card flex gap-4 p-3 sm:p-4 group bg-card hover:bg-gradient-to-r hover:from-card hover:to-background-secondary/20 transition-all duration-300">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-24 sm:w-32 aspect-square rounded-xl overflow-hidden shadow-inner border border-border/40">
            {business.coverImageUrl && !imageError ? (
              <Image
                src={business.coverImageUrl}
                alt={name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="relative h-full w-full bg-background-secondary">
                {categoryImage ? (
                  <Image
                    src={categoryImage}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                    <Building2 size={34} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base text-foreground leading-tight line-clamp-1 group-hover:text-brand-primary transition-colors flex-1">{name}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {business.isVerified && (
                  <span className="verified-badge">✓</span>
                )}
              </div>
            </div>

            {tagline && (
              <p className="text-sm text-foreground-secondary line-clamp-1">{tagline}</p>
            )}

            <div className="flex items-center gap-3 text-xs border-t border-border/40 pt-2 mt-1">
              <div className="star-rating flex items-center gap-1 bg-brand-accent/5 px-2 py-0.5 rounded-lg">
                <Star size={11} fill="currentColor" className="text-brand-accent" />
                <span className="font-bold text-brand-accent-dark">{Number(business.avgRating).toFixed(1)}</span>
                <span className="text-foreground-muted">({business.totalReviews})</span>
              </div>
              {business.priceRange && (
                <span className={cn('font-bold', priceColors[business.priceRange])}>
                  {business.priceRange}
                </span>
              )}
            </div>

            {address && (
              <div className="flex items-center gap-1 text-xs text-foreground-muted">
                <MapPin size={11} className="text-brand-primary/80" />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/business/${business.slug}`} className="business-card block group bg-card shadow-sm border border-border/80 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {business.coverImageUrl && !imageError ? (
            <Image
              src={business.coverImageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="relative h-full w-full bg-background-secondary">
              {categoryImage ? (
                <Image
                  src={categoryImage}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-foreground-muted">
                  <Building2 size={42} />
                </div>
              )}
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {business.isFeatured && (
              <span className="featured-badge shadow-md bg-brand-accent/90 text-white border-transparent px-2.5 py-1 flex items-center gap-2 text-xs">
                <Zap size={12} />
                <span>Онцлох</span>
              </span>
            )}
            {business.isVerified && (
              <span className="verified-badge shadow-md bg-brand-success/90 text-white border-transparent px-2.5 py-1 flex items-center gap-2 text-xs">
                <span aria-hidden>✓</span>
                <span>Баталгаажсан</span>
              </span>
            )}
          </div>

          {/* Save button */}
          {showSaveButton && (
            <button
              type="button"
              onClick={handleSave}
              disabled={toggleSaved.isPending}
              aria-pressed={saved}
              aria-label={`${saved ? 'Хадгалсан' : 'Хадгалах'} ${name}`}
              className={cn(
                'absolute top-3 right-3 size-8 rounded-full flex items-center justify-center transition-all duration-200 z-10',
                'bg-white/95 backdrop-blur-sm shadow-md hover:scale-110 active:scale-95',
                saved ? 'text-brand-danger' : 'text-foreground-muted hover:text-brand-danger'
              )}
            >
              <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}

          {/* Category badge */}
          {business.category && (
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white backdrop-blur-sm border border-white/10"
                style={{ background: business.category.color ? `${business.category.color}cc` : 'rgba(0,0,0,0.6)' }}
              >
                {business.category.nameMn}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-foreground leading-snug line-clamp-1 group-hover:text-brand-primary transition-colors flex-1">
              {name}
            </h3>
            {business.priceRange && (
              <span className={cn('text-sm font-bold flex-shrink-0', priceColors[business.priceRange])}>
                {business.priceRange}
              </span>
            )}
          </div>

          {tagline && (
            <p className="text-sm text-foreground-secondary line-clamp-1">{tagline}</p>
          )}

          <div className="flex items-center justify-between text-sm border-t border-border/40 pt-3 mt-1">
            <div className="star-rating flex items-center gap-1.5 bg-brand-accent/5 px-2.5 py-0.5 rounded-lg">
              <Star size={12} fill="currentColor" className="text-brand-accent" />
              <span className="font-bold text-brand-accent-dark">{Number(business.avgRating).toFixed(1)}</span>
              <span className="text-[11px] text-foreground-muted font-medium">({business.totalReviews} үнэлгээ)</span>
            </div>
          </div>

          {address && (
            <div className="flex items-center gap-1 mt-1 text-xs text-foreground-muted">
              <MapPin size={11} className="text-brand-primary/80" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// src/components/business/FeaturedBusinesses.tsx
export function FeaturedBusinesses({ filter }: { filter?: string }) {
  const { data, isLoading } = useBusinesses({
    isFeatured: filter !== 'trending' ? true : undefined,
    sortBy: filter === 'trending' ? 'reviews' : 'rating',
    limit: 4,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border">
            <div className="aspect-[4/3] bg-background-tertiary" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-background-tertiary rounded-lg w-3/4" />
              <div className="h-4 bg-background-tertiary rounded-lg w-1/2" />
              <div className="h-4 bg-background-tertiary rounded-lg w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const businesses = (data?.businesses || []) as BusinessListItem[]

  if (businesses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Одоогоор бизнес бүртгэгдээгүй байна</p>
        <p className="mt-1 text-sm text-foreground-muted">Database-д идэвхтэй бизнес нэмэгдмэгц энд шууд харагдана.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {businesses.map((business, i) => (
        <BusinessCard key={business.id} business={business} index={i} />
      ))}
    </div>
  )
}
