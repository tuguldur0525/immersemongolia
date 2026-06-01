'use client'
// src/app/auth/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MapPin, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Зөв имэйл хаяг оруулна уу'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email }: { email: string }) {
    setServerError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setServerError('Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-secondary">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">
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
          {sent ? (
            <div className="text-center">
              <div className="size-16 rounded-full bg-brand-success/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-brand-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">Имэйл илгээгдлээ!</h2>
              <p className="text-sm text-foreground-secondary mb-6 leading-relaxed">
                <strong>{getValues('email')}</strong> хаяг руу нууц үг сэргээх холбоосыг илгээлээ.
                Inbox болон Spam-ыг шалгана уу.
              </p>
              <Link href="/auth/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors">
                <ArrowLeft size={15} />
                Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold mb-1">Нууц үг мартсан уу?</h1>
                <p className="text-sm text-foreground-secondary">
                  Имэйл хаягаа оруулна уу. Нууц үг сэргээх холбоос илгээнэ.
                </p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 rounded-xl bg-brand-danger/8 border border-brand-danger/30 text-brand-danger text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Имэйл хаяг</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="email@example.mn"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl border bg-background-secondary text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary',
                        errors.email ? 'border-brand-danger' : 'border-border'
                      )}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-brand-danger mt-1">{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full btn-brand py-3 disabled:opacity-60">
                  {isSubmitting ? 'Илгээж байна...' : 'Холбоос илгээх'}
                </button>

                <Link href="/auth/login"
                  className="flex items-center justify-center gap-2 w-full text-sm text-foreground-muted hover:text-foreground transition-colors">
                  <ArrowLeft size={14} />
                  Нэвтрэх хуудас руу буцах
                </Link>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
