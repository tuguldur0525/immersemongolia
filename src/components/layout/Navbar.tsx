'use client'
// src/components/layout/Navbar.tsx

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Menu, X, Sun, Moon, Globe, Search, ChevronDown, MapPin, LogOut, Settings, BarChart2, Building2, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import type { User as AppUser } from '@/types'

interface NavbarProps {
  transparent?: boolean
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [dbUser, setDbUser] = useState<AppUser | null>(null)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const { locale, setLocale, t } = useLanguage()

  const navLinks = useMemo(() => [
    { label: t('common.home'), href: '/', icon: Home },
    { label: t('common.map'), href: '/map', icon: MapPin },
    { label: t('common.search'), href: '/business/search', icon: Search },
    { label: t('common.pricing'), href: '/pricing' },
    { label: t('common.about'), href: '/public/about' },
  ], [t])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return

      setUser(user)
      if (!user) {
        setDbUser(null)
        return
      }

      const res = await fetch('/api/users', { cache: 'no-store' })
      if (!isMounted) return

      if (res.ok) {
        const { data } = await res.json()
        setDbUser(data)
      } else {
        setDbUser(null)
      }
    }

    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setDbUser(null)
        return
      }

      setUser(session.user)
      fetch('/api/users', { cache: 'no-store' })
        .then((res) => res.ok ? res.json() : null)
        .then((payload) => {
          if (isMounted) setDbUser(payload?.data ?? null)
        })
        .catch(() => {
          if (isMounted) setDbUser(null)
        })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const isScrolledOrSolid = !transparent || scrolled || mobileOpen

  useEffect(() => {
    if (!dbUser?.preferredLanguage || typeof window === 'undefined') return
    if (!window.localStorage.getItem('immerse-locale')) {
      setLocale(dbUser.preferredLanguage)
    }
  }, [dbUser?.preferredLanguage, setLocale])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setDbUser(null)
    router.push('/')
  }

  function handleLanguageToggle() {
    const nextLocale = locale === 'mn' ? 'en' : 'mn'
    setLocale(nextLocale)

    if (user) {
      fetch('/api/users/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: nextLocale }),
      }).catch(() => {})
    }
  }

  const getDashboardLink = () => {
    if (!dbUser) return '/auth/login'
    if (['ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) return '/dashboard/admin'
    if (dbUser.role === 'BUSINESS_OWNER') return '/dashboard/business'
    return '/dashboard/user'
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolledOrSolid
            ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-transparent'
        )}
      >
        <nav aria-label="Primary navigation" className="section-container h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" aria-label="Immerse Mongolia home" className="flex min-w-0 shrink items-center gap-2.5 font-bold text-xl">
            <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand hover:scale-105 transition-transform duration-300">
              <Globe size={18} className="text-white animate-pulse-gentle" />
            </div>
            <span className="hidden xs:inline truncate gradient-text text-base font-extrabold tracking-normal sm:text-xl">
              Immerse Mongolia
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors lg:px-4',
                  isActivePath(pathname, link.href)
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Language switcher */}
            <button
              onClick={handleLanguageToggle}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              <Globe size={16} />
              {locale.toUpperCase()}
            </button>

            {/* Dark mode */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="size-9 rounded-xl flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Auth */}
            {user && dbUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-xl hover:bg-background-secondary transition-colors sm:gap-2 sm:px-3"
                >
                  {dbUser.avatarUrl ? (
                    <Image src={dbUser.avatarUrl} alt="" width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="size-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-semibold text-brand-primary">
                      {(dbUser.firstName || dbUser.displayName || 'U')[0]}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                    {dbUser.displayName || dbUser.firstName}
                  </span>
                  <ChevronDown size={14} className={cn('transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-card border border-border shadow-xl py-2 overflow-hidden"
                    >
                      <Link href={getDashboardLink()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background-secondary transition-colors"
                        onClick={() => setUserMenuOpen(false)}>
                        <BarChart2 size={16} className="text-foreground-muted" />
                        Хяналтын самбар
                      </Link>
                      {dbUser.role === 'BUSINESS_OWNER' && (
                        <Link href="/dashboard/business/listings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background-secondary transition-colors"
                          onClick={() => setUserMenuOpen(false)}>
                          <Building2 size={16} className="text-foreground-muted" />
                          Миний бизнесүүд
                        </Link>
                      )}
                      <Link href="/dashboard/user/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background-secondary transition-colors"
                        onClick={() => setUserMenuOpen(false)}>
                        <Settings size={16} className="text-foreground-muted" />
                        Тохиргоо
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-danger hover:bg-brand-danger/8 transition-colors"
                      >
                        <LogOut size={16} />
                        Гарах
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors">
                  {t('common.login')}
                </Link>
                <Link href="/auth/signup" className="btn-brand hidden px-4 py-2 text-sm sm:inline-flex">
                  {t('common.signup')}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="md:hidden size-9 rounded-xl flex items-center justify-center text-foreground-secondary hover:bg-background-secondary transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-background/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="section-container py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActivePath(pathname, link.href)
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'hover:bg-background-secondary'
                  )}
                >
                  {link.icon && <link.icon size={18} className="text-foreground-muted" />}
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLanguageToggle}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background-secondary transition-colors"
                >
                  <Globe size={16} />
                  {locale === 'mn' ? 'MN' : 'EN'}
                </button>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background-secondary transition-colors"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
              {user && dbUser ? (
                <>
                  <div className="mt-2 rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      {dbUser.avatarUrl ? (
                        <Image src={dbUser.avatarUrl} alt="" width={36} height={36} className="rounded-full" />
                      ) : (
                        <div className="size-9 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-semibold text-brand-primary">
                          {(dbUser.firstName || dbUser.displayName || 'U')[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{dbUser.displayName || dbUser.firstName}</p>
                        <p className="truncate text-xs text-foreground-muted">{dbUser.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link href={getDashboardLink()} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-background-secondary transition-colors">
                    <BarChart2 size={18} className="text-foreground-muted" />
                    {t('common.dashboard')}
                  </Link>
                  <Link href="/dashboard/user/settings" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-background-secondary transition-colors">
                    <Settings size={18} className="text-foreground-muted" />
                    {t('dashboard.settings')}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      handleSignOut()
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-danger hover:bg-brand-danger/8 transition-colors"
                  >
                    <LogOut size={18} />
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-background-secondary transition-colors">
                    {t('common.login')}
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="btn-brand justify-center mt-1">
                    {t('common.signup')}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  )
}
