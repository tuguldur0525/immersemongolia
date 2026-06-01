'use client'
// src/app/auth/reset-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, MapPin, CheckCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Нууц үг таарахгүй байна',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ password }: FormData) {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setServerError('Нууц үг шинэчлэхэд алдаа гарлаа. Холбоос хугацаа дуусчихсан байж болно.')
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-secondary">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="gradient-text">Immerse Mongolia</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border p-8 shadow-lg"
        >
          {success ? (
            <div className="text-center">
              <div className="size-16 rounded-full bg-brand-success/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-brand-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Амжилттай шинэчлэгдлээ!</h2>
              <p className="text-sm text-foreground-secondary">Нэвтрэх хуудас руу дахин чиглүүлж байна...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="size-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4">
                  <Lock size={22} className="text-brand-primary" />
                </div>
                <h1 className="text-xl font-bold mb-1">Шинэ нууц үг тохируулах</h1>
                <p className="text-sm text-foreground-secondary">Хамгийн багадаа 8 тэмдэгт ашиглана уу</p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 rounded-xl bg-brand-danger/8 border border-brand-danger/30 text-brand-danger text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Шинэ нууц үг</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Хамгийн багадаа 8 тэмдэгт"
                      className={cn(
                        'w-full px-4 py-3 pr-11 rounded-xl border bg-background-secondary text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary',
                        errors.password ? 'border-brand-danger' : 'border-border'
                      )}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-brand-danger mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Нууц үг давтах</label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Нууц үгийг давтана уу"
                      className={cn(
                        'w-full px-4 py-3 pr-11 rounded-xl border bg-background-secondary text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary',
                        errors.confirmPassword ? 'border-brand-danger' : 'border-border'
                      )}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-brand-danger mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full btn-brand py-3 disabled:opacity-60">
                  {isSubmitting ? 'Шинэчилж байна...' : 'Нууц үг шинэчлэх'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
