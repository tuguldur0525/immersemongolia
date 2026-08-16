'use client'
// src/app/public/contact/page.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Нэрийг оруулна уу'),
  email: z.string().email('Зөв имэйл оруулна уу'),
  subject: z.string().min(3, 'Сэдвийг оруулна уу'),
  message: z.string().min(20, 'Дор хаяж 20 тэмдэгт бичнэ үү'),
})

type ContactForm = z.infer<typeof schema>

const SUBJECTS = ['Ерөнхий асуулт', 'Бизнес бүртгэл', 'Техникийн дэмжлэг', 'Санал хүсэлт', 'Бусад']

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactForm>({ resolver: zodResolver(schema) })

  async function onSubmit(_data: ContactForm) {
    void _data
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
  }

  const contactItems = [
    { icon: Mail, label: 'Имэйл', value: 'info@immersemongolia.mn', href: 'mailto:info@immersemongolia.mn' },
    { icon: Phone, label: 'Утас', value: '+976 7777-0101', href: 'tel:+97677770101' },
    { icon: MapPin, label: 'Хаяг', value: 'Сүхбаатар дүүрэг, Улаанбаатар', href: '#' },
    { icon: Clock, label: 'Ажлын цаг', value: 'Даваа–Баасан: 09:00–18:00', href: '#' },
  ]

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">Холбоо барих</h1>
              <p className="text-foreground-secondary text-lg max-w-xl mx-auto">Асуулт, санал хүсэлтээ бидэнд илгээгээрэй. 24 цагийн дотор хариу өгнө.</p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="section-container grid lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h2 className="text-2xl font-bold mb-6">Холбоо барих мэдээлэл</h2>
              <div className="space-y-4 mb-10">
                {contactItems.map(item => (
                  <a key={item.label} href={item.href}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-brand-primary hover:shadow-sm transition-all group">
                    <div className="size-11 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted mb-0.5">{item.label}</p>
                      <p className="font-medium group-hover:text-brand-primary transition-colors">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Social */}
              <h3 className="font-semibold mb-4">Сошиал хаяг</h3>
              <div className="flex gap-3">
                {[
                  { label: 'Facebook', href: 'https://facebook.com/immersemongolia', emoji: '📘' },
                  { label: 'Instagram', href: 'https://instagram.com/immersemongolia', emoji: '📷' },
                  { label: 'Twitter', href: 'https://twitter.com/immersemongolia', emoji: '🐦' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-brand-primary hover:text-brand-primary transition-all text-sm font-medium">
                    <span>{s.emoji}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-brand-success/30 bg-brand-success/5">
                  <CheckCircle size={52} className="text-brand-success mb-4" />
                  <h3 className="text-xl font-bold mb-2">Амжилттай илгээгдлээ!</h3>
                  <p className="text-foreground-muted">Таны мэдэгдлийг хүлээн авлаа. Ойрын цагт холбогдно.</p>
                </motion.div>
              ) : (
                <div className="p-8 rounded-3xl border border-border bg-card">
                  <h2 className="text-xl font-bold mb-6">Мэдэгдэл илгээх</h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Нэр *</label>
                        <input {...register('name')} placeholder="Таны нэр"
                          className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.name ? 'border-brand-danger' : 'border-border')} />
                        {errors.name && <p className="text-xs text-brand-danger mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Имэйл *</label>
                        <input {...register('email')} type="email" placeholder="email@example.mn"
                          className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.email ? 'border-brand-danger' : 'border-border')} />
                        {errors.email && <p className="text-xs text-brand-danger mt-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Сэдэв *</label>
                      <select {...register('subject')}
                        className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all', errors.subject ? 'border-brand-danger' : 'border-border')}>
                        <option value="">Сэдэв сонгох</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.subject && <p className="text-xs text-brand-danger mt-1">{errors.subject.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Мэдэгдэл *</label>
                      <textarea {...register('message')} rows={5} placeholder="Мэдэгдлийг дэлгэрэнгүй бичнэ үү..."
                        className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none', errors.message ? 'border-brand-danger' : 'border-border')} />
                      {errors.message && <p className="text-xs text-brand-danger mt-1">{errors.message.message}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting}
                      className="w-full btn-brand py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Илгээж байна...' : <><Send size={16} /> Илгээх</>}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
