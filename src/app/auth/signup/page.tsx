'use client'
// src/app/auth/signup/page.tsx

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, MapPin, ArrowLeft, Chrome, User, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl, buildGoogleOAuthUrl } from '@/lib/auth/redirects'
import { cn, formatInteger } from '@/lib/utils'
import { usePlatformStats } from '@/hooks'

const signupSchema = z.object({
  firstName: z.string().min(2, 'Нэрийг оруулна уу'),
  lastName: z.string().min(2, 'Овогийг оруулна уу'),
  email: z.string().email('Зөв имэйл оруулна уу'),
  password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт'),
  confirmPassword: z.string(),
  role: z.enum(['USER', 'BUSINESS_OWNER']).default('USER'),
  agreeToTerms: z.boolean().refine(v => v, 'Үйлчилгээний нөхцөлийг зөвшөөрнө үү'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Нууц үг таарахгүй байна',
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

function getSignupErrorMessage(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? ''

  if (error.message === 'User already registered') {
    return 'Энэ имэйл хаяг бүртгэлтэй байна.'
  }

  if (error.status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return 'Богино хугацаанд олон удаа бүртгэл үүсгэх хүсэлт илгээсэн байна. Түр хүлээгээд дахин оролдоно уу.'
  }

  return 'Бүртгэл үүсгэхэд алдаа гарлаа.'
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { data: platformStats } = usePlatformStats()
  const platformStatItems = [
    { num: formatInteger(platformStats?.totalBusinesses ?? 0), label: 'Бизнесүүд' },
    { num: formatInteger(platformStats?.totalUsers ?? 0), label: 'Хэрэглэгчид' },
    { num: formatInteger(platformStats?.totalReviews ?? 0), label: 'Санал хүсэлт' },
    { num: formatInteger(platformStats?.coveredCities ?? 0), label: 'Хот/аймаг' },
  ]

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'USER' },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: SignupForm) {
    setServerError('')
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { firstName: data.firstName, lastName: data.lastName, role: data.role },
        emailRedirectTo: buildAuthCallbackUrl(window.location.origin, { role: data.role }),
      },
    })

    if (error) {
      setServerError(getSignupErrorMessage(error))
      return
    }

    // Create user profile via API
    if (authData.user) {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: authData.user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        }),
      })
    }

    setSuccess(true)
  }

  async function handleGoogleSignup() {
    setServerError('')
    setIsGoogleLoading(true)

    try {
      const next = selectedRole === 'BUSINESS_OWNER' ? '/dashboard/business' : '/'
      const oauthUrl = await buildGoogleOAuthUrl(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        buildAuthCallbackUrl(window.location.origin, { next, role: selectedRole })
      )

      window.location.assign(oauthUrl)
    } catch (error) {
      console.error('Google OAuth URL creation failed:', error)
      setServerError('Google-ээр бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.')
      setIsGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="size-20 rounded-full bg-brand-success/15 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Имэйл шалгана уу!</h2>
          <p className="text-foreground-secondary mb-6">
            Бүртгэлийг баталгаажуулах линкийг имэйл рүү таны хаяг руу илгээлээ.
            Имэйлийнхээ inbox-г шалгана уу.
          </p>
          <Link href="/auth/login" className="btn-brand px-8 py-3">
            Нэвтрэх хуудас руу
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col relative bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary/80 overflow-hidden">
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
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="text-3xl font-bold text-white mb-4">Immerse Mongolia-д нэгдэнэ үү</h2>
              <p className="text-white/80 text-lg">Монголын шилдэг бизнес нээлтийн платформд бүртгүүлж, давуу эрхийг эдлэнэ үү.</p>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {platformStatItems.map(s => (
                  <div key={s.label} className="bg-white/10 rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{s.num}</p>
                    <p className="text-white/70 text-sm">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md">
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Бүртгүүлэх</h1>
            <p className="text-foreground-secondary mb-6">
              Бүртгэлтэй юу?{' '}
              <Link href="/auth/login" className="text-brand-primary font-medium hover:underline">Нэвтрэх</Link>
            </p>

            {/* Account type selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'USER', icon: User, label: 'Хэрэглэгч', desc: 'Хайх, үнэлэх' },
                { value: 'BUSINESS_OWNER', icon: Building2, label: 'Бизнес эзэн', desc: 'Бизнесээ бүртгүүлэх' },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue('role', type.value as 'USER' | 'BUSINESS_OWNER')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    selectedRole === type.value
                      ? 'border-brand-primary bg-brand-primary/6'
                      : 'border-border hover:border-border-strong'
                  )}
                >
                  <type.icon size={20} className={selectedRole === type.value ? 'text-brand-primary' : 'text-foreground-muted'} />
                  <p className={cn('font-semibold text-sm mt-2', selectedRole === type.value && 'text-brand-primary')}>{type.label}</p>
                  <p className="text-xs text-foreground-muted">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogleSignup} disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-background-secondary transition-colors text-sm font-medium mb-5 disabled:opacity-60 disabled:cursor-not-allowed">
              <Chrome size={18} />
              {isGoogleLoading ? 'Google руу шилжиж байна...' : 'Google-ээр бүртгүүлэх'}
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground-muted">эсвэл имэйлээр</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-xl bg-brand-danger/8 border border-brand-danger/30 text-brand-danger text-sm">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Овог</label>
                  <input {...register('lastName')} placeholder="Батхуяг" type="text"
                    className={cn('w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.lastName ? 'border-brand-danger' : 'border-border')} />
                  {errors.lastName && <p className="text-xs text-brand-danger mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Нэр</label>
                  <input {...register('firstName')} placeholder="Мөнхбаяр" type="text"
                    className={cn('w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.firstName ? 'border-brand-danger' : 'border-border')} />
                  {errors.firstName && <p className="text-xs text-brand-danger mt-1">{errors.firstName.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Имэйл хаяг</label>
                <input {...register('email')} type="email" placeholder="email@example.mn"
                  className={cn('w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.email ? 'border-brand-danger' : 'border-border')} />
                {errors.email && <p className="text-xs text-brand-danger mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Нууц үг</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Хамгийн багадаа 8 тэмдэгт"
                    className={cn('w-full px-4 py-3 pr-11 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.password ? 'border-brand-danger' : 'border-border')} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-brand-danger mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Нууц үг давтах</label>
                <input {...register('confirmPassword')} type="password" placeholder="Нууц үгийг давтана уу"
                  className={cn('w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.confirmPassword ? 'border-brand-danger' : 'border-border')} />
                {errors.confirmPassword && <p className="text-xs text-brand-danger mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input {...register('agreeToTerms')} type="checkbox" id="terms" className="mt-0.5 rounded border-border" />
                <label htmlFor="terms" className="text-sm text-foreground-secondary">
                  <Link href="/public/terms" className="text-brand-primary hover:underline">Үйлчилгээний нөхцөл</Link> болон{' '}
                  <Link href="/public/privacy" className="text-brand-primary hover:underline">Нууцлалын бодлого</Link>-г зөвшөөрч байна
                </label>
              </div>
              {errors.agreeToTerms && <p className="text-xs text-brand-danger">{errors.agreeToTerms.message}</p>}

              <button type="submit" disabled={isSubmitting}
                className="w-full btn-brand py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
