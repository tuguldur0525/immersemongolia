'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  Download,
  Loader2,
  QrCode,
  RefreshCw,
  Star,
  XCircle,
  Zap,
} from 'lucide-react'
import BusinessDashboardShell from '@/components/dashboard/business/BusinessDashboardShell'
import { cn, formatDate, formatInteger, formatPrice } from '@/lib/utils'

type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
type PaymentMethod = 'QPAY' | 'BANK_CARD' | 'BANK_TRANSFER' | 'INVOICE'

type Payment = {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  description: string | null
  invoiceNumber: string | null
  qpayQrCode: string | null
  paidAt: string | null
  createdAt: string
  subscription: {
    plan: SubscriptionPlan
    isAnnual: boolean
    startDate: string
    endDate: string
  } | null
}

type CurrentSubscription = {
  id: string
  businessId: string | null
  plan: SubscriptionPlan
  status: string
  isAnnual: boolean
  startDate: string
  endDate: string
  renewalDate: string | null
  cancelledAt: string | null
  autoRenew: boolean
  priceAtPurchase: number
  currency: string
} | null

type PaymentData = {
  payments: Payment[]
  currentSubscription: CurrentSubscription
  businesses: Array<{ id: string; slug: string; name: string }>
  bankDetails: { bankName: string; accountName: string; accountNumber: string }
  total: number
}

type PaymentResult = {
  payment: {
    amount: number | string
    invoiceNumber: string | null
  }
  qpay?: {
    qrCode?: string | null
    urls?: Array<{ name: string; link: string }>
  } | null
  bankDetails?: {
    bankName: string
    accountName: string
    accountNumber?: string | null
    reference: string
  } | null
}

type PlanConfig = {
  plan: SubscriptionPlan
  nameMn: string
  descriptionMn: string | null
  monthlyPriceMnt: number
  annualPriceMnt: number
  maxPhotos: number
  maxListings: number
  hasAnalytics: boolean
  hasVirtualTour: boolean
  hasPrioritySupport: boolean
  isFeatured: boolean
}

const PLAN_BADGES: Record<SubscriptionPlan, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  FREE: { label: 'Үнэгүй', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: Building2 },
  STARTER: { label: 'Эхлэгч', color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Zap },
  PROFESSIONAL: { label: 'Мэргэжлийн', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', icon: Star },
  ENTERPRISE: { label: 'Корпорат', color: 'text-brand-accent', bg: 'bg-brand-accent/10', icon: Crown },
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  PAID: { label: 'Төлсөн', color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
  PENDING: { label: 'Хүлээгдэж байна', color: 'text-brand-warning', bg: 'bg-brand-warning/10', icon: Clock },
  FAILED: { label: 'Амжилтгүй', color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: XCircle },
  REFUNDED: { label: 'Буцаасан', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', icon: RefreshCw },
  CANCELLED: { label: 'Цуцалсан', color: 'text-foreground-muted', bg: 'bg-background-tertiary', icon: XCircle },
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  QPAY: 'QPay',
  BANK_CARD: 'Банкны карт',
  BANK_TRANSFER: 'Банкны шилжүүлэг',
  INVOICE: 'Нэхэмжлэх',
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback
  return typeof payload.error === 'string' ? payload.error : fallback
}

function downloadPaymentsCsv(payments: Payment[]) {
  const rows = [
    ['invoice_number', 'status', 'method', 'amount', 'currency', 'paid_at', 'created_at'],
    ...payments.map((payment) => [
      payment.invoiceNumber || payment.id,
      payment.status,
      payment.method,
      payment.amount,
      payment.currency,
      payment.paidAt || '',
      payment.createdAt,
    ]),
  ]
  const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'business-payments.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function downloadReceipt(payment: Payment) {
  const content = [
    'Immerse Mongolia payment receipt',
    `Invoice: ${payment.invoiceNumber || payment.id}`,
    `Status: ${payment.status}`,
    `Method: ${METHOD_LABELS[payment.method]}`,
    `Amount: ${payment.amount} ${payment.currency}`,
    `Date: ${payment.paidAt || payment.createdAt}`,
    `Description: ${payment.description || ''}`,
  ].join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${payment.invoiceNumber || payment.id}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

export default function BusinessPaymentsPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('PROFESSIONAL')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('QPAY')
  const [isAnnual, setIsAnnual] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<PaymentData>({
    queryKey: ['business-payments'],
    queryFn: async () => {
      const res = await fetch('/api/payments', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Төлбөрийн мэдээлэл ачаалж чадсангүй'))
      return payload.data
    },
    staleTime: 30_000,
  })

  const { data: plans = [] } = useQuery<PlanConfig[]>({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/plans', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Тарифф ачаалж чадсангүй'))
      return payload.data
    },
    staleTime: 300_000,
  })

  const currentSubscription = data?.currentSubscription ?? null
  const activePlan = currentSubscription?.plan ?? 'FREE'
  const planConfig = PLAN_BADGES[activePlan]
  const PlanIcon = planConfig.icon
  const daysLeft = currentSubscription
    ? Math.max(0, Math.ceil((new Date(currentSubscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0
  const periodProgress = useMemo(() => {
    if (!currentSubscription) return 0
    const start = new Date(currentSubscription.startDate).getTime()
    const end = new Date(currentSubscription.endDate).getTime()
    if (end <= start) return 100
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100))
  }, [currentSubscription])

  const paidPlans = plans.filter((plan) => plan.plan !== 'FREE')
  const selectedPlanConfig = paidPlans.find((plan) => plan.plan === selectedPlan)
  const selectedPrice = selectedPlanConfig
    ? isAnnual ? selectedPlanConfig.annualPriceMnt : selectedPlanConfig.monthlyPriceMnt
    : 0

  async function createPayment() {
    setIsCreating(true)
    setErrorMessage('')
    setPaymentResult(null)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          isAnnual,
          method,
          businessId: selectedBusinessId || data?.businesses[0]?.id,
        }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Төлбөр үүсгэхэд алдаа гарлаа'))
      setPaymentResult(payload.data)
      queryClient.invalidateQueries({ queryKey: ['business-payments'] })
      queryClient.invalidateQueries({ queryKey: ['business-dashboard'] })
    } catch (paymentError) {
      setErrorMessage(paymentError instanceof Error ? paymentError.message : 'Төлбөр үүсгэхэд алдаа гарлаа')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <BusinessDashboardShell
      title="Төлбөр & Захиалга"
      subtitle="Тарифф сонгох, QPay төлбөр үүсгэх, төлбөрийн түүх татах"
      breadcrumbs={[{ label: 'Хяналтын самбар', href: '/dashboard/business' }, { label: 'Төлбөр & Захиалга' }]}
    >
      <div className="space-y-6 max-w-7xl">
        {(error || errorMessage) && (
          <div className="rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger flex items-start gap-3">
            <AlertCircle size={17} />
            <span>{errorMessage || 'Төлбөрийн мэдээлэл ачаалж чадсангүй.'}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="bg-brand-gradient p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <PlanIcon size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-lg">{planConfig.label} тарифф</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  {isLoading
                    ? 'Ачаалж байна...'
                    : currentSubscription
                      ? `${currentSubscription.isAnnual ? 'Жилийн' : 'Сарын'} захиалга - ${formatPrice(currentSubscription.priceAtPurchase, currentSubscription.currency)}`
                      : 'Идэвхтэй төлбөртэй захиалга алга'}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn('size-2 rounded-full', currentSubscription ? 'bg-green-300 animate-pulse' : 'bg-white/50')} />
                  <span className="text-white/90">
                    {currentSubscription ? `${currentSubscription.status} - ${daysLeft} хоног үлдсэн` : 'FREE plan идэвхтэй'}
                  </span>
                </div>
              </div>
              {currentSubscription && (
                <div className="text-right text-sm text-white/70 hidden sm:block">
                  <p>Дуусах огноо</p>
                  <p className="text-white font-semibold">{formatDate(currentSubscription.endDate)}</p>
                  {currentSubscription.autoRenew && (
                    <p className="text-xs mt-1 flex items-center gap-1 justify-end">
                      <RefreshCw size={11} />
                      Автоматаар сунгагдана
                    </p>
                  )}
                </div>
              )}
            </div>

            {currentSubscription && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>{formatDate(currentSubscription.startDate)}</span>
                  <span>{formatDate(currentSubscription.endDate)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${periodProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors">
              <ArrowUpRight size={15} />
              Тариффууд харах
            </Link>
            <button
              onClick={() => downloadPaymentsCsv(data?.payments ?? [])}
              disabled={!data?.payments.length}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors disabled:opacity-50"
            >
              <Download size={15} />
              CSV татах
            </button>
          </div>
        </motion.div>

        <div className="grid xl:grid-cols-[1fr_360px] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="font-bold">Тарифф сонгох</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className={cn('font-medium', !isAnnual && 'text-brand-primary')}>Сарын</span>
                <button
                  onClick={() => setIsAnnual((value) => !value)}
                  className={cn('relative w-11 h-6 rounded-full transition-colors', isAnnual ? 'bg-brand-primary' : 'bg-border')}
                >
                  <div className={cn('absolute top-1 size-4 rounded-full bg-white shadow transition-transform', isAnnual ? 'translate-x-6' : 'translate-x-1')} />
                </button>
                <span className={cn('font-medium', isAnnual && 'text-brand-primary')}>
                  Жилийн <span className="text-xs text-brand-success ml-1">-17%</span>
                </span>
              </div>
            </div>

            {paidPlans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground-muted">
                Тариффын тохиргоо DB-д хараахан бүртгэгдээгүй байна.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                {paidPlans.map((plan) => {
                  const badge = PLAN_BADGES[plan.plan]
                  const Icon = badge.icon
                  const price = isAnnual ? plan.annualPriceMnt : plan.monthlyPriceMnt
                  const isCurrent = plan.plan === activePlan
                  const isSelected = plan.plan === selectedPlan

                  return (
                    <button
                      key={plan.plan}
                      onClick={() => setSelectedPlan(plan.plan)}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all',
                        isCurrent ? 'border-brand-primary bg-brand-primary/5' :
                        isSelected ? 'border-brand-secondary bg-brand-secondary/5' :
                        'border-border hover:border-border-strong'
                      )}
                    >
                      <div className={cn('size-9 rounded-xl flex items-center justify-center mb-3', badge.bg)}>
                        <Icon size={16} className={badge.color} />
                      </div>
                      <p className={cn('font-semibold text-sm mb-0.5', badge.color)}>{plan.nameMn}</p>
                      <p className="text-xs text-foreground-muted mb-2">{formatPrice(price)} / {isAnnual ? 'жил' : 'сар'}</p>
                      <div className="text-[11px] text-foreground-muted space-y-1">
                        <p>{formatInteger(plan.maxListings)} бизнес</p>
                        <p>{plan.maxPhotos >= 999 ? 'Хязгааргүй зураг' : `${formatInteger(plan.maxPhotos)} зураг`}</p>
                        <p>{plan.hasVirtualTour ? '360° аялалтай' : '360° аялалгүй'}</p>
                      </div>
                      {isCurrent && <span className="inline-flex mt-3 text-[10px] font-medium text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full">Одоогийн</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>

          <aside className="bg-card rounded-2xl border border-border p-5 h-fit">
            <h3 className="font-semibold mb-4">Төлбөр үүсгэх</h3>
            <div className="space-y-4">
              {data && data.businesses.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Бизнес</label>
                  <select
                    value={selectedBusinessId || data.businesses[0]?.id || ''}
                    onChange={(event) => setSelectedBusinessId(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    {data.businesses.map((business) => (
                      <option key={business.id} value={business.id}>{business.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Төлбөрийн арга</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['QPAY', 'BANK_TRANSFER'] as PaymentMethod[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setMethod(item)}
                      className={cn(
                        'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                        method === item ? 'border-brand-primary bg-brand-primary/8 text-brand-primary' : 'border-border hover:border-brand-primary/40'
                      )}
                    >
                      {METHOD_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-background-secondary border border-border p-4">
                <p className="text-xs text-foreground-muted mb-1">Сонгосон төлбөр</p>
                <p className="text-2xl font-bold">{selectedPrice ? formatPrice(selectedPrice) : '-'}</p>
                <p className="text-xs text-foreground-muted mt-1">{selectedPlan} - {isAnnual ? 'Жилийн' : 'Сарын'}</p>
              </div>

              <button
                onClick={createPayment}
                disabled={isCreating || paidPlans.length === 0 || !data?.businesses.length}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : method === 'QPAY' ? <QrCode size={16} /> : <CreditCard size={16} />}
                {isCreating ? 'Үүсгэж байна...' : method === 'QPAY' ? 'QPay үүсгэх' : 'Нэхэмжлэх үүсгэх'}
              </button>
            </div>
          </aside>
        </div>

        {paymentResult && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <QrCode size={20} className="text-brand-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold mb-1">Төлбөр үүссэн</h2>
                <p className="text-sm text-foreground-muted mb-4">
                  {method === 'QPAY' ? 'QR кодоо уншуулж төлбөрөө баталгаажуулна уу.' : 'Банкны шилжүүлгээр төлөхдөө reference утгаа заавал бичнэ үү.'}
                </p>

                {paymentResult.qpay && (
                  <div className="grid md:grid-cols-[220px_1fr] gap-5">
                    <div className="rounded-2xl border border-border bg-background-secondary p-4 flex items-center justify-center">
                      {paymentResult.qpay.qrCode ? (
                        <img src={paymentResult.qpay.qrCode} alt="QPay QR" className="w-44 h-44 object-contain" />
                      ) : (
                        <QrCode size={80} className="text-foreground-muted" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-2xl font-bold">{formatPrice(Number(paymentResult.payment.amount))}</p>
                      <p className="text-sm text-foreground-muted">{paymentResult.payment.invoiceNumber}</p>
                      {(paymentResult.qpay.urls?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {paymentResult.qpay.urls?.map((item) => (
                            <a key={item.name} href={item.link} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20">
                              {item.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentResult.bankDetails && (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Банк', value: paymentResult.bankDetails.bankName },
                      { label: 'Данс эзэмшигч', value: paymentResult.bankDetails.accountName },
                      { label: 'Дансны дугаар', value: paymentResult.bankDetails.accountNumber || 'Тохируулаагүй' },
                      { label: 'Гүйлгээний утга', value: paymentResult.bankDetails.reference },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background-secondary">
                        <span className="text-foreground-muted">{item.label}</span>
                        <span className="font-medium text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold">Төлбөрийн түүх</h2>
            <button
              onClick={() => downloadPaymentsCsv(data?.payments ?? [])}
              disabled={!data?.payments.length}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background-secondary transition-colors disabled:opacity-50"
            >
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
                {(data?.payments ?? []).map((payment, index) => {
                  const statusCfg = STATUS_CONFIG[payment.status]
                  const StatusIcon = statusCfg.icon
                  return (
                    <motion.tr key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-background-secondary transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-medium">{payment.invoiceNumber || payment.id.slice(0, 8)}</td>
                      <td className="px-5 py-4 text-foreground-secondary text-xs hidden sm:table-cell max-w-[240px] truncate">{payment.description || payment.subscription?.plan || '-'}</td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-secondary text-xs font-medium">
                          {METHOD_LABELS[payment.method]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusCfg.bg, statusCfg.color)}>
                          <StatusIcon size={11} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">{formatPrice(payment.amount, payment.currency)}</td>
                      <td className="px-5 py-4 text-right text-xs text-foreground-muted hidden sm:table-cell">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => downloadReceipt(payment)}
                          className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground ml-auto transition-colors"
                          title="Баримт татах"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>

            {isLoading && <div className="py-14 text-center text-sm text-foreground-muted">Ачаалж байна...</div>}
            {!isLoading && (data?.payments ?? []).length === 0 && (
              <div className="py-14 text-center text-sm text-foreground-muted">Төлбөрийн түүх хараахан байхгүй байна.</div>
            )}
          </div>
        </motion.div>

        {data?.bankDetails && (
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">Банкны дансны мэдээлэл</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Банкны нэр', value: data.bankDetails.bankName },
                { label: 'Данс эзэмшигч', value: data.bankDetails.accountName },
                { label: 'Дансны дугаар', value: data.bankDetails.accountNumber || 'Тохируулаагүй' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-background-secondary">
                  <span className="text-foreground-muted">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BusinessDashboardShell>
  )
}
