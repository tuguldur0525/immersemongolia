'use client'
// src/app/dashboard/business/payments/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CreditCard, Download, CheckCircle, Clock, XCircle, ArrowUpRight,
  Zap, Star, Crown, Building2, RefreshCw, QrCode, AlertCircle
} from 'lucide-react'
import { cn, formatPrice, formatDate } from '@/lib/utils'

const PLAN_BADGES: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  FREE: { label: 'Үнэгүй', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: Building2 },
  STARTER: { label: 'Эхлэгч', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Zap },
  PROFESSIONAL: { label: 'Мэргэжлийн', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', icon: Star },
  ENTERPRISE: { label: 'Корпорат', color: 'text-brand-accent', bg: 'bg-brand-accent/10', icon: Crown },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  PAID: { label: 'Төлсөн', color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
  PENDING: { label: 'Хүлээгдэж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: Clock },
  FAILED: { label: 'Амжилтгүй', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: XCircle },
  CANCELLED: { label: 'Цуцалсан', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: XCircle },
}

const MOCK_SUBSCRIPTION = {
  plan: 'PROFESSIONAL',
  status: 'ACTIVE',
  isAnnual: false,
  startDate: '2025-01-01',
  endDate: '2025-02-01',
  renewalDate: '2025-02-01',
  priceAtPurchase: 99000,
  autoRenew: true,
}

const MOCK_PAYMENTS = [
  { id: '1', invoiceNumber: 'NV-2501-A3X9K', method: 'QPAY', status: 'PAID', amount: 99000, description: 'Мэргэжлийн тарифф — Сарын', paidAt: '2025-01-01T10:00:00Z', createdAt: '2025-01-01T09:45:00Z' },
  { id: '2', invoiceNumber: 'NV-2412-B7Z2M', method: 'QPAY', status: 'PAID', amount: 99000, description: 'Мэргэжлийн тарифф — Сарын', paidAt: '2024-12-01T11:00:00Z', createdAt: '2024-12-01T10:30:00Z' },
  { id: '3', invoiceNumber: 'NV-2411-C5Y1N', method: 'BANK_TRANSFER', status: 'PAID', amount: 49000, description: 'Эхлэгч тарифф — Сарын', paidAt: '2024-11-01T09:00:00Z', createdAt: '2024-11-01T08:30:00Z' },
  { id: '4', invoiceNumber: 'NV-2502-D9W8P', method: 'QPAY', status: 'PENDING', amount: 99000, description: 'Мэргэжлийн тарифф — Сарын', paidAt: null, createdAt: '2025-02-01T08:00:00Z' },
]

const METHOD_LABELS: Record<string, string> = {
  QPAY: 'QPay',
  BANK_CARD: 'Банкны карт',
  BANK_TRANSFER: 'Банкны шилжүүлэг',
  INVOICE: 'Нэхэмжлэх',
}

export default function BusinessPaymentsPage() {
  const [showQPayModal, setShowQPayModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL')
  const [isAnnual, setIsAnnual] = useState(false)

  const planConfig = PLAN_BADGES[MOCK_SUBSCRIPTION.plan]
  const PlanIcon = planConfig.icon

  const daysLeft = Math.ceil(
    (new Date(MOCK_SUBSCRIPTION.endDate).getTime() - Date.now()) / 86400000
  )

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/business" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Төлбөр & Захиалга</span>
        </div>
        <h1 className="font-bold text-lg">Төлбөр & Захиалга</h1>
      </header>

      <main className="p-6 max-w-5xl space-y-6">
        {/* Current subscription card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="bg-brand-gradient p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <PlanIcon size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-lg">{planConfig.label} Тарифф</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  {MOCK_SUBSCRIPTION.isAnnual ? 'Жилийн' : 'Сарын'} захиалга •
                  ₮{(MOCK_SUBSCRIPTION.priceAtPurchase / 1000).toFixed(0)}K/{MOCK_SUBSCRIPTION.isAnnual ? 'жил' : 'сар'}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-2 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-white/90">Идэвхтэй — {daysLeft} хоног үлдсэн</span>
                </div>
              </div>
              <div className="text-right text-sm text-white/70 hidden sm:block">
                <p>Дуусах огноо</p>
                <p className="text-white font-semibold">{formatDate(MOCK_SUBSCRIPTION.endDate)}</p>
                {MOCK_SUBSCRIPTION.autoRenew && (
                  <p className="text-xs mt-1 flex items-center gap-1 justify-end">
                    <RefreshCw size={11} />
                    Автоматаар сунгагдана
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1.5">
                <span>{formatDate(MOCK_SUBSCRIPTION.startDate)}</span>
                <span>{formatDate(MOCK_SUBSCRIPTION.endDate)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(5, 100 - (daysLeft / 30) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 flex flex-wrap gap-3">
            <button
              onClick={() => setShowQPayModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
            >
              <RefreshCw size={15} />
              Сунгах / Шинэчлэх
            </button>
            <Link href="/pricing"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors">
              <ArrowUpRight size={15} />
              Тарифф дээшлүүлэх
            </Link>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-brand-danger hover:bg-brand-danger/8 hover:border-brand-danger transition-colors ml-auto">
              Цуцлах
            </button>
          </div>
        </motion.div>

        {/* Plan comparison */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Тарифф харьцуулах</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className={cn('font-medium', !isAnnual && 'text-brand-primary')}>Сарын</span>
              <button onClick={() => setIsAnnual(v => !v)}
                className={cn('relative w-11 h-6 rounded-full transition-colors', isAnnual ? 'bg-brand-primary' : 'bg-border')}>
                <div className={cn('absolute top-1 size-4 rounded-full bg-white shadow transition-transform', isAnnual ? 'translate-x-6' : 'translate-x-1')} />
              </button>
              <span className={cn('font-medium', isAnnual && 'text-brand-primary')}>
                Жилийн <span className="text-xs text-brand-success ml-1">-17%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(plan => {
              const prices: Record<string, { m: number; a: number }> = {
                STARTER: { m: 49000, a: 490000 },
                PROFESSIONAL: { m: 99000, a: 990000 },
                ENTERPRISE: { m: 199000, a: 1990000 },
              }
              const p = PLAN_BADGES[plan]
              const price = isAnnual ? prices[plan].a : prices[plan].m
              const Icon = p.icon
              const isCurrent = plan === MOCK_SUBSCRIPTION.plan

              return (
                <button key={plan} onClick={() => setSelectedPlan(plan)}
                  className={cn('p-4 rounded-2xl border-2 text-left transition-all',
                    isCurrent ? 'border-brand-primary bg-brand-primary/5' :
                    selectedPlan === plan ? 'border-brand-secondary bg-brand-secondary/5' :
                    'border-border hover:border-border-strong')}>
                  <div className={cn('size-9 rounded-xl flex items-center justify-center mb-3', p.bg)}>
                    <Icon size={16} className={p.color} />
                  </div>
                  <p className={cn('font-semibold text-sm mb-0.5', p.color)}>{p.label}</p>
                  <p className="text-xs text-foreground-muted mb-2">₮{(price / 1000).toFixed(0)}K/{isAnnual ? 'жил' : 'сар'}</p>
                  {isCurrent && <span className="text-[10px] font-medium text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full">Одоогийн</span>}
                </button>
              )
            })}

            {/* Custom */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-center">
              <AlertCircle size={20} className="text-foreground-muted" />
              <p className="text-xs font-medium">Гэрээт тарифф</p>
              <a href="mailto:sales@immersemongolia.mn" className="text-xs text-brand-primary hover:underline">Холбоо барих</a>
            </div>
          </div>
        </motion.div>

        {/* Payment history */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold">Төлбөрийн түүх</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background-secondary transition-colors">
              <Download size={13} />
              CSV татах
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary text-xs text-foreground-muted">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Нэхэмжлэх №</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Тайлбар</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Аргачлал</th>
                  <th className="text-left px-5 py-3 font-medium">Төлөв</th>
                  <th className="text-right px-5 py-3 font-medium">Дүн</th>
                  <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Огноо</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_PAYMENTS.map((payment, i) => {
                  const statusCfg = STATUS_CONFIG[payment.status]
                  const StatusIcon = statusCfg.icon
                  return (
                    <motion.tr key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                      className="hover:bg-background-secondary transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-medium">{payment.invoiceNumber}</td>
                      <td className="px-5 py-4 text-foreground-secondary text-xs hidden sm:table-cell max-w-[200px] truncate">{payment.description}</td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-secondary text-xs font-medium">
                          {payment.method === 'QPAY' ? '📱' : '🏦'}
                          {METHOD_LABELS[payment.method]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.bg, statusCfg.color)}>
                          <StatusIcon size={11} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        ₮{(payment.amount / 1000).toFixed(0)}K
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-foreground-muted hidden sm:table-cell">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {payment.status === 'PAID' && (
                          <button className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground ml-auto transition-colors">
                            <Download size={14} />
                          </button>
                        )}
                        {payment.status === 'PENDING' && (
                          <button onClick={() => setShowQPayModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20 transition-colors">
                            <QrCode size={13} />
                            Төлөх
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bank details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">Банкны дансны мэдээлэл</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Банкны нэр', value: 'Голомт банк' },
              { label: 'Данс эзэмшигч', value: 'НомадВью ХХК' },
              { label: 'Дансны дугаар', value: '1234567890' },
              { label: 'Гүйлгээний утга', value: 'Таны нэхэмжлэхийн дугаар' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-background-secondary">
                <span className="text-foreground-muted">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground-muted mt-3">
            * Гүйлгээний утганд заавал нэхэмжлэхийн дугаараа бичнэ үү. Шилжүүлснээс хойш 1-2 ажлын өдрийн дотор баталгаажна.
          </p>
        </motion.div>
      </main>

      {/* QPay Modal */}
      {showQPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQPayModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="size-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <QrCode size={28} className="text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-1">QPay-ээр төлөх</h3>
              <p className="text-sm text-foreground-muted">QR кодыг уншуулж төлбөр хийнэ үү</p>
            </div>

            {/* Fake QR */}
            <div className="w-48 h-48 rounded-2xl bg-background-secondary border-2 border-border flex items-center justify-center mx-auto mb-5">
              <div className="grid grid-cols-5 gap-1 p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={cn('size-6 rounded-sm', Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent')} />
                ))}
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-2xl font-bold">₮99,000</p>
              <p className="text-sm text-foreground-muted">Мэргэжлийн тарифф — Сарын</p>
            </div>

            <p className="text-xs text-center text-foreground-muted mb-5">
              QPay апп нээж QR кодыг уншуулна уу.<br />
              Төлбөр амжилттай болсон тохиолдолд автоматаар шинэчлэгдэнэ.
            </p>

            <button onClick={() => setShowQPayModal(false)}
              className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors">
              Хаах
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
