'use client'
// src/app/auth/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, MapPin, ArrowLeft, Chrome } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Зөв имэйл хаяг оруулна уу'),
  password: z.string().min(6, 'Нууц үг хамгийн багадаа 6 тэмдэгт'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('Имэйл эсвэл нууц үг буруу байна.')
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col relative bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary/80 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        <div className="relative z-10 p-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-xl">
            <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            Immerse Mongolia
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Монголын шилдэг газруудыг нээж илрүүл
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Immerse Mongolia-д нэвтэрч, дуртай газруудаа хадгалж, санал хүсэлт үлдээх боломжтой.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  { icon: '🗺️', text: 'Интерактив газрын зураг' },
                  { icon: '⭐', text: 'Санал хүсэлт үлдээх' },
                  { icon: '❤️', text: 'Дуртай газруудаа хадгалах' },
                  { icon: '360°', text: 'Виртуал аялал' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <p className="text-white/50 text-sm">© 2025 Immerse Mongolia LLC. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Link href="/" className="size-9 rounded-xl border border-border flex items-center justify-center">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="size-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                <MapPin size={13} className="text-white" />
              </div>
              Immerse Mongolia
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Нэвтрэх</h1>
            <p className="text-foreground-secondary mb-8">
              Бүртгэл байхгүй юу?{' '}
              <Link href="/auth/signup" className="text-brand-primary font-medium hover:underline">
                Бүртгүүлэх
              </Link>
            </p>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-background-secondary transition-colors text-sm font-medium mb-6"
            >
              <Chrome size={18} />
              Google-ээр нэвтрэх
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground-muted">эсвэл имэйлээр</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Error */}
            {serverError && (
              <div className="mb-4 p-3 rounded-xl bg-brand-danger/8 border border-brand-danger/30 text-brand-danger text-sm">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Имэйл хаяг</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="email@example.mn"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-card text-sm transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary',
                    errors.email ? 'border-brand-danger' : 'border-border'
                  )}
                />
                {errors.email && <p className="text-xs text-brand-danger mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Нууц үг</label>
                  <Link href="/auth/forgot-password" className="text-xs text-brand-primary hover:underline">
                    Нууц үг мартсан?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      'w-full px-4 py-3 pr-11 rounded-xl border bg-card text-sm transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary',
                      errors.password ? 'border-brand-danger' : 'border-border'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-brand-danger mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input {...register('rememberMe')} type="checkbox" id="remember" className="rounded border-border" />
                <label htmlFor="remember" className="text-sm text-foreground-secondary">Намайг сана</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-brand py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
