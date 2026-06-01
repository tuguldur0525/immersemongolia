'use client'
// src/components/layout/MobileBottomNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Search, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Нүүр', icon: Home },
  { href: '/map', label: 'Зураг', icon: Map },
  { href: '/business/search', label: 'Хайх', icon: Search },
  { href: '/dashboard/user/saved', label: 'Хадгалсан', icon: Heart },
  { href: '/dashboard/user', label: 'Профайл', icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border bottom-nav-safe">
      <div className="flex">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-brand-primary' : 'text-foreground-muted hover:text-foreground'
              )}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
