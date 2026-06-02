'use client'
// src/app/map/page.tsx
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, MapPin, Star, BadgeCheck, Zap, ChevronDown, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { cn } from '@/lib/utils'

// Lazy load map to avoid SSR issues
const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false,
  loading: () => (
    <div className="flex-1 bg-background-secondary flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <p className="text-sm text-foreground-muted">Газрын зураг ачааллаж байна...</p>
      </div>
    </div>
  )
})

const CATEGORIES = [
  { slug: '', label: 'Бүгд', icon: '🗺️' },
  { slug: 'restaurants', label: 'Ресторан', icon: '🍜' },
  { slug: 'hotels', label: 'Зочид буудал', icon: '🏨' },
  { slug: 'camps', label: 'Кемп', icon: '⛺' },
  { slug: 'shopping', label: 'Дэлгүүр', icon: '🛍️' },
  { slug: 'fitness', label: 'Фитнэс', icon: '💪' },
  { slug: 'salons', label: 'Салон', icon: '💇' },
  { slug: 'entertainment', label: 'Цэнгэл', icon: '🎮' },
  { slug: 'medical', label: 'Эрүүл мэнд', icon: '🏥' },
]

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$']

interface Filters {
  categorySlug: string
  minRating: number
  priceRange: string[]
  isVerified: boolean
  hasVirtualTour: boolean
}

export default function MapPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({
    categorySlug: '',
    minRating: 0,
    priceRange: [],
    isVerified: false,
    hasVirtualTour: false,
  })

  const activeFilterCount = [
    filters.categorySlug,
    filters.minRating > 0,
    filters.priceRange.length > 0,
    filters.isVerified,
    filters.hasVirtualTour,
  ].filter(Boolean).length

  function togglePriceRange(pr: string) {
    setFilters(f => ({
      ...f,
      priceRange: f.priceRange.includes(pr)
        ? f.priceRange.filter(p => p !== pr)
        : [...f.priceRange, pr],
    }))
  }

  function resetFilters() {
    setFilters({ categorySlug: '', minRating: 0, priceRange: [], isVerified: false, hasVirtualTour: false })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      {/* Map toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border z-10 overflow-x-auto scrollbar-hide">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Газар хайх..."
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setFilters(f => ({ ...f, categorySlug: f.categorySlug === cat.slug ? '' : cat.slug }))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all',
                filters.categorySlug === cat.slug
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-border bg-card hover:border-brand-primary hover:text-brand-primary'
              )}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filters button */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 ml-auto',
            activeFilterCount > 0
              ? 'bg-brand-primary text-white border-brand-primary'
              : 'border-border hover:border-brand-primary hover:text-brand-primary'
          )}
        >
          <SlidersHorizontal size={14} />
          Шүүлтүүр
          {activeFilterCount > 0 && (
            <span className="size-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Map + Filters */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Filters panel */}
        <AnimatePresence>
          {filtersOpen && (
            <>
              <div className="fixed inset-0 bg-black/30 z-20 sm:hidden" onClick={() => setFiltersOpen(false)} />
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-0 bottom-0 z-30 w-72 bg-card border-r border-border overflow-y-auto shadow-xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="font-bold">Шүүлтүүр</h3>
                    {activeFilterCount > 0 && (
                      <p className="text-xs text-foreground-muted">{activeFilterCount} идэвхтэй</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button onClick={resetFilters} className="text-xs text-brand-primary hover:underline">
                        Арилгах
                      </button>
                    )}
                    <button onClick={() => setFiltersOpen(false)}
                      className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Category */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Ангилал</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.slug}
                          onClick={() => setFilters(f => ({ ...f, categorySlug: f.categorySlug === cat.slug ? '' : cat.slug }))}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left',
                            filters.categorySlug === cat.slug
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                              : 'border-border hover:border-brand-primary'
                          )}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Үнэлгээ</h4>
                    <div className="flex gap-2">
                      {[0, 3, 3.5, 4, 4.5].map(r => (
                        <button
                          key={r}
                          onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? 0 : r }))}
                          className={cn(
                            'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-all',
                            filters.minRating === r
                              ? 'bg-brand-accent/10 border-brand-accent text-brand-accent'
                              : 'border-border hover:border-brand-accent'
                          )}
                        >
                          <Star size={13} className={filters.minRating === r ? 'fill-current' : ''} />
                          {r === 0 ? 'Бүгд' : `${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Үнийн дүр</h4>
                    <div className="flex gap-2">
                      {PRICE_RANGES.map(pr => (
                        <button
                          key={pr}
                          onClick={() => togglePriceRange(pr)}
                          className={cn(
                            'flex-1 py-2 rounded-xl border text-xs font-bold transition-all',
                            filters.priceRange.includes(pr)
                              ? 'bg-brand-success/10 border-brand-success text-brand-success'
                              : 'border-border hover:border-brand-success'
                          )}
                        >
                          {pr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    {[
                      { key: 'isVerified', label: 'Баталгаажсан бизнесүүд', icon: BadgeCheck, color: 'text-brand-success' },
                      { key: 'hasVirtualTour', label: '360° Виртуал аялалтай', icon: Zap, color: 'text-brand-primary' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <item.icon size={16} className={item.color} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <div
                          onClick={() => setFilters(f => ({ ...f, [item.key]: !f[item.key as keyof Filters] }))}
                          className={cn(
                            'relative w-10 h-5.5 rounded-full transition-colors cursor-pointer',
                            filters[item.key as keyof Filters]
                              ? 'bg-brand-primary'
                              : 'bg-border'
                          )}
                        >
                          <div className={cn(
                            'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                            filters[item.key as keyof Filters] ? 'translate-x-5' : 'translate-x-0.5'
                          )} />
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
                  >
                    Хэрэглэх
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Map */}
        <div className="flex-1">
          <MapView
            searchQuery={searchQuery}
            filters={{
              categorySlug: filters.categorySlug || undefined,
              minRating: filters.minRating || undefined,
              priceRange: filters.priceRange.length ? filters.priceRange : undefined,
              isVerified: filters.isVerified || undefined,
              hasVirtualTour: filters.hasVirtualTour || undefined,
            }}
            height="100%"
            showControls
          />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
