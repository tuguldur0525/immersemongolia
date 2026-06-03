'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Globe,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import BusinessDashboardShell from '@/components/dashboard/business/BusinessDashboardShell'
import { cn } from '@/lib/utils'

type MediaType = 'PHOTO' | 'VIDEO' | 'VIRTUAL_TOUR_360' | 'THUMBNAIL' | 'LOGO' | 'COVER'
type UploadType = 'PHOTO' | 'COVER' | 'LOGO'

type MediaItem = {
  id: string
  type: MediaType
  url: string
  thumbnailUrl: string | null
  caption: string | null
  altText: string | null
  sortOrder: number
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

type MediaBusiness = {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  virtualTourUrl: string | null
  virtualTourType: string | null
}

type MediaData = {
  businesses: MediaBusiness[]
  selectedBusiness: (MediaBusiness & { media: MediaItem[] }) | null
  media: MediaItem[]
  limits: { maxPhotos: number; hasVirtualTour: boolean }
}

const TYPE_LABELS: Record<UploadType, { label: string; desc: string; icon: typeof Camera }> = {
  COVER: { label: 'Нүүр зураг', desc: 'Business detail болон card дээр харагдана', icon: ImageIcon },
  LOGO: { label: 'Лого', desc: 'Бизнесийн таних тэмдэг', icon: Star },
  PHOTO: { label: 'Галерей зураг', desc: 'Орчин, үйлчилгээ, бүтээгдэхүүний зураг', icon: Camera },
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback
  return typeof payload.error === 'string' ? payload.error : fallback
}

export default function BusinessMediaPage() {
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [activeTab, setActiveTab] = useState<'photos' | 'virtual'>('photos')
  const [uploadType, setUploadType] = useState<UploadType>('PHOTO')
  const [caption, setCaption] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSavingTour, setIsSavingTour] = useState(false)
  const [virtualTourUrl, setVirtualTourUrl] = useState('')
  const [tourType, setTourType] = useState('custom')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<MediaData>({
    queryKey: ['business-media', selectedBusinessId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedBusinessId) params.set('businessId', selectedBusinessId)
      const res = await fetch(`/api/dashboard/business/media?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Media ачаалж чадсангүй'))
      return payload.data
    },
    staleTime: 20_000,
  })

  const selectedBusiness = data?.selectedBusiness ?? null
  const media = data?.media ?? []
  const photos = useMemo(() => media.filter((item) => item.type !== 'VIRTUAL_TOUR_360' && item.type !== 'VIDEO'), [media])
  const maxPhotos = data?.limits.maxPhotos ?? 5
  const usedSlots = photos.length

  useEffect(() => {
    if (!selectedBusinessId && selectedBusiness?.id) {
      setSelectedBusinessId(selectedBusiness.id)
    }
  }, [selectedBusiness?.id, selectedBusinessId])

  useEffect(() => {
    setVirtualTourUrl(selectedBusiness?.virtualTourUrl ?? '')
    setTourType(selectedBusiness?.virtualTourType ?? 'custom')
  }, [selectedBusiness?.id, selectedBusiness?.virtualTourType, selectedBusiness?.virtualTourUrl])

  async function uploadFiles(files: File[]) {
    if (!selectedBusiness) return
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setMessage({ type: 'error', text: 'Зөвхөн зураг файл сонгоно уу.' })
      return
    }

    if (usedSlots + imageFiles.length > maxPhotos) {
      setMessage({ type: 'error', text: `Таны тарифф ${maxPhotos} зураг хүртэл оруулах боломжтой.` })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      for (const file of imageFiles) {
        const formData = new FormData()
        formData.set('businessId', selectedBusiness.id)
        formData.set('type', uploadType)
        formData.set('caption', caption)
        formData.set('file', file)

        const res = await fetch('/api/dashboard/business/media', {
          method: 'POST',
          body: formData,
        })
        const payload = await res.json()
        if (!res.ok || !payload.success) {
          throw new Error(readApiError(payload, 'Зураг upload хийхэд алдаа гарлаа'))
        }
      }

      setCaption('')
      setMessage({ type: 'success', text: 'Зураг амжилттай байршууллаа.' })
      queryClient.invalidateQueries({ queryKey: ['business-media'] })
      queryClient.invalidateQueries({ queryKey: ['business-dashboard'] })
    } catch (uploadError) {
      setMessage({
        type: 'error',
        text: uploadError instanceof Error ? uploadError.message : 'Зураг upload хийхэд алдаа гарлаа',
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function patchMedia(body: Record<string, unknown>, successText: string) {
    const res = await fetch('/api/dashboard/business/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await res.json()
    if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Өөрчлөлт хадгалахад алдаа гарлаа'))
    setMessage({ type: 'success', text: successText })
    queryClient.invalidateQueries({ queryKey: ['business-media'] })
    queryClient.invalidateQueries({ queryKey: ['business-dashboard'] })
  }

  async function deleteMedia(mediaId: string) {
    if (!selectedBusiness || !window.confirm('Энэ зургийг устгах уу?')) return
    setMessage(null)

    try {
      const res = await fetch('/api/dashboard/business/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedBusiness.id, mediaId }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Зураг устгахад алдаа гарлаа'))
      setMessage({ type: 'success', text: 'Зураг устгалаа.' })
      queryClient.invalidateQueries({ queryKey: ['business-media'] })
    } catch (deleteError) {
      setMessage({
        type: 'error',
        text: deleteError instanceof Error ? deleteError.message : 'Зураг устгахад алдаа гарлаа',
      })
    }
  }

  async function saveTour() {
    if (!selectedBusiness || !virtualTourUrl.trim()) return
    setIsSavingTour(true)
    setMessage(null)
    try {
      await patchMedia({
        action: 'save_tour',
        businessId: selectedBusiness.id,
        url: virtualTourUrl.trim(),
        tourType: tourType.trim() || 'custom',
      }, '360° аялал хадгалагдлаа.')
    } catch (saveError) {
      setMessage({
        type: 'error',
        text: saveError instanceof Error ? saveError.message : '360° аялал хадгалахад алдаа гарлаа',
      })
    } finally {
      setIsSavingTour(false)
    }
  }

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    uploadFiles(Array.from(event.dataTransfer.files))
  }, [caption, maxPhotos, queryClient, selectedBusiness, uploadType, usedSlots])

  return (
    <BusinessDashboardShell
      title="Зураг & Медиа"
      subtitle="Cover, logo, gallery болон 360° аяллаа удирдах"
      breadcrumbs={[{ label: 'Хяналтын самбар', href: '/dashboard/business' }, { label: 'Медиа' }]}
    >
      <div className="space-y-6 max-w-7xl">
        {(error || message) && (
          <div className={cn(
            'rounded-xl border p-4 text-sm flex items-start gap-3',
            message?.type === 'success'
              ? 'border-brand-success/25 bg-brand-success/8 text-brand-success'
              : 'border-brand-danger/25 bg-brand-danger/8 text-brand-danger'
          )}>
            {message?.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
            <span>{message?.text || 'Media мэдээлэл ачаалж чадсангүй.'}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex gap-1 bg-card rounded-xl border border-border p-1 w-fit">
            {[
              { id: 'photos', label: 'Зургийн галерей', icon: Camera },
              { id: 'virtual', label: '360° аялал', icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {data && data.businesses.length > 0 && (
            <select
              value={selectedBusiness?.id ?? selectedBusinessId}
              onChange={(event) => setSelectedBusinessId(event.target.value)}
              className="w-full lg:w-72 px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {data.businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.nameMn || business.nameEn || 'Нэргүй бизнес'}
                </option>
              ))}
            </select>
          )}
        </div>

        {!isLoading && !selectedBusiness && (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <ImageIcon size={38} className="text-foreground-subtle mx-auto mb-3" />
            <p className="font-medium mb-2">Media удирдах бизнес алга байна.</p>
            <Link href="/dashboard/business/listings/new" className="btn-brand mt-2">
              Бизнес нэмэх
            </Link>
          </div>
        )}

        {selectedBusiness && activeTab === 'photos' && (
          <div className="grid xl:grid-cols-[360px_1fr] gap-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 h-fit"
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Upload size={17} className="text-brand-primary" />
                Файл оруулах
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Зургийн төрөл</label>
                  <div className="grid gap-2">
                    {(Object.keys(TYPE_LABELS) as UploadType[]).map((type) => {
                      const config = TYPE_LABELS[type]
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setUploadType(type)}
                          className={cn(
                            'text-left p-3 rounded-xl border transition-colors flex gap-3',
                            uploadType === type ? 'border-brand-primary bg-brand-primary/8' : 'border-border hover:border-brand-primary/40'
                          )}
                        >
                          <div className="size-9 rounded-xl bg-background-secondary flex items-center justify-center">
                            <config.icon size={16} className={uploadType === type ? 'text-brand-primary' : 'text-foreground-muted'} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{config.label}</p>
                            <p className="text-xs text-foreground-muted">{config.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Тайлбар</label>
                  <input
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    placeholder="жнь: Ресторанны интерьер"
                  />
                </div>

                <div
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-6 text-center transition-all',
                    isDragging ? 'border-brand-primary bg-brand-primary/5' : 'border-border bg-background-secondary'
                  )}
                >
                  <Upload size={24} className="text-brand-primary mx-auto mb-3" />
                  <p className="font-semibold text-sm mb-1">Зураг чирж оруулах</p>
                  <p className="text-xs text-foreground-muted mb-4">PNG, JPG, WEBP, GIF - 10MB хүртэл</p>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium cursor-pointer hover:brightness-110 transition-all">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    {isUploading ? 'Оруулж байна...' : 'Файл сонгох'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple={uploadType === 'PHOTO'}
                      disabled={isUploading}
                      className="hidden"
                      onChange={(event) => {
                        uploadFiles(Array.from(event.target.files ?? []))
                        event.currentTarget.value = ''
                      }}
                    />
                  </label>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-foreground-muted mb-1.5">
                    <span>Зургийн хэрэглээ</span>
                    <span>{usedSlots}/{maxPhotos}</span>
                  </div>
                  <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', usedSlots >= maxPhotos ? 'bg-brand-danger' : 'bg-brand-primary')}
                      style={{ width: `${Math.min(100, (usedSlots / Math.max(1, maxPhotos)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Байршуулсан зургууд</h2>
                  <p className="text-sm text-foreground-muted">{selectedBusiness.nameMn || selectedBusiness.nameEn}</p>
                </div>
                <span className="text-sm text-foreground-muted">{usedSlots}/{maxPhotos}</span>
              </div>

              <div className="p-5">
                {photos.length === 0 ? (
                  <div className="py-16 text-center text-sm text-foreground-muted">
                    <Camera size={34} className="mx-auto mb-3 text-foreground-subtle" />
                    Одоогоор зураг байхгүй байна.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {photos.map((item, index) => {
                      const isCover = selectedBusiness.coverImageUrl === item.url || item.type === 'COVER'
                      const isLogo = selectedBusiness.logoUrl === item.url || item.type === 'LOGO'
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="group relative rounded-2xl overflow-hidden border border-border bg-background-secondary aspect-square"
                        >
                          <img src={item.url} alt={item.altText || item.caption || 'Business media'} className="h-full w-full object-cover" />
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {isCover && <span className="px-2 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-bold">Cover</span>}
                            {isLogo && <span className="px-2 py-0.5 rounded-full bg-brand-accent text-white text-[10px] font-bold">Logo</span>}
                          </div>
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!isCover && (
                              <button
                                onClick={() => patchMedia({ action: 'set_cover', businessId: selectedBusiness.id, mediaId: item.id }, 'Cover зураг шинэчлэгдлээ.')}
                                className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium"
                              >
                                Cover
                              </button>
                            )}
                            {!isLogo && (
                              <button
                                onClick={() => patchMedia({ action: 'set_logo', businessId: selectedBusiness.id, mediaId: item.id }, 'Лого шинэчлэгдлээ.')}
                                className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium"
                              >
                                Logo
                              </button>
                            )}
                            <button
                              onClick={() => deleteMedia(item.id)}
                              className="size-9 rounded-lg bg-brand-danger/85 hover:bg-brand-danger flex items-center justify-center"
                              title="Устгах"
                            >
                              <Trash2 size={15} className="text-white" />
                            </button>
                          </div>
                          {item.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-white text-xs truncate">{item.caption}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        )}

        {selectedBusiness && activeTab === 'virtual' && (
          <div className="grid xl:grid-cols-[1fr_360px] gap-6">
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Globe size={20} className="text-brand-primary" />
                360° Виртуал аялал
              </h2>
              <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
                Matterport, Google Street View, Kuula, Roundme зэрэг embed/share URL-ийг оруулна.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Виртуал аялалын URL</label>
                  <input
                    value={virtualTourUrl}
                    onChange={(event) => setVirtualTourUrl(event.target.value)}
                    placeholder="https://my.matterport.com/show/?m=abc123"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Платформ</label>
                  <select
                    value={tourType}
                    onChange={(event) => setTourType(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    <option value="custom">Custom URL</option>
                    <option value="matterport">Matterport</option>
                    <option value="google">Google Street View</option>
                    <option value="kuula">Kuula</option>
                    <option value="roundme">Roundme</option>
                  </select>
                </div>

                {virtualTourUrl && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Урьдчилан шалгах</label>
                    <div className="aspect-video rounded-2xl bg-background-secondary border border-border overflow-hidden flex items-center justify-center">
                      <div className="text-center px-4">
                        <Video size={36} className="text-foreground-muted mx-auto mb-2" />
                        <p className="text-sm text-foreground-muted">URL хадгалахын өмнө шинэ цонхонд шалгаж болно</p>
                        <a href={virtualTourUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline mt-2 block">
                          Шинэ цонхонд нээх
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveTour}
                    disabled={isSavingTour || !virtualTourUrl.trim()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    {isSavingTour ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    Хадгалах
                  </button>
                  {selectedBusiness.virtualTourUrl && (
                    <button
                      onClick={() => patchMedia({ action: 'clear_tour', businessId: selectedBusiness.id }, '360° аялал устгагдлаа.')}
                      className="px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors"
                    >
                      Устгах
                    </button>
                  )}
                </div>
              </div>
            </section>

            <aside className="bg-card rounded-2xl border border-border p-5 h-fit">
              <h3 className="font-semibold mb-4 text-sm">Checklist</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Cover зураг', done: Boolean(selectedBusiness.coverImageUrl) },
                  { label: 'Лого', done: Boolean(selectedBusiness.logoUrl) },
                  { label: '5-аас дээш gallery зураг', done: photos.length >= 5 },
                  { label: '360° аялал', done: Boolean(selectedBusiness.virtualTourUrl) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={cn('size-5 rounded-full flex items-center justify-center', item.done ? 'bg-brand-success text-white' : 'bg-background-tertiary text-foreground-muted')}>
                      {item.done && <CheckCircle size={12} />}
                    </div>
                    <span className={item.done ? 'text-foreground' : 'text-foreground-muted'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </BusinessDashboardShell>
  )
}
