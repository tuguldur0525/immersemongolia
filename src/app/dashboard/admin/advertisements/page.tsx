'use client'
// src/app/dashboard/admin/advertisements/page.tsx
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Calendar,
  Edit3,
  Eye,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { cn, formatDate, formatInteger, formatPrice } from '@/lib/utils'

const AD_TYPES = {
  BANNER: { label: 'Баннер', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  FEATURED_LISTING: { label: 'Онцлох листинг', color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  CATEGORY_SPONSOR: { label: 'Ангиллын sponsor', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
  MAP_PIN: { label: 'Map pin', color: 'text-brand-success', bg: 'bg-brand-success/10' },
}

type AdType = keyof typeof AD_TYPES
type TypeFilter = 'ALL' | AdType
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

type Advertisement = {
  id: string
  businessId: string
  type: AdType
  titleMn: string
  titleEn: string | null
  imageUrl: string | null
  targetUrl: string | null
  targetCategory: string | null
  budget: number | null
  cpmRate: number | null
  impressions: number
  clicks: number
  spend: number
  ctr: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  business: { id: string; slug: string; name: string; category: string; categoryIcon: string | null }
}

type BusinessOption = {
  id: string
  name: string
  slug: string
  category: string
  categoryIcon: string | null
}

type AdsData = {
  advertisements: Advertisement[]
  businesses: BusinessOption[]
  total: number
  typeCounts: Partial<Record<AdType, number>>
  statusCounts: Partial<Record<'ACTIVE' | 'INACTIVE', number>>
  summary: { impressions: number; clicks: number; spend: number; ctr: number }
}

type AdForm = {
  businessId: string
  type: AdType
  titleMn: string
  titleEn: string
  imageUrl: string
  targetUrl: string
  targetCategory: string
  budget: string
  cpmRate: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

const EMPTY_FORM: AdForm = {
  businessId: '',
  type: 'BANNER',
  titleMn: '',
  titleEn: '',
  imageUrl: '',
  targetUrl: '',
  targetCategory: '',
  budget: '',
  cpmRate: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function buildPayload(form: AdForm) {
  return {
    ...form,
    budget: form.budget,
    cpmRate: form.cpmRate,
  }
}

function getScheduleLabel(ad: Advertisement) {
  const now = Date.now()
  const startsAt = ad.startsAt ? new Date(ad.startsAt).getTime() : null
  const endsAt = ad.endsAt ? new Date(ad.endsAt).getTime() : null

  if (!ad.isActive) return { label: 'Зогсоосон', color: 'text-foreground-muted', bg: 'bg-background-tertiary' }
  if (startsAt && startsAt > now) return { label: 'Төлөвлөгдсөн', color: 'text-brand-warning', bg: 'bg-brand-warning/10' }
  if (endsAt && endsAt < now) return { label: 'Дууссан', color: 'text-foreground-muted', bg: 'bg-background-tertiary' }
  return { label: 'Идэвхтэй', color: 'text-brand-success', bg: 'bg-brand-success/10' }
}

export default function AdminAdvertisementsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdForm>(EMPTY_FORM)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdsData>({
    queryKey: ['admin-advertisements', search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        limit: '100',
      })
      if (search.trim()) params.set('query', search.trim())

      const res = await fetch(`/api/admin/advertisements?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Зар сурталчилгааг ачаалж чадсангүй')
      }
      return payload.data
    },
    staleTime: 20_000,
  })

  const saveAdMutation = useMutation({
    mutationFn: async () => {
      const url = editingId ? `/api/admin/advertisements/${editingId}` : '/api/admin/advertisements'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Зар сурталчилгаа хадгалахад алдаа гарлаа')
      }
      return payload.data
    },
    onMutate: () => setActionError(''),
    onSuccess: () => {
      setForm(EMPTY_FORM)
      setEditingId(null)
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
    },
    onError: (mutationError) => {
      setActionError(mutationError instanceof Error ? mutationError.message : 'Үйлдэл амжилтгүй боллоо')
    },
  })

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Pick<Advertisement, 'isActive'>> }) => {
      const res = await fetch(`/api/admin/advertisements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responsePayload = await res.json().catch(() => null)
      if (!res.ok || !responsePayload?.success) {
        throw new Error(responsePayload?.error || 'Зар сурталчилгаа шинэчлэхэд алдаа гарлаа')
      }
      return responsePayload.data
    },
    onMutate: () => setActionError(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] }),
    onError: (mutationError) => setActionError(mutationError instanceof Error ? mutationError.message : 'Үйлдэл амжилтгүй боллоо'),
  })

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Зар сурталчилгаа устгахад алдаа гарлаа')
      }
    },
    onMutate: () => setActionError(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] }),
    onError: (mutationError) => setActionError(mutationError instanceof Error ? mutationError.message : 'Үйлдэл амжилтгүй боллоо'),
  })

  const ads = data?.advertisements ?? []
  const businesses = data?.businesses ?? []
  const typeTabs = [
    { value: 'ALL' as const, label: 'Бүгд', count: data?.total ?? 0 },
    ...Object.entries(AD_TYPES).map(([value, config]) => ({
      value: value as AdType,
      label: config.label,
      count: data?.typeCounts[value as AdType] ?? 0,
    })),
  ]
  const statusTabs: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'ALL', label: 'Бүх төлөв', count: data?.total ?? 0 },
    { value: 'ACTIVE', label: 'Идэвхтэй', count: data?.statusCounts.ACTIVE ?? 0 },
    { value: 'INACTIVE', label: 'Зогсоосон', count: data?.statusCounts.INACTIVE ?? 0 },
  ]

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, businessId: businesses[0]?.id ?? '' })
    setFormOpen(true)
    setActionError('')
  }

  function openEditForm(ad: Advertisement) {
    setEditingId(ad.id)
    setForm({
      businessId: ad.businessId,
      type: ad.type,
      titleMn: ad.titleMn,
      titleEn: ad.titleEn ?? '',
      imageUrl: ad.imageUrl ?? '',
      targetUrl: ad.targetUrl ?? '',
      targetCategory: ad.targetCategory ?? '',
      budget: ad.budget?.toString() ?? '',
      cpmRate: ad.cpmRate?.toString() ?? '',
      startsAt: toDateInputValue(ad.startsAt),
      endsAt: toDateInputValue(ad.endsAt),
      isActive: ad.isActive,
    })
    setFormOpen(true)
    setActionError('')
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(false)
    setActionError('')
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveAdMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Зар сурталчилгаа</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-bold text-lg">Зар сурталчилгааны удирдлага</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Зар, бизнес хайх..."
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <button onClick={openCreateForm} className="btn-brand py-2 text-sm">
              <Plus size={15} />
              Шинэ зар
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Impression', value: isLoading ? '...' : formatInteger(data?.summary.impressions ?? 0), icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Click', value: isLoading ? '...' : formatInteger(data?.summary.clicks ?? 0), icon: MousePointerClick, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
            { label: 'CTR', value: isLoading ? '...' : `${(data?.summary.ctr ?? 0).toFixed(2)}%`, icon: Activity, color: 'text-brand-success', bg: 'bg-brand-success/10' },
            { label: 'Зарцуулагдсан', value: isLoading ? '...' : formatPrice(data?.summary.spend ?? 0), icon: Megaphone, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className={cn('size-10 rounded-xl flex items-center justify-center mb-4', stat.bg)}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {actionError && (
          <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/8 px-4 py-3 text-sm text-brand-danger">
            {actionError}
          </div>
        )}

        {formOpen && (
          <motion.form
            onSubmit={submitForm}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="font-semibold">{editingId ? 'Зар засах' : 'Шинэ зар үүсгэх'}</h2>
              <button type="button" onClick={closeForm} className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center text-foreground-muted">
                <X size={16} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">Бизнес</span>
                <select
                  required
                  value={form.businessId}
                  onChange={(event) => setForm((current) => ({ ...current, businessId: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                >
                  <option value="" disabled>Сонгох</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">Төрөл</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AdType }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                >
                  {Object.entries(AD_TYPES).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-foreground-muted">Гарчиг</span>
                <input
                  required
                  value={form.titleMn}
                  onChange={(event) => setForm((current) => ({ ...current, titleMn: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                  placeholder="Жишээ: Зуны тусгай санал"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-foreground-muted">Зургийн URL</span>
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-foreground-muted">Target URL</span>
                <input
                  value={form.targetUrl}
                  onChange={(event) => setForm((current) => ({ ...current, targetUrl: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                  placeholder="/business/slug эсвэл https://..."
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">Төсөв</span>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                  placeholder="500000"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">CPM</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cpmRate}
                  onChange={(event) => setForm((current) => ({ ...current, cpmRate: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                  placeholder="1200"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">Эхлэх</span>
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted">Дуусах</span>
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                  className="w-full rounded-xl border-border bg-background-secondary text-sm focus:ring-brand-primary"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-5 border-t border-border">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="rounded border-border text-brand-primary focus:ring-brand-primary"
                />
                Идэвхтэй
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary">
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={saveAdMutation.isPending || !form.businessId}
                  className="btn-brand py-2 text-sm disabled:opacity-60"
                >
                  {saveAdMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                  {editingId ? 'Хадгалах' : 'Үүсгэх'}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 flex-wrap">
            {typeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={cn('px-4 py-2 rounded-full border text-sm font-medium transition-all',
                  typeFilter === tab.value ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary hover:text-brand-primary')}
              >
                {tab.label}
                <span className={cn('ml-2 text-xs', typeFilter === tab.value ? 'text-white/80' : 'text-foreground-muted')}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1 w-fit">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  statusFilter === tab.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-4">
          {ads.map((ad, index) => {
            const typeCfg = AD_TYPES[ad.type]
            const schedule = getScheduleLabel(ad)
            return (
              <motion.article
                key={ad.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="size-20 rounded-xl bg-background-secondary border border-border overflow-hidden flex-shrink-0">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-foreground-muted">
                          <ImageIcon size={22} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', typeCfg.bg, typeCfg.color)}>
                          {typeCfg.label}
                        </span>
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', schedule.bg, schedule.color)}>
                          {schedule.label}
                        </span>
                      </div>
                      <h2 className="font-semibold truncate">{ad.titleMn}</h2>
                      <Link href={`/business/${ad.business.slug}`} target="_blank" className="text-sm text-foreground-muted hover:text-brand-primary">
                        {ad.business.categoryIcon || '•'} {ad.business.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateAdMutation.mutate({ id: ad.id, payload: { isActive: !ad.isActive } })}
                        className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center text-foreground-muted hover:text-brand-primary"
                        title={ad.isActive ? 'Зогсоох' : 'Идэвхжүүлэх'}
                      >
                        {ad.isActive ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                      </button>
                      <button onClick={() => openEditForm(ad)} className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center text-foreground-muted hover:text-foreground">
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Энэ зарыг устгах уу?')) deleteAdMutation.mutate(ad.id)
                        }}
                        className="size-8 rounded-lg hover:bg-brand-danger/8 flex items-center justify-center text-foreground-muted hover:text-brand-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-5">
                    {[
                      { label: 'Impression', value: formatInteger(ad.impressions) },
                      { label: 'Click', value: formatInteger(ad.clicks) },
                      { label: 'CTR', value: `${ad.ctr.toFixed(2)}%` },
                      { label: 'Spend', value: formatPrice(ad.spend) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-background-secondary p-3">
                        <p className="font-bold text-sm">{item.value}</p>
                        <p className="text-[11px] text-foreground-muted">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-foreground-muted">
                    {ad.budget !== null && <span>Төсөв: {formatPrice(ad.budget)}</span>}
                    {ad.cpmRate !== null && <span>CPM: {formatPrice(ad.cpmRate)}</span>}
                    {ad.startsAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(ad.startsAt)}
                        {ad.endsAt ? ` - ${formatDate(ad.endsAt)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>

        {(isLoading || error || ads.length === 0) && (
          <div className="bg-card rounded-2xl border border-border py-20 text-center">
            {isLoading ? (
              <Loader2 size={36} className="text-foreground-muted mx-auto mb-3 animate-spin" />
            ) : (
              <Megaphone size={36} className="text-foreground-subtle mx-auto mb-3" />
            )}
            <p className="font-medium">
              {isLoading ? 'Зар сурталчилгаа ачаалж байна...' : error ? 'Зар сурталчилгаа ачаалж чадсангүй' : 'Зар сурталчилгаа олдсонгүй'}
            </p>
            {!isLoading && !error && (
              <button onClick={openCreateForm} className="btn-brand mt-4 inline-flex">
                <Plus size={16} />
                Шинэ зар үүсгэх
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
