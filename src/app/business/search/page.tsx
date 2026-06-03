'use client'
// src/app/business/search/page.tsx
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, LayoutGrid, List, X, ChevronDown, BadgeCheck } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { BusinessCard } from '@/components/business/BusinessCard'
import { useBusinesses } from '@/hooks'
import { cn } from '@/lib/utils'
import type { BusinessListItem, PriceRange, SearchFilters } from '@/types'

const CATEGORIES = [
  { slug: '', label: 'Бүгд ангилал' },
  { slug: 'restaurants', label: 'Ресторан' },
  { slug: 'hotels', label: 'Зочид буудал' },
  { slug: 'camps', label: 'Кемп & Амралт' },
  { slug: 'shopping', label: 'Дэлгүүр' },
  { slug: 'fitness', label: 'Фитнэс' },
  { slug: 'salons', label: 'Салон' },
  { slug: 'entertainment', label: 'Цэнгэл' },
  { slug: 'medical', label: 'Эрүүл мэнд' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Хамаарал' },
  { value: 'rating', label: 'Үнэлгээ' },
  { value: 'reviews', label: 'Санал хүсэлтийн тоо' },
  { value: 'newest', label: 'Шинэ эхэнд' },
]

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('categorySlug') || searchParams.get('category') || '')
  const [city] = useState(searchParams.get('city') || '')
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [priceRange, setPriceRange] = useState<string[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [page, setPage] = useState(1)

  const LIMIT = 12
  const businessQuery = useBusinesses({
    query: query || undefined,
    categorySlug: category || undefined,
    city: city || undefined,
    sortBy,
    minRating: minRating || undefined,
    priceRange: priceRange.length ? priceRange as PriceRange[] : undefined,
    isVerified: isVerified || undefined,
    page: 1,
    limit: page * LIMIT,
  })
  const searchData = businessQuery.data
  const displayedBusinesses: BusinessListItem[] = searchData?.businesses ?? []
  const total = searchData?.total ?? 0
  const hasMore = searchData?.hasNextPage ?? false
  const isLoading = businessQuery.isLoading

  const activeFilters = [category, minRating > 0, priceRange.length > 0, isVerified].filter(Boolean).length

  useEffect(() => {
    setPage(1)
  }, [query, category, city, sortBy, minRating, priceRange, isVerified])

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('categorySlug', category)
    router.push(params.size ? `/business/search?${params.toString()}` : '/business/search')
  }

  function removeFilter(type: string) {
    if (type === 'category') setCategory('')
    if (type === 'rating') setMinRating(0)
    if (type === 'verified') setIsVerified(false)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0">
        {/* Search header */}
        <div className="bg-background-secondary border-b border-border sticky top-16 z-20">
          <div className="section-container py-4">
            <form onSubmit={applySearch} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ресторан, зочид буудал хайх..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground">
                    <X size={13} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-brand px-5 py-3">Хайх</button>
            </form>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
                  className={cn(
                    'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                    category === cat.slug
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'border-border bg-card hover:border-brand-primary hover:text-brand-primary'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="section-container py-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-foreground-secondary">
                <span className="font-semibold text-foreground">{total}</span> үр дүн
                {query && <span> — &ldquo;<span className="text-brand-primary">{query}</span>&rdquo;</span>}
              </p>

              {/* Active filter tags */}
              <div className="hidden sm:flex items-center gap-2">
                {category && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium border border-brand-primary/30">
                    {CATEGORIES.find(c => c.slug === category)?.label}
                    <button onClick={() => removeFilter('category')}><X size={11} /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-medium border border-brand-accent/30">
                    {minRating}+ ★ <button onClick={() => removeFilter('rating')}><X size={11} /></button>
                  </span>
                )}
                {isVerified && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-success/10 text-brand-success text-xs font-medium border border-brand-success/30">
                    Баталгаажсан <button onClick={() => removeFilter('verified')}><X size={11} /></button>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SearchFilters['sortBy'])}
                  className="pl-3 pr-8 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              </div>

              {/* Filters btn */}
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
                  activeFilters > 0 ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary hover:text-brand-primary'
                )}
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Шүүлтүүр</span>
                {activeFilters > 0 && <span className="size-5 rounded-full bg-white/25 flex items-center justify-center text-xs">{activeFilters}</span>}
              </button>

              {/* View mode */}
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button onClick={() => setViewMode('grid')}
                  className={cn('size-9 flex items-center justify-center transition-colors', viewMode === 'grid' ? 'bg-brand-primary text-white' : 'hover:bg-background-secondary text-foreground-muted')}>
                  <LayoutGrid size={16} />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={cn('size-9 flex items-center justify-center transition-colors', viewMode === 'list' ? 'bg-brand-primary text-white' : 'hover:bg-background-secondary text-foreground-muted')}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters drawer (mobile) */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-6"
              >
                <div className="p-5 rounded-2xl border border-border bg-card grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Rating filter */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Үнэлгээ</p>
                    <div className="flex gap-1">
                      {[0, 3, 3.5, 4, 4.5].map(r => (
                        <button key={r} onClick={() => setMinRating(r === minRating ? 0 : r)}
                          className={cn('flex-1 py-1.5 rounded-lg border text-xs transition-all',
                            minRating === r ? 'bg-brand-accent text-white border-brand-accent' : 'border-border hover:border-brand-accent')}>
                          {r === 0 ? 'Бүгд' : `${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Үнэ</p>
                    <div className="flex gap-1">
                      {['$', '$$', '$$$', '$$$$'].map(pr => (
                        <button key={pr} onClick={() => setPriceRange(prev =>
                          prev.includes(pr) ? prev.filter(p => p !== pr) : [...prev, pr]
                        )}
                          className={cn('flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all',
                            priceRange.includes(pr) ? 'bg-brand-success text-white border-brand-success' : 'border-border hover:border-brand-success')}>
                          {pr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setIsVerified(v => !v)}
                        className={cn('relative w-10 h-5 rounded-full transition-colors cursor-pointer',
                          isVerified ? 'bg-brand-primary' : 'bg-border')}>
                        <div className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                          isVerified ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                      <span className="text-sm flex items-center gap-1">
                        <BadgeCheck size={15} className="text-brand-success" />
                        Баталгаажсан
                      </span>
                    </label>
                  </div>

                  <div className="flex items-end">
                    <button onClick={() => { setMinRating(0); setPriceRange([]); setIsVerified(false); setFiltersOpen(false) }}
                      className="w-full py-2 rounded-xl border border-border text-sm hover:bg-background-secondary transition-colors">
                      Шүүлтүүр арилгах
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results grid */}
          {isLoading ? (
            <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1')}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-background-tertiary" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-background-tertiary rounded w-3/4" />
                    <div className="h-3 bg-background-tertiary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedBusinesses.length > 0 ? (
            <>
              <div className={cn('grid gap-6', viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 max-w-3xl')}>
                {displayedBusinesses.map((biz, i) => (
                  <BusinessCard key={biz.id} business={biz} index={i} variant={viewMode === 'list' ? 'horizontal' : 'default'} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 py-3 rounded-xl border border-border font-medium text-sm hover:bg-background-secondary transition-colors"
                  >
                    Илүү харах ({total - displayedBusinesses.length} үлдсэн)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center">
              <div className="size-20 rounded-2xl bg-background-secondary flex items-center justify-center mx-auto mb-4 text-brand-primary">
                <Search size={34} />
              </div>
              <h3 className="text-lg font-bold mb-2">Үр дүн олдсонгүй</h3>
              <p className="text-foreground-muted mb-6">Өөр түлхүүр үг ашиглан хайна уу</p>
              <button onClick={() => { setQuery(''); setCategory(''); setMinRating(0); setPriceRange([]); }}
                className="btn-brand">Шүүлтүүр арилгах</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchPageContent />
    </Suspense>
  )
}
