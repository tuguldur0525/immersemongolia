'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Building2,
  Globe,
  Megaphone,
  Menu,
  Shield,
  Tag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_NAV = [
  { href: '/dashboard/admin', label: 'Хяналт', icon: BarChart2 },
  { href: '/dashboard/admin/businesses', label: 'Бизнесүүд', icon: Building2 },
  { href: '/dashboard/admin/users', label: 'Хэрэглэгчид', icon: Users },
  { href: '/dashboard/admin/analytics', label: 'Аналитик', icon: TrendingUp },
  { href: '/dashboard/admin/content', label: 'Агуулга', icon: Globe },
  { href: '/dashboard/admin/categories', label: 'Ангилал', icon: Tag },
  { href: '/dashboard/admin/advertisements', label: 'Зар сурталчилгаа', icon: Megaphone },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard/admin') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background-secondary lg:flex">
      {sidebarOpen && (
        <button
          aria-label="Админ sidebar хаах"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
            <Shield size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold gradient-text">Immerse Mongolia</p>
            <p className="text-xs text-foreground-muted">Админ панел</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-0.5">
            {ADMIN_NAV.map((link) => {
              const active = isActivePath(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
                  )}
                >
                  <link.icon size={17} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <Globe size={16} />
            Сайт руу буцах
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="flex size-9 items-center justify-center rounded-xl border border-border"
            aria-label="Админ sidebar нээх"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Админ панел</p>
            <p className="text-xs text-foreground-muted">Immerse Mongolia</p>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
