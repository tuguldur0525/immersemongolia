'use client'
// src/components/layout/Navbar.tsx

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Globe, Search, User, ChevronDown, MapPin, LogOut, Settings, BarChart2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as AppUser } from '@/types'

interface NavbarProps {
  transparent?: boolean
}

const navLinks = [
  { label: 'Газрын зураг', href: '/map', icon: MapPin },
  { label: 'Хайх', href: '/business/search', icon: Search },
  { label: 'Үнэ тариф', href: '/pricing' },
  { label: 'Бидний тухай', href: '/public/about' },
]

export default function Navbar({ transparent = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<AppUser | null>(null)
  const [lang, setLang] = useState<'mn' | 'en'>('mn')
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setDbUser(null)
    router.push('/')
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
        <nav aria-label="Primary navigation" className="section-container h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" aria-label="Immerse Mongolia home" className="flex items-center gap-2.5 font-bold text-xl shrink-0">
            <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand hover:scale-105 transition-transform duration-300">
              <Globe size={18} className="text-white animate-pulse-gentle" />
            </div>
            <span className="gradient-text font-extrabold tracking-tight">Immerse Mongolia</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <button
              onClick={() => setLang(l => l === 'mn' ? 'en' : 'mn')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              <Globe size={16} />
              {lang.toUpperCase()}
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background-secondary transition-colors"
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
                  Нэвтрэх
                </Link>
                <Link href="/auth/signup" className="btn-brand hidden px-4 py-2 text-sm sm:inline-flex">
                  Бүртгүүлэх
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
            className="fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="section-container py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-background-secondary transition-colors"
                >
                  {link.icon && <link.icon size={18} className="text-foreground-muted" />}
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <div className="border-t border-border my-2" />
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-background-secondary transition-colors">
                    Нэвтрэх
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                    className="btn-brand justify-center mt-1">
                    Бүртгүүлэх
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
