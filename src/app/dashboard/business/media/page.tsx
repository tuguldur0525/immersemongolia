'use client'
// src/app/dashboard/business/media/page.tsx
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, Trash2, Star, GripVertical, Camera, Video, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MediaType = 'PHOTO' | 'VIDEO' | 'VIRTUAL_TOUR_360' | 'LOGO' | 'COVER'

interface MediaItem {
  id: string
  type: MediaType
  url: string
  caption: string | null
  sortOrder: number
  isMain: boolean
}

const MOCK_MEDIA: MediaItem[] = [
  { id: '1', type: 'COVER', url: '', caption: 'Нүүр зураг', sortOrder: 0, isMain: true },
  { id: '2', type: 'LOGO', url: '', caption: 'Лого', sortOrder: 1, isMain: false },
  { id: '3', type: 'PHOTO', url: '', caption: 'Ресторанны интерьер', sortOrder: 2, isMain: false },
  { id: '4', type: 'PHOTO', url: '', caption: 'Хоолны цэс', sortOrder: 3, isMain: false },
  { id: '5', type: 'PHOTO', url: '', caption: null, sortOrder: 4, isMain: false },
]

const TYPE_LABELS: Record<MediaType, { label: string; icon: typeof Camera }> = {
  COVER: { label: 'Нүүр зураг', icon: ImageIcon },
  LOGO: { label: 'Лого', icon: ImageIcon },
  PHOTO: { label: 'Зураг', icon: Camera },
  VIDEO: { label: 'Видео', icon: Video },
  VIRTUAL_TOUR_360: { label: '360° Аялал', icon: Globe },
}

export default function BusinessMediaPage() {
  const [media, setMedia] = useState(MOCK_MEDIA)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'photos' | 'virtual'>('photos')
  const [virtualTourUrl, setVirtualTourUrl] = useState('')
  const [tourSaved, setTourSaved] = useState(false)
  const maxPhotos = 20

  const photos = media.filter(m => ['PHOTO', 'COVER', 'LOGO'].includes(m.type))
  const usedSlots = photos.length

  function deleteMedia(id: string) {
    setMedia(prev => prev.filter(m => m.id !== id))
  }

  function setMainPhoto(id: string) {
    setMedia(prev => prev.map(m => ({ ...m, isMain: m.id === id })))
  }

  function saveTour() {
    setTourSaved(true)
    setTimeout(() => setTourSaved(false), 2000)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    // In production: upload to Supabase Storage via UploadThing
    console.log('Uploading:', files.map(f => f.name))
  }, [])

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/business" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Медиа</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Зураг & Медиа</h1>
          <div className="text-sm text-foreground-muted">
            <span className="font-semibold text-foreground">{usedSlots}</span>/{maxPhotos} зураг ашигласан
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1 w-fit">
          {[{ id: 'photos', label: '📸 Зургийн галерей' }, { id: 'virtual', label: '360° Виртуал аялал' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'photos' ? (
          <div className="space-y-6">
            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
                isDragging
                  ? 'border-brand-primary bg-brand-primary/5 scale-[1.01]'
                  : 'border-border hover:border-brand-primary hover:bg-brand-primary/3'
              )}
            >
              <div className="size-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload size={24} className="text-brand-primary" />
              </div>
              <p className="font-semibold mb-1">Зураг чирж оруулах</p>
              <p className="text-sm text-foreground-muted mb-4">PNG, JPG, WEBP — Хамгийн ихдээ 10MB тус бүр</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium cursor-pointer hover:brightness-110 transition-all">
                <ImageIcon size={16} />
                Зураг сонгох
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => console.log('Files:', e.target.files)} />
              </label>
              <p className="text-xs text-foreground-muted mt-3">
                {maxPhotos - usedSlots} зург нэмэх боломжтой
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-foreground-muted mb-1.5">
                <span>Зургийн хэрэглээ</span>
                <span>{usedSlots}/{maxPhotos}</span>
              </div>
              <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', usedSlots >= maxPhotos ? 'bg-brand-danger' : 'bg-brand-primary')}
                  style={{ width: `${(usedSlots / maxPhotos) * 100}%` }}
                />
              </div>
            </div>

            {/* Media grid */}
            <div>
              <h3 className="font-semibold mb-4">Байршуулсан зургууд ({usedSlots})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="group relative rounded-2xl overflow-hidden border border-border bg-background-secondary aspect-square">
                    {/* Placeholder */}
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      {item.type === 'COVER' ? <ImageIcon size={28} className="text-foreground-muted" /> :
                       item.type === 'LOGO' ? <Star size={28} className="text-foreground-muted" /> :
                       <Camera size={28} className="text-foreground-muted" />}
                      <span className="text-xs text-foreground-muted">{TYPE_LABELS[item.type]?.label}</span>
                    </div>

                    {/* Main badge */}
                    {item.isMain && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-bold">Нүүр</span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!item.isMain && item.type === 'PHOTO' && (
                        <button onClick={() => setMainPhoto(item.id)}
                          className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title="Нүүр зураг болгох">
                          <Star size={14} className="text-white" />
                        </button>
                      )}
                      <button onClick={() => deleteMedia(item.id)}
                        className="size-8 rounded-full bg-brand-danger/80 hover:bg-brand-danger flex items-center justify-center transition-colors">
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>

                    {/* Caption */}
                    {item.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-[10px] truncate">{item.caption}</p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Add more slot */}
                {usedSlots < maxPhotos && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/3 transition-all">
                    <div className="size-10 rounded-xl bg-background-tertiary flex items-center justify-center">
                      <Upload size={18} className="text-foreground-muted" />
                    </div>
                    <span className="text-xs text-foreground-muted">Нэмэх</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-background-secondary border border-border text-sm text-foreground-muted">
              <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
                <AlertCircle size={15} className="text-brand-primary" />
                Зурагны зөвлөмж
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Нүүр зураг (Cover): 1200×630px эсвэл 4:3 харьцаатай</li>
                <li>• Лого: 400×400px, дугуй дэвсгэртэй</li>
                <li>• Галерейн зураг: хамгийн багадаа 800×600px</li>
                <li>• Файлын хэмжээ: 10MB-ээс бага</li>
                <li>• Форматууд: JPG, PNG, WEBP</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Virtual Tour tab */
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Globe size={20} className="text-brand-primary" />
                360° Виртуал аялал тохируулах
              </h2>
              <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
                Matterport, Google Street View, Kuula, 360° аялалын URL оруулна уу.
                Зочид тань вэбсайтаас шууд виртуал аялал хийх боломжтой болно.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Виртуал аялалын URL</label>
                  <input
                    value={virtualTourUrl}
                    onChange={e => { setVirtualTourUrl(e.target.value); setTourSaved(false) }}
                    placeholder="https://my.matterport.com/show/?m=abc123..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-mono"
                  />
                  <p className="text-xs text-foreground-muted mt-1.5">
                    Дэмжигдэх платформ: Matterport, Google Street View, Kuula, Roundme, 3DVista
                  </p>
                </div>

                {virtualTourUrl && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Урьдчилан харах</label>
                    <div className="aspect-video rounded-2xl bg-background-secondary border border-border overflow-hidden flex items-center justify-center">
                      <div className="text-center">
                        <Globe size={36} className="text-foreground-muted mx-auto mb-2" />
                        <p className="text-sm text-foreground-muted">Виртуал аялалын урьдчилан харах</p>
                        <a href={virtualTourUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-primary hover:underline mt-1 block">
                          Шинэ цонхонд нээх
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={saveTour}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all">
                  {tourSaved ? <><CheckCircle size={15} />Хадгалагдлаа!</> : <>Хадгалах</>}
                </button>
              </div>
            </div>

            {/* Supported platforms */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-semibold mb-4 text-sm">Дэмжигдэх платформууд</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Matterport', url: 'matterport.com', desc: 'Мэргэжлийн 3D аялал' },
                  { name: 'Google Street View', url: 'google.com', desc: 'Google-ийн 360° зураг' },
                  { name: 'Kuula', url: 'kuula.co', desc: 'Хялбар 360° аялал' },
                  { name: 'Roundme', url: 'roundme.com', desc: 'Нийгэмлэгийн аялал' },
                  { name: '3DVista', url: '3dvista.com', desc: 'Дэлгэрэнгүй VR' },
                  { name: 'Pannellum', url: 'pannellum.org', desc: 'Нээлттэй эх код' },
                ].map(p => (
                  <div key={p.name} className="p-3 rounded-xl bg-background-secondary border border-border">
                    <p className="font-medium text-xs">{p.name}</p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
