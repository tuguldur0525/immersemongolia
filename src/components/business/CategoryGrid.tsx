'use client'
// src/components/business/CategoryGrid.tsx
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCategories } from '@/hooks'
import { formatInteger } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/category-icons'

type CategoryWithCount = {
  id: string
  slug: string
  nameMn: string
  color: string | null
  businessCount?: number
  _count?: { businesses?: number }
}

export default function CategoryGrid() {
  const { data: categories = [], isLoading } = useCategories()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3.5 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-background-tertiary" />
        ))}
      </div>
    )
  }

  const visibleCategories = (categories as CategoryWithCount[]).slice(0, 9)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3.5">
      {visibleCategories.map((cat, i) => {
        const color = cat.color || '#3b82f6'
        const count = cat._count?.businesses ?? cat.businessCount ?? 0
        const Icon = getCategoryIcon(cat.slug)

        return (
        <motion.div
          key={cat.slug}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="flex"
        >
          <Link href={`/business/search?categorySlug=${cat.slug}`}
            className="flex-1 flex flex-col items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card hover:border-[var(--cat-color)] hover:shadow-lg transition-all duration-300 group cursor-pointer hover:bg-gradient-to-b hover:from-card hover:to-[var(--cat-color-light)]"
            style={{ 
              '--cat-color': color,
              '--cat-color-light': `${color}06`
            } as React.CSSProperties}>
            <div
              className="flex size-16 items-center justify-center rounded-2xl border shadow-sm transition-transform duration-300 group-hover:rotate-2 group-hover:scale-105"
              style={{ background: `${color}12`, borderColor: `${color}28`, color }}>
              <Icon size={28} strokeWidth={2.1} />
            </div>
            <div className="text-center flex-1 flex flex-col justify-center">
              <p className="text-xs font-semibold leading-snug group-hover:text-[var(--cat-color)] transition-colors line-clamp-2">{cat.nameMn}</p>
              <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-foreground-muted bg-background-secondary/80 mt-1.5 group-hover:bg-[var(--cat-color)] group-hover:text-white transition-all duration-300">
                {formatInteger(count)} газар
              </span>
            </div>
          </Link>
        </motion.div>
        )
      })}
    </div>
  )
}
