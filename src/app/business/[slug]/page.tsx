'use client'
// src/app/business/[slug]/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Phone, Globe, Mail, MapPin, Clock, Star, Heart, Share2,
  BadgeCheck, Zap, ArrowUpRight, Facebook, Instagram, Youtube,
  Twitter, Camera, Navigation, Building2,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewSection from '@/components/business/ReviewSection'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { BusinessCard } from '@/components/business/BusinessCard'
import { useBusiness, useBusinesses } from '@/hooks'
import { cn, formatInteger, isOpenNow } from '@/lib/utils'
import type { BusinessDetail, BusinessListItem, BusinessMedia } from '@/types'

const DAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

function getSlugParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || ''
}

function getDisplayName(business: BusinessDetail) {
  return business.nameMn || business.nameEn || 'Нэргүй бизнес'
}

function getGallery(business: BusinessDetail) {
  return (business.media || []).filter((item: BusinessMedia) =>
    ['COVER', 'PHOTO', 'THUMBNAIL'].includes(item.type)
  )
}

export default function BusinessDetailPage() {
  const params = useParams<{ slug?: string | string[] }>()
  const slug = getSlugParam(params.slug)
  const { data, isLoading, isError } = useBusiness(slug)
  const business = data as BusinessDetail | undefined
  const { data: relatedData, isLoading: isRelatedLoading } = useBusinesses({
    categorySlug: business?.category?.slug,
    limit: 5,
    sortBy: 'rating',
  })

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="section-container py-10">
          <div className="h-80 rounded-2xl bg-background-tertiary animate-pulse" />
          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-10 w-2/3 rounded-xl bg-background-tertiary animate-pulse" />
              <div className="h-28 rounded-2xl bg-background-tertiary animate-pulse" />
            </div>
            <div className="h-72 rounded-2xl bg-background-tertiary animate-pulse" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (isError || !business) {
    return (
      <>
        <Navbar />
        <main className="section-container py-24 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-background-secondary">
            <Building2 size={26} className="text-foreground-muted" />
          </div>
          <h1 className="text-2xl font-bold">Бизнес олдсонгүй</h1>
          <p className="mt-2 text-foreground-muted">Энэ slug-тэй идэвхтэй бизнес database-д алга байна.</p>
          <Link href="/business/search" className="btn-brand mt-6 inline-flex">Хайлт руу буцах</Link>
        </main>
        <Footer />
      </>
    )
  }

  const name = getDisplayName(business)
  const tagline = business.taglineMn || business.taglineEn
  const description = business.descriptionMn || business.descriptionEn
  const address = business.addressMn || business.addressEn || [business.district, business.city].filter(Boolean).join(', ')
  const gallery = getGallery(business)
  const mainImage = business.coverImageUrl || gallery[0]?.url
  const thumbnails = gallery.filter((item) => item.url !== mainImage).slice(0, 4)
  const extraPhotoCount = Math.max(gallery.length - 5, 0)
  const avgRating = Number(business.avgRating || 0)
  const totalReviews = business._count?.reviews ?? business.totalReviews ?? 0
  const openNow = isOpenNow(business.hours || [])
  const mapHref = business.latitude && business.longitude
    ? `https://maps.google.com/?q=${business.latitude},${business.longitude}`
    : '/map'
  const relatedBusinesses = ((relatedData?.businesses || []) as BusinessListItem[])
    .filter((item) => item.id !== business.id)
    .slice(0, 4)
  const socialLinks = [
    { icon: Facebook, href: business.facebook, color: 'hover:text-blue-600' },
    { icon: Instagram, href: business.instagram, color: 'hover:text-pink-500' },
    { icon: Youtube, href: business.youtube, color: 'hover:text-red-500' },
    { icon: Twitter, href: business.twitter, color: 'hover:text-sky-500' },
  ].filter((item) => item.href)

  return (
    <>
      <Navbar />

      <main className="min-h-screen pb-20 md:pb-0">
        <div className="section-container pt-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Link href="/" className="hover:text-foreground transition-colors">Нүүр</Link>
            <span>/</span>
            <Link href="/business/search" className="hover:text-foreground transition-colors">Хайлт</Link>
            <span>/</span>
            <span className="text-foreground">{name}</span>
          </div>
        </div>

        <section className="section-container mb-8">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96">
            <div className="col-span-4 md:col-span-2 row-span-2 relative bg-background-tertiary group">
              {mainImage ? (
                <Image src={mainImage} alt={name} fill priority className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                  <Building2 size={58} className="text-brand-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => {
              const media = thumbnails[i]
              return (
                <div key={i} className="hidden md:block relative bg-background-tertiary group">
                  {media ? (
                    <Image src={media.url} alt={media.altText || name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background-secondary to-background-tertiary">
                      <Camera size={20} className="text-foreground-muted" />
                    </div>
                  )}
                  {i === 3 && extraPhotoCount > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">+{formatInteger(extraPhotoCount)} зураг</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="section-container grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {business.category && (
                      <span className="category-pill text-xs">{business.category.nameMn}</span>
                    )}
                    {business.isVerified && (
                      <span className="verified-badge">
                        <BadgeCheck size={12} />
                        Баталгаажсан
                      </span>
                    )}
                    {business.isFeatured && (
                      <span className="featured-badge">
                        <Zap size={10} />
                        Онцлох
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-2">{name}</h1>
                  {tagline && <p className="text-foreground-secondary text-lg">{tagline}</p>}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="size-10 rounded-xl border border-border flex items-center justify-center text-foreground-secondary hover:text-brand-danger hover:border-brand-danger transition-colors">
                    <Heart size={18} />
                  </button>
                  <button className="size-10 rounded-xl border border-border flex items-center justify-center text-foreground-secondary hover:text-brand-primary hover:border-brand-primary transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={18}
                        className={star <= Math.round(avgRating) ? 'text-brand-accent fill-current' : 'text-foreground-subtle'}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                  <span className="text-foreground-muted">({formatInteger(totalReviews)} санал хүсэлт)</span>
                </div>
                {address && (
                  <div className="flex items-center gap-1 text-foreground-muted text-sm">
                    <MapPin size={14} />
                    <span>{address}</span>
                  </div>
                )}
                {business.hours?.length > 0 && (
                  <div className={cn('flex items-center gap-1 text-sm font-medium', openNow ? 'text-brand-success' : 'text-foreground-muted')}>
                    <div className={cn('size-2 rounded-full', openNow ? 'bg-brand-success' : 'bg-foreground-muted')} />
                    {openNow ? 'Нээлттэй' : 'Хаалттай'}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h2 className="text-xl font-bold mb-3">Бизнесийн тухай</h2>
              <div className="prose prose-sm max-w-none text-foreground-secondary">
                <p>{description || 'Энэ бизнесийн дэлгэрэнгүй тайлбар одоогоор database-д ороогүй байна.'}</p>
              </div>
            </motion.div>

            {(business.amenities.length > 0 || business.tags.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <h2 className="text-xl font-bold mb-3">Тохиромж & Онцлог</h2>
                <div className="flex flex-wrap gap-2">
                  {[...business.amenities, ...business.tags].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-sm border border-border bg-background-secondary text-foreground-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">360° Виртуал Аялал</h2>
                {business.virtualTourUrl && (
                  <span className="text-xs text-brand-primary font-medium px-2 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/5">
                    Шинэ
                  </span>
                )}
              </div>
              <div className="rounded-2xl overflow-hidden border border-border aspect-video bg-gradient-to-br from-background-secondary to-background-tertiary flex flex-col items-center justify-center gap-4">
                <div className="size-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Camera size={28} className="text-brand-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1">360° Виртуал Аялал</p>
                  <p className="text-sm text-foreground-muted mb-4">
                    {business.virtualTourUrl ? 'Бизнесийн орчныг виртуалаар үзэх боломжтой' : 'Одоогоор виртуал аялал нэмэгдээгүй байна'}
                  </p>
                  {business.virtualTourUrl && (
                    <a href={business.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="btn-brand">
                      Аялалыг эхлүүлэх
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">Зургийн Галерей</h2>
                <span className="text-sm text-foreground-muted">{formatInteger(gallery.length)} зураг</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.slice(0, 8).map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-xl overflow-hidden bg-background-tertiary">
                    <Image src={media.url} alt={media.altText || name} fill className="object-cover" />
                  </div>
                ))}
                {gallery.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
                    Зураг ороогүй байна
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <ReviewSection
                businessId={business.id}
                businessName={name}
                avgRating={avgRating}
                totalReviews={totalReviews}
              />
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card rounded-2xl p-5 sticky top-20"
            >
              <h3 className="font-bold text-lg mb-4">Холбоо барих</h3>
              <div className="space-y-3 mb-5">
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group">
                    <div className="size-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Phone size={17} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">Утас</p>
                      <p className="font-medium text-sm group-hover:text-brand-primary transition-colors">{business.phone}</p>
                    </div>
                  </a>
                )}

                {business.email && (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group">
                    <div className="size-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Mail size={17} className="text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground-muted">Имэйл</p>
                      <p className="font-medium text-sm group-hover:text-brand-primary transition-colors truncate">{business.email}</p>
                    </div>
                  </a>
                )}

                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group">
                    <div className="size-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Globe size={17} className="text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground-muted">Вэбсайт</p>
                      <p className="font-medium text-sm group-hover:text-brand-primary transition-colors truncate">{business.website.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-foreground-muted group-hover:text-brand-primary" />
                  </a>
                )}

                {address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="size-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <MapPin size={17} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">Хаяг</p>
                      <p className="font-medium text-sm">{address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
                    <Phone size={16} />
                    Утасдах
                  </a>
                )}
                <a
                  href={mapHref}
                  target={mapHref.startsWith('http') ? '_blank' : undefined}
                  rel={mapHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  <Navigation size={16} />
                  Чиглэл авах
                </a>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border">
                  {socialLinks.map(({ icon: Icon, href, color }) => (
                    <a key={href} href={href || '#'} target="_blank" rel="noopener noreferrer"
                      className={`size-9 rounded-xl border border-border flex items-center justify-center text-foreground-muted ${color} hover:border-current transition-colors`}>
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-brand-primary" />
                <h3 className="font-bold">Цагийн хуваарь</h3>
              </div>
              <div className="space-y-2">
                {business.hours.length > 0 ? business.hours.map((hour) => (
                  <div key={hour.id} className={`flex justify-between text-sm py-1.5 ${hour.dayOfWeek === new Date().getDay() ? 'font-semibold text-brand-primary' : 'text-foreground-secondary'}`}>
                    <span>{DAYS[hour.dayOfWeek] || `Өдөр ${hour.dayOfWeek}`}</span>
                    <span>{hour.isClosed ? 'Амардаг' : hour.is24Hours ? '24 цаг' : `${hour.openTime || '--:--'} – ${hour.closeTime || '--:--'}`}</span>
                  </div>
                )) : (
                  <p className="text-sm text-foreground-muted">Цагийн хуваарь ороогүй байна</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl overflow-hidden border border-border"
            >
              <div className="h-48 bg-gradient-to-br from-background-secondary to-background-tertiary flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={28} className="text-brand-primary mx-auto mb-2" />
                  <p className="text-sm text-foreground-muted">Газрын зурагт харах</p>
                </div>
              </div>
              <div className="p-3">
                <Link
                  href={`/map?business=${business.id}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-brand-primary hover:underline"
                >
                  <MapPin size={14} />
                  Газрын зурагт харах
                </Link>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <p className="text-sm text-foreground-muted mb-2">Энэ бизнесийн эзэн мөн үү?</p>
              <Link href={`/claims/claim?business=${business.id}`} className="text-sm font-medium text-brand-primary hover:underline">
                Эзэмшлийг нэхэмжлэх
              </Link>
            </div>
          </div>
        </div>

        <section className="section-container mt-16 pb-8">
          <h2 className="text-2xl font-bold mb-6">Ойролцоох газрууд</h2>
          {isRelatedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-background-tertiary" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-background-tertiary rounded w-3/4" />
                    <div className="h-3 bg-background-tertiary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : relatedBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBusinesses.map((item, i) => (
                <BusinessCard key={item.id} business={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
              Ижил ангиллын бусад бизнес одоогоор алга.
            </div>
          )}
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  )
}
