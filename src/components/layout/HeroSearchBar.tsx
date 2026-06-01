'use client'
// src/components/layout/HeroSearchBar.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search, MapPin, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const CATEGORIES = [
  { label: 'Бүгд', slug: '' },
  { label: 'Ресторан', slug: 'restaurants' },
  { label: 'Зочид буудал', slug: 'hotels' },
  { label: 'Кемп', slug: 'camps' },
  { label: 'Дэлгүүр', slug: 'shopping' },
  { label: 'Фитнэс', slug: 'fitness' },
  { label: 'Салон', slug: 'salons' },
]
const CITIES = [
  { label: 'Улаанбаатар', value: 'Ulaanbaatar' },
  { label: 'Эрдэнэт', value: 'Erdenet' },
  { label: 'Дархан', value: 'Darkhan' },
  { label: 'Чойбалсан', value: 'Choibalsan' },
  { label: 'Өлгий', value: 'Olgii' },
]

export default function HeroSearchBar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('Ulaanbaatar')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('categorySlug', category)
    if (city) params.set('city', city)
    router.push(`/business/search?${params.toString()}`)
  }

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl"
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/92 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-border/80 dark:bg-card/92 sm:grid-cols-[minmax(150px,0.8fr)_minmax(170px,0.9fr)_minmax(220px,1.6fr)_auto]">
        {/* Category select */}
        <div className="relative rounded-xl border border-border/70 bg-background/80 transition-colors hover:border-brand-primary/45 hover:bg-card">
          <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" />
          <label className="absolute left-11 top-1.5 text-[10px] font-semibold uppercase text-foreground-muted sm:top-2">Ангилал</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            aria-label="Ангилал"
            className="h-12 w-full appearance-none border-0 bg-transparent pb-1.5 pl-11 pr-8 pt-5 text-sm font-semibold text-foreground shadow-none outline-none transition-colors focus:ring-0 sm:h-14 sm:pb-2 sm:pr-9 sm:pt-6"
          >
            {CATEGORIES.map(c => <option key={c.slug || 'all'} value={c.slug} className="bg-card text-foreground">{c.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
        </div>

        {/* City select */}
        <div className="relative rounded-xl border border-border/70 bg-background/80 transition-colors hover:border-brand-primary/45 hover:bg-card">
          <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" />
          <label className="absolute left-10 top-1.5 text-[10px] font-semibold uppercase text-foreground-muted sm:top-2">Хот</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            aria-label="Хот"
            className="h-12 w-full appearance-none border-0 bg-transparent pb-1.5 pl-10 pr-8 pt-5 text-sm font-semibold text-foreground shadow-none outline-none transition-colors focus:ring-0 sm:h-14 sm:pb-2 sm:pr-9 sm:pt-6"
          >
            {CITIES.map(c => <option key={c.value} value={c.value} className="bg-card text-foreground">{c.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
        </div>

        {/* Query input */}
        <div className="relative col-span-2 rounded-xl border border-border/70 bg-background/80 transition-colors hover:border-brand-primary/45 hover:bg-card sm:col-span-1">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary" />
          <label className="absolute left-11 top-1.5 text-[10px] font-semibold uppercase text-foreground-muted sm:top-2">Хайлт</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ресторан, зочид буудал хайх..."
            aria-label="Хайх"
            className="h-12 w-full border-0 bg-transparent pb-1.5 pl-11 pr-4 pt-5 text-sm font-medium text-foreground shadow-none outline-none placeholder:text-foreground-muted focus:ring-0 sm:h-14 sm:pb-2 sm:pt-6"
          />
        </div>

        {/* Submit */}
        <button type="submit"
          aria-label="Хайх"
          className="col-span-2 h-12 w-full rounded-xl bg-brand-primary px-6 text-sm font-bold text-white shadow-glow-brand transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:col-span-1 sm:h-14 sm:w-auto">
          <span className="flex items-center justify-center gap-2">
            <Search size={17} />
            Хайх
          </span>
        </button>
      </div>
    </motion.form>
  )
}
