'use client'
// src/app/dashboard/business/listings/new/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Building2, MapPin, Phone, Globe, Clock,
  Image as ImageIcon, Camera, ChevronRight, Save, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'cat-1', slug: 'restaurants', nameMn: 'Ресторан', icon: '🍜' },
  { id: 'cat-2', slug: 'hotels', nameMn: 'Зочид буудал', icon: '🏨' },
  { id: 'cat-3', slug: 'camps', nameMn: 'Кемп & Амралт', icon: '⛺' },
  { id: 'cat-4', slug: 'shopping', nameMn: 'Дэлгүүр', icon: '🛍️' },
  { id: 'cat-5', slug: 'fitness', nameMn: 'Фитнэс & Спорт', icon: '💪' },
  { id: 'cat-6', slug: 'salons', nameMn: 'Салон & Гоо сайхан', icon: '💇' },
  { id: 'cat-7', slug: 'entertainment', nameMn: 'Цэнгэл & Тоглоом', icon: '🎮' },
  { id: 'cat-8', slug: 'medical', nameMn: 'Эрүүл мэнд', icon: '🏥' },
]

const DISTRICTS = [
  'Баянзүрх', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол', 'Хан-Уул',
  'Налайх', 'Багануур', 'Багахангай',
]

const AMENITIES = [
  'WiFi', 'Зогсоол', 'Хүргэлт', 'Захиалга', 'Карт хүлээн авдаг',
  'Гэр бүлд', 'Хүүхдийн газар', '24 цаг', 'Галт тэрэг', 'Такси',
  'Ресепшн', 'Хоол', 'Баар', 'Уулзалтын өрөө', 'Сауна',
]

const businessSchema = z.object({
  nameMn: z.string().min(2, 'Бизнесийн нэрийг оруулна уу').max(200),
  nameEn: z.string().max(200).optional(),
  categoryId: z.string().min(1, 'Ангиллыг сонгоно уу'),
  descriptionMn: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  taglineMn: z.string().max(300).optional(),
  district: z.string().optional(),
  city: z.string().default('Ulaanbaatar'),
  addressMn: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  phone2: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  whatsapp: z.string().max(30).optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  virtualTourUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
})

type BusinessForm = z.infer<typeof businessSchema>

const STEPS = [
  { id: 'basic', label: 'Үндсэн мэдээлэл', icon: Building2 },
  { id: 'contact', label: 'Холбоо барих', icon: Phone },
  { id: 'location', label: 'Байршил', icon: MapPin },
  { id: 'media', label: 'Зураг & Медиа', icon: ImageIcon },
  { id: 'hours', label: 'Цагийн хуваарь', icon: Clock },
]

const DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням']

export default function NewBusinessPage() {
  const [step, setStep] = useState(0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [hours, setHours] = useState(
    DAYS.map((day, i) => ({ day, dayOfWeek: i, openTime: '09:00', closeTime: '21:00', isClosed: i === 6, is24Hours: false }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: { city: 'Ulaanbaatar', tags: [], amenities: [] },
  })

  const selectedCategory = watch('categoryId')
  const priceRange = watch('priceRange')

  function toggleAmenity(a: string) {
    const next = selectedAmenities.includes(a)
      ? selectedAmenities.filter(x => x !== a)
      : [...selectedAmenities, a]
    setSelectedAmenities(next)
    setValue('amenities', next)
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const next = [...tags, tagInput.trim()]
      setTags(next)
      setValue('tags', next)
      setTagInput('')
    }
  }

  function removeTag(t: string) {
    const next = tags.filter(x => x !== t)
    setTags(next)
    setValue('tags', next)
  }

  async function nextStep() {
    const fieldsToValidate: (keyof BusinessForm)[][] = [
      ['nameMn', 'categoryId'],
      ['phone', 'email', 'website'],
      ['district', 'addressMn'],
      [],
      [],
    ]
    const valid = await trigger(fieldsToValidate[step])
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(data: BusinessForm) {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, amenities: selectedAmenities, tags }),
      })
      if (res.ok) {
        router.push('/dashboard/business/listings?success=created')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/business/listings"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-background-secondary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-bold">Шинэ бизнес нэмэх</h1>
            <p className="text-xs text-foreground-muted">Алхам {step + 1}/{STEPS.length}: {STEPS[step].label}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  i === step ? 'bg-brand-primary text-white' :
                  i < step ? 'bg-brand-success/15 text-brand-success cursor-pointer hover:bg-brand-success/25' :
                  'bg-background-tertiary text-foreground-muted'
                )}
              >
                <s.icon size={13} />
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-foreground-subtle flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <Building2 size={20} className="text-brand-primary" />
                  Үндсэн мэдээлэл
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Бизнесийн нэр (Монголоор) *</label>
                    <input {...register('nameMn')} placeholder="жнь: Монголын Элч Ресторан"
                      className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all', errors.nameMn ? 'border-brand-danger' : 'border-border')} />
                    {errors.nameMn && <p className="text-xs text-brand-danger mt-1">{errors.nameMn.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Business name (English) <span className="text-foreground-muted font-normal">— заавал биш</span></label>
                    <input {...register('nameEn')} placeholder="e.g. Mongolian Ambassador Restaurant"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Богино тайлбар / Тагланг</label>
                    <input {...register('taglineMn')} placeholder="жнь: Монгол хоолны уламжлалт амт"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Ангилал *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat.id} type="button"
                          onClick={() => setValue('categoryId', cat.id)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                            selectedCategory === cat.id
                              ? 'border-brand-primary bg-brand-primary/8 text-brand-primary'
                              : 'border-border hover:border-brand-primary/50'
                          )}
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          {cat.nameMn}
                        </button>
                      ))}
                    </div>
                    {errors.categoryId && <p className="text-xs text-brand-danger mt-2">{errors.categoryId.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Дэлгэрэнгүй тайлбар (Монголоор)</label>
                    <textarea {...register('descriptionMn')} rows={4}
                      placeholder="Бизнесийн тухай дэлгэрэнгүй мэдээлэл бичнэ үү..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all resize-none" />
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Тохиромж & Онцлог</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map(a => (
                        <button key={a} type="button" onClick={() => toggleAmenity(a)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                            selectedAmenities.includes(a)
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                              : 'border-border hover:border-brand-primary/50'
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Хайлтын түлхүүр үгс</label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background-secondary min-h-[48px]">
                      {tags.map(t => (
                        <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                          {t}
                          <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-brand-danger">×</button>
                        </span>
                      ))}
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                        placeholder={tags.length === 0 ? 'Бичиж Enter дарна уу...' : ''}
                        className="flex-1 min-w-[120px] bg-transparent text-xs focus:outline-none" />
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">Enter товч дарж нэмнэ</p>
                  </div>

                  {/* Price range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Үнийн дүр</label>
                    <div className="flex gap-2">
                      {(['$', '$$', '$$$', '$$$$'] as const).map(p => (
                        <button key={p} type="button" onClick={() => setValue('priceRange', p)}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all',
                            priceRange === p ? 'border-brand-success bg-brand-success/10 text-brand-success' : 'border-border hover:border-brand-success/50'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Contact */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <Phone size={20} className="text-brand-primary" />
                  Холбоо барих мэдээлэл
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'phone', label: 'Утасны дугаар', placeholder: '+976 9911-9911', type: 'tel' },
                    { name: 'phone2', label: 'Нэмэлт утас', placeholder: '+976 8888-8888', type: 'tel' },
                    { name: 'email', label: 'Имэйл хаяг', placeholder: 'info@business.mn', type: 'email' },
                    { name: 'website', label: 'Вэбсайт', placeholder: 'https://www.business.mn', type: 'url' },
                    { name: 'whatsapp', label: 'WhatsApp дугаар', placeholder: '+976 9911-9911', type: 'tel' },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                      <input {...register(field.name as keyof BusinessForm)} type={field.type} placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-border">
                  <h3 className="font-semibold text-sm mb-4">Сошиал хаяг</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { name: 'facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/yourbusiness' },
                      { name: 'instagram', label: '📷 Instagram', placeholder: 'https://instagram.com/yourbusiness' },
                      { name: 'youtube', label: '▶️ YouTube', placeholder: 'https://youtube.com/@yourbusiness' },
                      { name: 'virtualTourUrl', label: '360° Виртуал аялалын URL', placeholder: 'https://my.matterport.com/show/?m=...' },
                    ].map(field => (
                      <div key={field.name}>
                        <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                        <input {...register(field.name as keyof BusinessForm)} type="url" placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <MapPin size={20} className="text-brand-primary" />
                  Байршил
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Хот</label>
                      <select {...register('city')}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                        <option value="Ulaanbaatar">Улаанбаатар</option>
                        <option value="Erdenet">Эрдэнэт</option>
                        <option value="Darkhan">Дархан</option>
                        <option value="Choibalsan">Чойбалсан</option>
                        <option value="Olgii">Өлгий</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Дүүрэг / Хороо</label>
                      <select {...register('district')}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                        <option value="">Сонгоно уу</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Дэлгэрэнгүй хаяг (Монголоор)</label>
                    <input {...register('addressMn')} placeholder="жнь: Сүхбаатар дүүрэг, 1-р хороо, 12-р байр"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" />
                  </div>
                  <div className="p-4 rounded-xl border border-dashed border-border bg-background-secondary flex flex-col items-center gap-3 text-center">
                    <MapPin size={28} className="text-foreground-muted" />
                    <div>
                      <p className="font-medium text-sm mb-1">Газрын зурагт байршил тохируулах</p>
                      <p className="text-xs text-foreground-muted">Бизнесийн байршлыг газрын зурагт тухайлан тэмдэглэх боломжтой</p>
                    </div>
                    <button type="button" className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-card transition-colors">
                      Байршил сонгох
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Media */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <ImageIcon size={20} className="text-brand-primary" />
                  Зураг & Медиа
                </h2>
                {/* Cover image */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Нүүр зураг (Cover photo)</label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/3 transition-all">
                    <div className="size-14 rounded-xl bg-background-tertiary flex items-center justify-center">
                      <Camera size={24} className="text-foreground-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Зураг оруулах</p>
                      <p className="text-xs text-foreground-muted mt-1">PNG, JPG, WEBP — Хамгийн ихдээ 10MB</p>
                      <p className="text-xs text-foreground-muted">Зөвлөмж хэмжээ: 1200×630px</p>
                    </div>
                    <label className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-medium cursor-pointer hover:brightness-110 transition-all">
                      Зураг сонгох
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>
                {/* Gallery */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Зургийн галерей (Хамгийн ихдээ 20)</label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/3 transition-all">
                    <ImageIcon size={24} className="text-foreground-muted" />
                    <p className="text-sm font-medium">Олон зураг нэмэх</p>
                    <p className="text-xs text-foreground-muted">Зургийг чирж оруулах эсвэл сонгоно уу</p>
                    <label className="px-4 py-2 rounded-xl border border-border text-xs font-medium cursor-pointer hover:bg-background-secondary transition-all">
                      Зураг сонгох
                      <input type="file" accept="image/*" multiple className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Hours */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <Clock size={20} className="text-brand-primary" />
                  Ажиллах цаг
                </h2>
                <div className="space-y-3">
                  {hours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-16 flex-shrink-0">{h.day}</span>
                      {h.isClosed ? (
                        <span className="text-sm text-foreground-muted flex-1">Амардаг</span>
                      ) : h.is24Hours ? (
                        <span className="text-sm text-brand-success flex-1">24 цаг нээлттэй</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={h.openTime}
                            onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, openTime: e.target.value } : x))}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                          <span className="text-foreground-muted text-sm">—</span>
                          <input type="time" value={h.closeTime}
                            onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, closeTime: e.target.value } : x))}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-foreground-muted cursor-pointer">
                          <input type="checkbox" checked={h.isClosed}
                            onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, isClosed: e.target.checked, is24Hours: false } : x))}
                            className="rounded border-border" />
                          Амардаг
                        </label>
                        <label className="flex items-center gap-1 text-xs text-foreground-muted cursor-pointer">
                          <input type="checkbox" checked={h.is24Hours}
                            onChange={e => setHours(prev => prev.map((x, idx) => idx === i ? { ...x, is24Hours: e.target.checked, isClosed: false } : x))}
                            className="rounded border-border" />
                          24 цаг
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit notice */}
              <div className="p-4 rounded-xl bg-brand-warning/8 border border-brand-warning/30 flex items-start gap-3">
                <AlertCircle size={18} className="text-brand-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Бүртгэл шалгагдана</p>
                  <p className="text-foreground-muted">Бүртгэлийг илгээсний дараа манай баг 1-2 ажлын өдрийн дотор шалгаж, нийтэлнэ.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 gap-4">
            <button type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-background-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowLeft size={16} />
              Өмнөх
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
                Дараах
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-success text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60">
                <Save size={16} />
                {isSubmitting ? 'Хадгалж байна...' : 'Бүртгэл илгээх'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
