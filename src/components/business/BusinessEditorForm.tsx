'use client'

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Save,
  Search,
  Star,
} from 'lucide-react'
import {
  buildGoogleMapsCoordinateUrl,
  isGoogleMapsLink,
  parseGoogleMapsCoordinates,
} from '@/lib/maps/googleMaps'
import { cn } from '@/lib/utils'

type BusinessStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'CLAIMED'
type UserRole = 'USER' | 'BUSINESS_OWNER' | 'ADMIN' | 'SUPER_ADMIN'

type CategoryOption = {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  icon: string | null
  color: string | null
  children?: CategoryOption[]
}

type EditableBusiness = {
  id: string
  slug: string
  ownerId: string | null
  categoryId: string
  status: BusinessStatus
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  nameMn: string
  nameEn: string | null
  descriptionMn: string | null
  descriptionEn: string | null
  taglineMn: string | null
  taglineEn: string | null
  addressMn: string | null
  addressEn: string | null
  district: string | null
  city: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  phone2: string | null
  email: string | null
  website: string | null
  whatsapp: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  youtube: string | null
  tiktok: string | null
  priceRange: '$' | '$$' | '$$$' | '$$$$' | null
  tags: string[]
  amenities: string[]
  logoUrl: string | null
  coverImageUrl: string | null
  virtualTourUrl: string | null
  virtualTourType: string | null
  owner: { email: string; displayName: string | null; firstName: string | null; lastName: string | null } | null
}

type CurrentUser = {
  id: string
  email: string
  role: UserRole
}

type Props = {
  mode: 'create' | 'edit'
  businessId?: string
  backHref: string
  successHref: string
  adminContext?: boolean
}

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalString = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional())

const optionalEmail = z.preprocess(blankToUndefined, z.string().trim().email().optional())
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url().optional())
const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional())

const businessFormSchema = z.object({
  ownerEmail: optionalEmail,
  nameMn: z.string().trim().min(2, 'Бизнесийн нэрийг оруулна уу').max(200),
  nameEn: optionalString(200),
  descriptionMn: optionalString(5000),
  descriptionEn: optionalString(5000),
  taglineMn: optionalString(300),
  taglineEn: optionalString(300),
  categoryId: z.string().uuid('Ангиллыг сонгоно уу'),
  district: optionalString(100),
  city: z.string().trim().min(1).max(100).default('Ulaanbaatar'),
  addressMn: optionalString(500),
  addressEn: optionalString(500),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  phone: optionalString(20),
  phone2: optionalString(20),
  email: optionalEmail,
  website: optionalUrl,
  whatsapp: optionalString(30),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalUrl,
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  virtualTourUrl: optionalUrl,
  virtualTourType: optionalString(40),
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'CLAIMED']).optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
})

type BusinessFormValues = z.infer<typeof businessFormSchema>

const AMENITIES = [
  'WiFi',
  'Зогсоол',
  'Хүргэлт',
  'Захиалга',
  'Карт хүлээн авдаг',
  'Гэр бүлд',
  'Хүүхдийн газар',
  '24 цаг',
  'Баар',
  'Уулзалтын өрөө',
  'Сауна',
]

const STATUS_OPTIONS: Array<{ value: BusinessStatus; label: string }> = [
  { value: 'PENDING_REVIEW', label: 'Хүлээгдэж байна' },
  { value: 'ACTIVE', label: 'Идэвхтэй' },
  { value: 'SUSPENDED', label: 'Түдгэлзүүлсэн' },
  { value: 'CLOSED', label: 'Хаасан' },
  { value: 'CLAIMED', label: 'Эзэмшилтэй' },
]

const emptyDefaults: BusinessFormValues = {
  ownerEmail: undefined,
  nameMn: '',
  nameEn: undefined,
  descriptionMn: undefined,
  descriptionEn: undefined,
  taglineMn: undefined,
  taglineEn: undefined,
  categoryId: '',
  district: undefined,
  city: 'Ulaanbaatar',
  addressMn: undefined,
  addressEn: undefined,
  latitude: undefined,
  longitude: undefined,
  phone: undefined,
  phone2: undefined,
  email: undefined,
  website: undefined,
  whatsapp: undefined,
  priceRange: undefined,
  facebook: undefined,
  instagram: undefined,
  twitter: undefined,
  youtube: undefined,
  tiktok: undefined,
  logoUrl: undefined,
  coverImageUrl: undefined,
  virtualTourUrl: undefined,
  virtualTourType: undefined,
  tags: [],
  amenities: [],
  status: 'PENDING_REVIEW',
  isVerified: false,
  isFeatured: false,
  isPremium: false,
}

function flattenCategories(categories: CategoryOption[]) {
  return categories.flatMap((category) => [
    category,
    ...(category.children ?? []),
  ])
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback
  return typeof payload.error === 'string' ? payload.error : fallback
}

function businessToDefaults(business: EditableBusiness): BusinessFormValues {
  return {
    ownerEmail: business.owner?.email,
    nameMn: business.nameMn,
    nameEn: business.nameEn ?? undefined,
    descriptionMn: business.descriptionMn ?? undefined,
    descriptionEn: business.descriptionEn ?? undefined,
    taglineMn: business.taglineMn ?? undefined,
    taglineEn: business.taglineEn ?? undefined,
    categoryId: business.categoryId,
    district: business.district ?? undefined,
    city: business.city || 'Ulaanbaatar',
    addressMn: business.addressMn ?? undefined,
    addressEn: business.addressEn ?? undefined,
    latitude: business.latitude ?? undefined,
    longitude: business.longitude ?? undefined,
    phone: business.phone ?? undefined,
    phone2: business.phone2 ?? undefined,
    email: business.email ?? undefined,
    website: business.website ?? undefined,
    whatsapp: business.whatsapp ?? undefined,
    priceRange: business.priceRange ?? undefined,
    facebook: business.facebook ?? undefined,
    instagram: business.instagram ?? undefined,
    twitter: business.twitter ?? undefined,
    youtube: business.youtube ?? undefined,
    tiktok: business.tiktok ?? undefined,
    logoUrl: business.logoUrl ?? undefined,
    coverImageUrl: business.coverImageUrl ?? undefined,
    virtualTourUrl: business.virtualTourUrl ?? undefined,
    virtualTourType: business.virtualTourType ?? undefined,
    tags: business.tags ?? [],
    amenities: business.amenities ?? [],
    status: business.status,
    isVerified: business.isVerified,
    isFeatured: business.isFeatured,
    isPremium: business.isPremium,
  }
}

export default function BusinessEditorForm({
  mode,
  businessId,
  backHref,
  successHref,
  adminContext = false,
}: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [business, setBusiness] = useState<EditableBusiness | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [googleMapsError, setGoogleMapsError] = useState('')
  const [isResolvingGoogleMaps, setIsResolvingGoogleMaps] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: emptyDefaults,
  })

  const isAdmin = adminContext || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'
  const selectedCategory = watch('categoryId')
  const selectedPrice = watch('priceRange')
  const logoUrl = watch('logoUrl')
  const coverImageUrl = watch('coverImageUrl')
  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [categoryRes, userRes] = await Promise.all([
          fetch('/api/categories?includeCount=false', { cache: 'no-store' }),
          fetch('/api/users', { cache: 'no-store' }),
        ])

        const categoryPayload = await categoryRes.json()
        const userPayload = userRes.ok ? await userRes.json() : null

        if (cancelled) return

        if (categoryPayload.success) setCategories(categoryPayload.data ?? [])
        if (userPayload?.success) setCurrentUser(userPayload.data)

        if (mode === 'edit' && businessId) {
          const businessRes = await fetch(`/api/businesses/${businessId}?editable=true`, { cache: 'no-store' })
          const businessPayload = await businessRes.json()

          if (!businessRes.ok || !businessPayload.success) {
            throw new Error(readApiError(businessPayload, 'Бизнесийн мэдээлэл авахад алдаа гарлаа'))
          }

          if (cancelled) return

          const editableBusiness = businessPayload.data as EditableBusiness
          const defaults = businessToDefaults(editableBusiness)
          setBusiness(editableBusiness)
          setTags(defaults.tags ?? [])
          setAmenities(defaults.amenities ?? [])
          setGoogleMapsUrl(buildGoogleMapsCoordinateUrl(defaults.latitude, defaults.longitude))
          setGoogleMapsError('')
          setIsResolvingGoogleMaps(false)
          reset(defaults)
        } else {
          setGoogleMapsUrl('')
          setGoogleMapsError('')
          setIsResolvingGoogleMaps(false)
          reset(emptyDefaults)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Мэдээлэл ачаалахад алдаа гарлаа')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [businessId, mode, reset])

  useEffect(() => {
    const value = googleMapsUrl.trim()
    if (!value || parseGoogleMapsCoordinates(value) || !isGoogleMapsLink(value)) return

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsResolvingGoogleMaps(true)
      setGoogleMapsError('')

      try {
        const res = await fetch('/api/google-maps/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value }),
        })
        const payload = await res.json()

        if (cancelled) return

        if (!res.ok || !payload.success) {
          throw new Error(readApiError(payload, 'Google Maps линкээс координат олдсонгүй.'))
        }

        const coordinates = payload.data as { latitude?: number; longitude?: number }
        if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
          throw new Error('Google Maps линкээс координат олдсонгүй.')
        }

        setGoogleMapsError('')
        setValue('latitude', Number(coordinates.latitude.toFixed(6)), { shouldValidate: true })
        setValue('longitude', Number(coordinates.longitude.toFixed(6)), { shouldValidate: true })
      } catch (error) {
        if (!cancelled) {
          setGoogleMapsError(error instanceof Error ? error.message : 'Google Maps линк шалгахад алдаа гарлаа.')
        }
      } finally {
        if (!cancelled) setIsResolvingGoogleMaps(false)
      }
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [googleMapsUrl, setValue])

  function toggleAmenity(name: string) {
    const next = amenities.includes(name)
      ? amenities.filter((item) => item !== name)
      : [...amenities, name]

    setAmenities(next)
    setValue('amenities', next, { shouldValidate: true })
  }

  function addTag(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    const nextTag = tagInput.trim()
    if (!nextTag || tags.includes(nextTag)) return

    const next = [...tags, nextTag]
    setTags(next)
    setValue('tags', next, { shouldValidate: true })
    setTagInput('')
  }

  function removeTag(tag: string) {
    const next = tags.filter((item) => item !== tag)
    setTags(next)
    setValue('tags', next, { shouldValidate: true })
  }

  function handleGoogleMapsUrlChange(value: string) {
    setGoogleMapsUrl(value)
    setIsResolvingGoogleMaps(false)

    if (!value.trim()) {
      setGoogleMapsError('')
      setValue('latitude', undefined, { shouldValidate: true })
      setValue('longitude', undefined, { shouldValidate: true })
      return
    }

    const coordinates = parseGoogleMapsCoordinates(value)
    if (!coordinates) {
      setValue('latitude', undefined, { shouldValidate: true })
      setValue('longitude', undefined, { shouldValidate: true })
      setGoogleMapsError(isGoogleMapsLink(value)
        ? ''
        : 'Координат олдсонгүй. Google Maps share link, browser address bar дахь full URL эсвэл "47.918,106.917" формат оруулна уу.')
      return
    }

    setGoogleMapsError('')
    setValue('latitude', Number(coordinates.latitude.toFixed(6)), { shouldValidate: true })
    setValue('longitude', Number(coordinates.longitude.toFixed(6)), { shouldValidate: true })
  }

  async function onSubmit(values: BusinessFormValues) {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const endpoint = mode === 'edit' && businessId ? `/api/businesses/${businessId}` : '/api/businesses'
      const res = await fetch(endpoint, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, tags, amenities }),
      })
      const payload = await res.json()

      if (!res.ok || !payload.success) {
        throw new Error(readApiError(payload, 'Бизнес хадгалахад алдаа гарлаа'))
      }

      router.push(successHref)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Бизнес хадгалахад алдаа гарлаа')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-foreground-muted">
          <Loader2 size={18} className="animate-spin" />
          Ачаалж байна...
        </div>
      </div>
    )
  }

  const title = mode === 'edit' ? 'Бизнес засах' : 'Шинэ бизнес нэмэх'
  const subtitle = mode === 'edit'
    ? business?.nameMn ?? 'Бизнесийн мэдээлэл'
    : isAdmin
      ? 'Админ шинэ бизнес шууд бүртгэх боломжтой'
      : 'Бизнесийн мэдээллээ илгээж шалгуулна'

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href={backHref}
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-background-secondary transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-lg">{title}</h1>
            <p className="text-xs text-foreground-muted truncate">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {errorMessage && (
          <div className="mb-5 p-4 rounded-xl bg-brand-danger/8 border border-brand-danger/25 flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="text-brand-danger flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <Building2 size={18} className="text-brand-primary" />
              Үндсэн мэдээлэл
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Бизнесийн нэр *</label>
                <input
                  {...register('nameMn')}
                  className={cn('w-full px-4 py-3 rounded-xl border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30', errors.nameMn ? 'border-brand-danger' : 'border-border')}
                  placeholder="жнь: Монголын Элч Ресторан"
                />
                {errors.nameMn && <p className="text-xs text-brand-danger mt-1">{errors.nameMn.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Business name</label>
                <input
                  {...register('nameEn')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  placeholder="e.g. Mongolian Ambassador Restaurant"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Богино тайлбар</label>
                <input
                  {...register('taglineMn')}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  placeholder="жнь: Монгол хоолны уламжлалт амт"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium mb-3 block">Ангилал *</label>
              {flatCategories.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {flatCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setValue('categoryId', category.id, { shouldValidate: true })}
                      className={cn(
                        'min-h-[86px] flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                        selectedCategory === category.id
                          ? 'border-brand-primary bg-brand-primary/8 text-brand-primary'
                          : 'border-border hover:border-brand-primary/50'
                      )}
                    >
                      <span className="text-xl">{category.icon || '🏢'}</span>
                      <span className="text-center leading-tight">{category.nameMn}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-foreground-muted text-center">
                  Ангилал олдсонгүй
                </div>
              )}
              {errors.categoryId && <p className="text-xs text-brand-danger mt-2">{errors.categoryId.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Дэлгэрэнгүй тайлбар</label>
                <textarea
                  {...register('descriptionMn')}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  placeholder="Бизнесийн тухай мэдээлэл..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea
                  {...register('descriptionEn')}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  placeholder="English description..."
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium mb-2 block">Үнийн дүр</label>
              <div className="grid grid-cols-4 gap-2">
                {(['$', '$$', '$$$', '$$$$'] as const).map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setValue('priceRange', selectedPrice === price ? undefined : price, { shouldValidate: true })}
                    className={cn(
                      'py-2.5 rounded-xl border-2 font-bold text-sm transition-all',
                      selectedPrice === price
                        ? 'border-brand-success bg-brand-success/10 text-brand-success'
                        : 'border-border hover:border-brand-success/50'
                    )}
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <Phone size={18} className="text-brand-primary" />
              Холбоо барих
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Утас</label>
                <input {...register('phone')} type="tel" className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="+976 9911-9911" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Нэмэлт утас</label>
                <input {...register('phone2')} type="tel" className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="+976 8888-8888" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Имэйл</label>
                <input {...register('email')} type="email" className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="info@business.mn" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Вэбсайт</label>
                <input {...register('website')} type="url" className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="https://www.business.mn" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">WhatsApp</label>
                <input {...register('whatsapp')} type="tel" className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="+976 9911-9911" />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <MapPin size={18} className="text-brand-primary" />
              Байршил
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Хот</label>
                <input {...register('city')} className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Ulaanbaatar" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Дүүрэг</label>
                <input {...register('district')} className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Сүхбаатар" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Хаяг</label>
                <input {...register('addressMn')} className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Сүхбаатар дүүрэг, 1-р хороо..." />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Google Maps линк</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" />
                  <input
                    value={googleMapsUrl}
                    onChange={(event) => handleGoogleMapsUrlChange(event.target.value)}
                    className={cn(
                      'w-full rounded-xl border bg-background-secondary py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
                      googleMapsError ? 'border-brand-danger' : 'border-border'
                    )}
                    placeholder="https://www.google.com/maps/place/.../@47.918,106.917,17z"
                  />
                </div>
                <input {...register('latitude')} type="hidden" />
                <input {...register('longitude')} type="hidden" />
                {isResolvingGoogleMaps ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground-muted">
                    <Loader2 size={13} className="animate-spin" />
                    Google Maps линкийг шалгаж байна
                  </p>
                ) : googleMapsError ? (
                  <p className="mt-1.5 text-xs text-brand-danger">{googleMapsError}</p>
                ) : latitude && longitude ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-success">
                    <CheckCircle size={13} />
                    Байршил холбогдлоо
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-foreground-muted">
                    Google Maps дээр газраа сонгоод share link эсвэл browser address bar дахь full URL-ийг оруулна уу.
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <ImageIcon size={18} className="text-brand-primary" />
              Зураг
            </h2>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Нүүр зураг URL</label>
                  <input
                    {...register('coverImageUrl')}
                    type="url"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    placeholder="https://.../cover.webp"
                  />
                  {errors.coverImageUrl && <p className="text-xs text-brand-danger mt-1">{errors.coverImageUrl.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Лого URL</label>
                  <input
                    {...register('logoUrl')}
                    type="url"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    placeholder="https://.../logo.webp"
                  />
                  {errors.logoUrl && <p className="text-xs text-brand-danger mt-1">{errors.logoUrl.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_96px] gap-3">
                <div className="relative min-h-[160px] rounded-xl border border-border bg-background-secondary overflow-hidden">
                  {coverImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${coverImageUrl}")` }}
                    />
                  ) : (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-foreground-muted">
                      <ImageIcon size={24} />
                      <span className="text-xs">Нүүр зураг</span>
                    </div>
                  )}
                </div>
                <div className="relative size-24 rounded-xl border border-border bg-background-secondary overflow-hidden">
                  {logoUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url("${logoUrl}")` }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-1 text-foreground-muted">
                      <ImageIcon size={18} />
                      <span className="text-[11px]">Лого</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <Globe size={18} className="text-brand-primary" />
              Сошиал ба онцлогууд
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <input {...register('facebook')} type="url" className="px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Facebook URL" />
              <input {...register('instagram')} type="url" className="px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Instagram URL" />
              <input {...register('youtube')} type="url" className="px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="YouTube URL" />
              <input {...register('virtualTourUrl')} type="url" className="px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="360 виртуал аялалын URL" />
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium mb-2 block">Тохиромж & Онцлог</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      amenities.includes(amenity)
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                        : 'border-border hover:border-brand-primary/50'
                    )}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium mb-1.5 block">Хайлтын түлхүүр үгс</label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background-secondary min-h-[48px]">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand-danger">x</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={addTag}
                  placeholder={tags.length === 0 ? 'Бичиж Enter дарна уу...' : ''}
                  className="flex-1 min-w-[140px] bg-transparent text-xs focus:outline-none"
                />
              </div>
            </div>
          </motion.section>

          {isAdmin && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-5 sm:p-6"
            >
              <h2 className="font-semibold mb-5 flex items-center gap-2">
                <BadgeCheck size={18} className="text-brand-success" />
                Админ тохиргоо
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Эзэмшигчийн имэйл</label>
                  <input
                    {...register('ownerEmail')}
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Төлөв</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                {[
                  { name: 'isVerified', label: 'Баталгаажсан', icon: CheckCircle },
                  { name: 'isFeatured', label: 'Онцлох', icon: Star },
                  { name: 'isPremium', label: 'Premium', icon: Search },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-secondary cursor-pointer">
                    <input {...register(item.name as 'isVerified' | 'isFeatured' | 'isPremium')} type="checkbox" className="rounded border-border" />
                    <item.icon size={16} className="text-brand-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </motion.section>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link href={backHref} className="px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-background-tertiary transition-colors text-center">
              Буцах
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || flatCategories.length === 0}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Хадгалж байна...' : mode === 'edit' ? 'Өөрчлөлт хадгалах' : 'Бизнес нэмэх'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
