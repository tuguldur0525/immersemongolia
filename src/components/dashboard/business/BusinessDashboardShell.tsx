'use client'

import { type ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Building2,
  CreditCard,
  Eye,
  Globe,
  MapPin,
  Menu,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BusinessDashboardShellProps = {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}

const SIDEBAR_LINKS = [
  { href: '/dashboard/business', label: 'Хяналт', icon: BarChart2 },
  { href: '/dashboard/business/listings', label: 'Бизнесүүд', icon: Building2 },
  { href: '/dashboard/business/analytics', label: 'Аналитик', icon: TrendingUp },
  { href: '/dashboard/business/media', label: 'Медиа', icon: Eye },
  { href: '/dashboard/business/leads', label: 'Лид & Харилцагч', icon: Users },
  { href: '/dashboard/business/payments', label: 'Төлбөр', icon: CreditCard },
  { href: '/dashboard/user/settings', label: 'Тохиргоо', icon: Settings },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard/business') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function BusinessDashboardShell({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  contentClassName,
}: BusinessDashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background-secondary flex">
      {sidebarOpen && (
        <button
          aria-label="Sidebar хаах"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="size-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-sm">
            <MapPin size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base gradient-text truncate">Immerse Mongolia</p>
            <p className="text-[11px] text-foreground-muted">Business dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider px-3 mb-2">
            Бизнес
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
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

        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
          >
            <Globe size={16} />
            Сайт руу буцах
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((value) => !value)}
              className="lg:hidden size-9 rounded-xl border border-border flex items-center justify-center"
              aria-label="Sidebar нээх"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="flex-1 min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1 truncate">
                  {breadcrumbs.map((item, index) => (
                    <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2 min-w-0">
                      {index > 0 && <span>/</span>}
                      {item.href ? (
                        <Link href={item.href} className="hover:text-foreground truncate">
                          {item.label}
                        </Link>
                      ) : (
                        <span className="truncate">{item.label}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="font-bold text-lg truncate">{title}</h1>
              {subtitle && <p className="text-xs text-foreground-muted hidden sm:block truncate">{subtitle}</p>}
            </div>

            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </header>

        <main className={cn('flex-1 p-4 sm:p-6 lg:p-8 overflow-auto', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
