'use client'
// src/components/layout/StatsSection.tsx
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, Users, Star, MapPin } from 'lucide-react'
import { usePlatformStats } from '@/hooks'
import { formatInteger } from '@/lib/utils'

export default function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { data: stats } = usePlatformStats()

  const items = [
    { icon: Building2, value: formatInteger(stats?.totalBusinesses ?? 0), label: 'Бизнесүүд', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { icon: Users, value: formatInteger(stats?.totalUsers ?? 0), label: 'Хэрэглэгчид', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
    { icon: Star, value: formatInteger(stats?.totalReviews ?? 0), label: 'Санал хүсэлт', color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
    { icon: MapPin, value: formatInteger(stats?.coveredCities ?? 0), label: 'Хот/аймаг', color: 'text-brand-success', bg: 'bg-brand-success/10' },
  ]

  return (
    <section ref={ref} className="py-20">
      <div className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className={`size-12 rounded-2xl ${stat.bg} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon size={22} className={stat.color} />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-foreground-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
