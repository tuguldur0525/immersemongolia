'use client'
// src/app/pricing/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, Zap, Star, Crown, Building2, HelpCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { cn, formatInteger } from '@/lib/utils'
import { usePlatformStats, useSubscriptionPlans } from '@/hooks'
import type { SubscriptionPlanConfig } from '@/types'

const PLANS = [
  {
    id: 'FREE',
    name: 'Үнэгүй',
    nameMn: 'Үнэгүй',
    icon: Building2,
    monthlyPrice: 0,
    annualPrice: 0,
    color: 'text-foreground-secondary',
    bg: 'bg-background-secondary',
    border: 'border-border',
    description: 'Жижиг бизнесүүдэд тохиромжтой эхлэл',
    features: [
      { text: '1 бизнесийн профайл', included: true },
      { text: '5 зураг байршуулах', included: true },
      { text: 'Үндсэн мэдээлэл', included: true },
      { text: 'Санал хүсэлт хүлээн авах', included: true },
      { text: 'Аналитик тайлан', included: false },
      { text: 'Онцлох байдлаар гарах', included: false },
      { text: '360° виртуал аялал', included: false },
      { text: 'Тэргүүлэх дэмжлэг', included: false },
    ],
  },
  {
    id: 'STARTER',
    name: 'Эхлэгч',
    nameMn: 'Эхлэгч',
    icon: Zap,
    monthlyPrice: 49000,
    annualPrice: 490000,
    color: 'text-brand-primary',
    bg: 'bg-brand-primary/5',
    border: 'border-brand-primary/30',
    description: 'Өсөн нэмэгдэж буй бизнесүүдэд',
    features: [
      { text: '1 бизнесийн профайл', included: true },
      { text: '20 зураг байршуулах', included: true },
      { text: 'Дэлгэрэнгүй мэдээлэл', included: true },
      { text: 'Санал хүсэлт хүлээн авах', included: true },
      { text: 'Үндсэн аналитик тайлан', included: true },
      { text: 'Онцлох байдлаар гарах', included: false },
      { text: '360° виртуал аялал', included: false },
      { text: 'Тэргүүлэх дэмжлэг', included: false },
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Мэргэжлийн',
    nameMn: 'Мэргэжлийн',
    icon: Star,
    monthlyPrice: 99000,
    annualPrice: 990000,
    color: 'text-white',
    bg: 'bg-brand-gradient',
    border: 'border-transparent',
    popular: true,
    description: 'Хамгийн их сонгогддог тарифф',
    features: [
      { text: '3 бизнесийн профайл', included: true },
      { text: 'Хязгааргүй зураг', included: true },
      { text: 'Дэлгэрэнгүй мэдээлэл', included: true },
      { text: 'Санал хүсэлт хүлээн авах', included: true },
      { text: 'Дэлгэрэнгүй аналитик', included: true },
      { text: 'Онцлох байдлаар гарах', included: true },
      { text: '360° виртуал аялал', included: true },
      { text: 'Тэргүүлэх дэмжлэг', included: false },
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Корпорат',
    nameMn: 'Корпорат',
    icon: Crown,
    monthlyPrice: 199000,
    annualPrice: 1990000,
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/5',
    border: 'border-brand-accent/30',
    description: 'Томоохон бизнесүүд болон сүлжээнд',
    features: [
      { text: 'Хязгааргүй бизнесийн профайл', included: true },
      { text: 'Хязгааргүй зураг', included: true },
      { text: 'Дэлгэрэнгүй мэдээлэл', included: true },
      { text: 'Санал хүсэлт хүлээн авах', included: true },
      { text: 'Нарийвчилсан аналитик + API', included: true },
      { text: 'Онцлох байдлаар гарах (тэргүүн)', included: true },
      { text: '360° виртуал аялал', included: true },
      { text: '24/7 Тэргүүлэх дэмжлэг', included: true },
    ],
  },
]

const FAQS = [
  { q: 'Үнэгүй тарифф хэдэн хугацаа үргэлжлэх вэ?', a: 'Үнэгүй тарифф хугацаагүй үргэлжилнэ. Хэзээ ч дуусгавар болохгүй.' },
  { q: 'QPay-ээр төлбөр хийж болох уу?', a: 'Тийм, QPay, банкны карт болон банкны шилжүүлгээр төлбөр хийх боломжтой.' },
  { q: 'Тарифф дуустал юу болох вэ?', a: 'Тарифф дуусмагц таны бизнес үнэгүй тарифф руу автоматаар шилжинэ.' },
  { q: 'Жилийн төлбөрт хэдэн хувийн хөнгөлөлт байдаг вэ?', a: 'Жилийн төлбөр сонгоход 2 сарын үнийн хөнгөлөлт эдлэнэ (17% хөнгөлөлт).' },
  { q: 'Тарифф солих боломжтой юу?', a: 'Тийм, дурын үед дээш болон доош шилжих боломжтой.' },
  { q: 'Нэхэмжлэх авах боломжтой юу?', a: 'Тийм, бизнесийн нэхэмжлэх авах бүрэн боломжтой.' },
]

function formatLimit(value: number | string | boolean | undefined, fallback: number, singular: string, unlimited: string) {
  if (value === 'unlimited' || fallback >= 999) return unlimited
  const numericValue = typeof value === 'number' ? value : fallback
  return `${formatInteger(numericValue)} ${singular}`
}

function buildPlanFeatures(plan: SubscriptionPlanConfig) {
  return [
    {
      text: formatLimit(plan.features.listings, plan.maxListings, 'бизнесийн профайл', 'Хязгааргүй бизнесийн профайл'),
      included: true,
    },
    {
      text: formatLimit(plan.features.photos, plan.maxPhotos, 'зураг байршуулах', 'Хязгааргүй зураг'),
      included: true,
    },
    { text: 'Дэлгэрэнгүй мэдээлэл', included: true },
    { text: 'Санал хүсэлт хүлээн авах', included: true },
    {
      text: plan.hasAnalytics ? 'Аналитик тайлан' : 'Аналитик тайлан',
      included: plan.hasAnalytics,
    },
    { text: 'Онцлох байдлаар гарах', included: plan.isFeatured },
    { text: '360° виртуал аялал', included: plan.hasVirtualTour },
    { text: 'Тэргүүлэх дэмжлэг', included: plan.hasPrioritySupport },
  ]
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { data: platformStats } = usePlatformStats()
  const { data: livePlans = [] } = useSubscriptionPlans()
  const plans = PLANS.map((plan) => {
    const livePlan = livePlans.find((item) => item.plan === plan.id)
    if (!livePlan) return plan

    return {
      ...plan,
      name: livePlan.nameMn,
      nameMn: livePlan.nameMn,
      monthlyPrice: livePlan.monthlyPriceMnt,
      annualPrice: livePlan.annualPriceMnt,
      description: livePlan.descriptionMn || plan.description,
      features: buildPlanFeatures(livePlan),
    }
  })

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="section-container relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-primary/30 bg-brand-primary/8 text-brand-primary text-sm font-medium mb-6">
                <Zap size={14} />
                Бизнесийн тарифф
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
                Бизнесдоо тохирсон тариффыг сонго
              </h1>
              <p className="text-foreground-secondary text-lg max-w-xl mx-auto mb-8">
                Монголын хамгийн том бизнес нээлтийн платформд бизнесээ бүртгүүлж, {formatInteger(platformStats?.totalUsers ?? 0)} хэрэглэгчид хүрнэ үү.
              </p>

              {/* Annual toggle */}
              <div className="inline-flex items-center gap-4 p-1.5 rounded-2xl bg-background-secondary border border-border">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={cn('px-5 py-2 rounded-xl text-sm font-medium transition-all', !isAnnual ? 'bg-card shadow-sm' : 'text-foreground-muted hover:text-foreground')}
                >
                  Сарын
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={cn('px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2', isAnnual ? 'bg-card shadow-sm' : 'text-foreground-muted hover:text-foreground')}
                >
                  Жилийн
                  <span className="px-1.5 py-0.5 rounded-full bg-brand-success/15 text-brand-success text-[10px] font-semibold">-17%</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20">
          <div className="section-container">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
              {plans.map((plan, i) => {
                const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
                const Icon = plan.icon
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className={cn(
                      'relative rounded-3xl border-2 overflow-hidden',
                      plan.popular ? 'border-brand-primary shadow-xl shadow-brand-primary/15 scale-[1.02]' : plan.border
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-brand-gradient" />
                    )}

                    <div className={cn('p-6', plan.popular ? 'bg-card' : 'bg-card')}>
                      {plan.popular && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold mb-4">
                          <Star size={11} fill="currentColor" />
                          Хамгийн их сонгодог
                        </div>
                      )}

                      <div className={cn('size-12 rounded-2xl flex items-center justify-center mb-4',
                        plan.popular ? 'bg-brand-gradient' : plan.bg)}>
                        <Icon size={22} className={plan.popular ? 'text-white' : plan.color} />
                      </div>

                      <h3 className="text-xl font-bold mb-1">{plan.nameMn}</h3>
                      <p className="text-sm text-foreground-muted mb-5">{plan.description}</p>

                      <div className="mb-6">
                        {price === 0 ? (
                          <div className="text-4xl font-bold">Үнэгүй</div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold">₮{(price / 1000).toFixed(0)}K</span>
                              <span className="text-foreground-muted text-sm">/{isAnnual ? 'жил' : 'сар'}</span>
                            </div>
                            {isAnnual && (
                              <p className="text-xs text-brand-success mt-1">
                                Сарын ₮{(plan.monthlyPrice / 1000).toFixed(0)}K-аас хэмнэнэ
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={price === 0 ? '/auth/signup' : `/auth/signup?plan=${plan.id}&annual=${isAnnual}`}
                        className={cn(
                          'block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all mb-6',
                          plan.popular
                            ? 'bg-brand-gradient text-white hover:brightness-110 shadow-glow-brand'
                            : 'border border-border hover:border-brand-primary hover:text-brand-primary'
                        )}
                      >
                        {price === 0 ? 'Үнэгүй эхлэх' : 'Эхлэх'}
                      </Link>

                      <ul className="space-y-3">
                        {plan.features.map(f => (
                          <li key={f.text} className={cn('flex items-start gap-2.5 text-sm', !f.included && 'opacity-40')}>
                            {f.included
                              ? <div className="size-4 rounded-full bg-brand-success/15 flex items-center justify-center flex-shrink-0 mt-0.5"><Check size={10} className="text-brand-success" /></div>
                              : <div className="size-4 rounded-full bg-border flex items-center justify-center flex-shrink-0 mt-0.5"><X size={10} className="text-foreground-muted" /></div>
                            }
                            {f.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* QPay / payment note */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 p-6 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
            >
              <div className="text-4xl">💳</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Олон төлбөрийн хэлбэр дэмжигдэнэ</h4>
                <p className="text-sm text-foreground-muted">QPay, голомт карт, хаан карт, банкны шилжүүлэг болон нэхэмжлэхэр төлбөр хийх боломжтой.</p>
              </div>
              <div className="flex items-center gap-3">
                {['QPay', 'Голомт', 'Хаан', 'TDB'].map(bank => (
                  <div key={bank} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium">{bank}</div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Түгээмэл асуулт</h2>
              <p className="text-foreground-muted">Нэмэлт асуулт байвал бидэнтэй холбоо барина уу</p>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium pr-4">{faq.q}</span>
                    <HelpCircle size={18} className={cn('text-foreground-muted flex-shrink-0 transition-colors', openFaq === i && 'text-brand-primary')} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="px-5 pb-5 text-sm text-foreground-secondary"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="section-container text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Бэлэн үү? Одоо эхэлцгээе!</h2>
            <p className="text-foreground-muted mb-8 max-w-lg mx-auto">Үнэгүй бүртгүүлэн эхлэх боломжтой. Дараа нь хэрэгцээнийхээ дагуу тарифф дээшлүүлнэ үү.</p>
            <Link href="/auth/signup" className="btn-brand px-10 py-4 text-base">
              Үнэгүй эхлэх
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
