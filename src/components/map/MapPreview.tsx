'use client'
// src/components/map/MapPreview.tsx
import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import { usePlatformStats } from '@/hooks'
import { formatInteger } from '@/lib/utils'

export default function MapPreview() {
  const { data: stats } = usePlatformStats()
  const mapBusinessCount = stats?.businessesWithLocation ?? stats?.totalBusinesses ?? 0

  return (
    <div className="relative w-full h-full min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center gap-4">
      {/* Fake map pins for visual */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { top: '30%', left: '40%', color: '#ef4444', label: 'Ресторан' },
          { top: '50%', left: '60%', color: '#3b82f6', label: 'Зочид буудал' },
          { top: '65%', left: '35%', color: '#22c55e', label: 'Кемп' },
          { top: '40%', left: '70%', color: '#f59e0b', label: 'Дэлгүүр' },
          { top: '55%', left: '50%', color: '#8b5cf6', label: 'Фитнэс' },
        ].map((pin, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center animate-bounce-gentle"
            style={{ top: pin.top, left: pin.left, animationDelay: `${i * 0.3}s` }}
          >
            <div
              className="size-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
              style={{ background: pin.color }}
            >
              <MapPin size={14} className="text-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium shadow-sm whitespace-nowrap">
              {pin.label}
            </div>
          </div>
        ))}
        {/* Grid lines suggesting a map */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Roads */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="3"/>
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="3"/>
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="currentColor" strokeWidth="2"/>
          <line x1="20%" y1="0" x2="80%" y2="100%" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      <div className="relative z-10 text-center">
        <div className="size-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center mx-auto mb-3">
          <MapPin size={26} className="text-brand-primary" />
        </div>
        <p className="font-semibold mb-1">Интерактив газрын зураг</p>
        <p className="text-sm text-foreground-muted mb-4">{formatInteger(mapBusinessCount)} бизнесийг газрын зурагт харах</p>
        <Link href="/map"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:brightness-110 transition-all shadow-glow-brand">
          <ExternalLink size={15} />
          Газрын зурагт нээх
        </Link>
      </div>
    </div>
  )
}
