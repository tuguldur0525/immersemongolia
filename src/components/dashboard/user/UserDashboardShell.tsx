'use client'

import { type ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Globe,
  MapPin,
  Menu,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type UserDashboardShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

const SIDEBAR_LINKS = [
  { href: '/dashboard/user', label: 'Профайл', icon: User },
  { href: '/dashboard/user/settings', label: 'Тохиргоо', icon: Settings },
  { href: '/business/search', label: 'Газар хайх', icon: Search },
  { href: '/map', label: 'Газрын зураг', icon: MapPin },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard/user') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function UserDashboardShell({
  title,
  subtitle,
  actions,
  children,
}: UserDashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background-secondary">
      {sidebarOpen && (
        <button
          aria-label="Sidebar хаах"
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
            <User size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold gradient-text">Immerse Mongolia</p>
            <p className="text-[11px] text-foreground-muted">User dashboard</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Хэрэглэгч
          </p>
          <div className="space-y-0.5">
            {SIDEBAR_LINKS.map((link) => {
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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <Globe size={16} />
            Сайт руу буцах
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((value) => !value)}
              className="flex size-9 items-center justify-center rounded-xl border border-border lg:hidden"
              aria-label="Sidebar нээх"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">{title}</h1>
              {subtitle && <p className="hidden truncate text-xs text-foreground-muted sm:block">{subtitle}</p>}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
