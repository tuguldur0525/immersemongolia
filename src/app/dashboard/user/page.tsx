'use client'
// src/app/dashboard/user/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Clock, Star, Settings, MapPin, ChevronRight, Edit3, LogOut, Bell, Shield, Globe } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'saved', label: 'Хадгалсан', icon: Heart },
  { id: 'recent', label: 'Сүүлд үзсэн', icon: Clock },
  { id: 'reviews', label: 'Санал хүсэлт', icon: Star },
  { id: 'settings', label: 'Тохиргоо', icon: Settings },
]

const SAVED = [
  { id: '1', nameMn: 'Монголын Элч', category: 'Ресторан', icon: '🍜', avgRating: 4.3, slug: 'mongolian-ambassador', savedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', nameMn: 'Sky Fitness Club', category: 'Фитнэс', icon: '💪', avgRating: 4.6, slug: 'sky-fitness', savedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: '3', nameMn: 'Summit Hotel', category: 'Зочид буудал', icon: '🏨', avgRating: 4.1, slug: 'summit-hotel', savedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
]

const RECENT = [
  { id: '1', nameMn: 'Гандан Кафе', category: 'Кафе', icon: '☕', avgRating: 4.0, slug: 'gandan-cafe', viewedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', nameMn: 'Nature Resort', category: 'Амралтын газар', icon: '⛺', avgRating: 4.8, slug: 'nature-resort', viewedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
]

const REVIEWS = [
  { id: '1', businessName: 'Монголын Элч', rating: 5, body: 'Маш сайхан хоол, найрсаг үйлчилгээ!', status: 'PUBLISHED', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '2', businessName: 'Sky Fitness', rating: 4, body: 'Орчин үеийн тоног төхөөрөмж байсан.', status: 'PENDING_MODERATION', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
]

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState('saved')
  const [notifications, setNotifications] = useState({ email: true, push: false, marketing: true })

  // Mock user
  const user = { firstName: 'Мөнхбаяр', lastName: 'Батхуяг', email: 'munkh@example.mn', avatarInitials: 'МБ', joinedAt: '2024 оны 3 дугаар сар' }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-24 md:pb-0 bg-background-secondary">
        {/* Profile header */}
        <div className="bg-card border-b border-border">
          <div className="section-container py-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="size-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-bold text-white shadow-glow-brand">
                  {user.avatarInitials}
                </div>
                <button className="absolute -bottom-1 -right-1 size-7 rounded-full bg-card border-2 border-border flex items-center justify-center hover:bg-background-secondary transition-colors">
                  <Edit3 size={12} />
                </button>
              </div>
              <div>
                <h1 className="text-xl font-bold">{user.lastName} {user.firstName}</h1>
                <p className="text-sm text-foreground-muted">{user.email}</p>
                <p className="text-xs text-foreground-subtle mt-1">{user.joinedAt}-аас хэрэглэж байна</p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{SAVED.length}</p>
                  <p className="text-xs text-foreground-muted">Хадгалсан</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold">{REVIEWS.length}</p>
                  <p className="text-xs text-foreground-muted">Санал</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="section-container">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-foreground-muted hover:text-foreground')}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="section-container py-8">
          {/* Saved */}
          {activeTab === 'saved' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-bold text-lg mb-4">Хадгалсан газрууд ({SAVED.length})</h2>
              {SAVED.length === 0 ? (
                <div className="text-center py-16">
                  <Heart size={40} className="text-foreground-subtle mx-auto mb-3" />
                  <p className="text-foreground-muted">Одоохондоо хадгалсан газар байхгүй байна</p>
                  <Link href="/business/search" className="btn-brand mt-4">Газар хайх</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SAVED.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Link href={`/business/${item.slug}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-brand-primary hover:shadow-md transition-all group">
                        <div className="size-12 rounded-xl bg-background-secondary flex items-center justify-center text-2xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-brand-primary transition-colors">{item.nameMn}</p>
                          <p className="text-xs text-foreground-muted">{item.category}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={11} className="text-brand-accent fill-current" />
                            <span className="text-xs font-medium">{item.avgRating}</span>
                            <span className="text-xs text-foreground-subtle">• {formatRelativeTime(item.savedAt)}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-foreground-muted group-hover:text-brand-primary flex-shrink-0 transition-colors" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Recent */}
          {activeTab === 'recent' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-bold text-lg mb-4">Сүүлд үзсэн ({RECENT.length})</h2>
              <div className="space-y-3">
                {RECENT.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/business/${item.slug}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-brand-primary transition-all group">
                      <div className="size-11 rounded-xl bg-background-secondary flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nameMn}</p>
                        <p className="text-xs text-foreground-muted">{item.category} • {formatRelativeTime(item.viewedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-brand-accent fill-current" />
                        <span className="text-sm font-medium">{item.avgRating}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-bold text-lg mb-4">Санал хүсэлт ({REVIEWS.length})</h2>
              <div className="space-y-4">
                {REVIEWS.map((review, i) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-5 rounded-2xl bg-card border border-border">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-sm">{review.businessName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= review.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />)}
                        </div>
                      </div>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium',
                        review.status === 'PUBLISHED' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning')}>
                        {review.status === 'PUBLISHED' ? 'Нийтлэгдсэн' : 'Хянагдаж байна'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-secondary">{review.body}</p>
                    <p className="text-xs text-foreground-muted mt-2">{formatRelativeTime(review.createdAt)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg space-y-6">
              <h2 className="font-bold text-lg">Тохиргоо</h2>

              {/* Profile settings */}
              <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Settings size={16} /> Профайл мэдээлэл</h3>
                {[
                  { label: 'Овог', value: user.lastName, type: 'text' },
                  { label: 'Нэр', value: user.firstName, type: 'text' },
                  { label: 'Имэйл', value: user.email, type: 'email' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-xs font-medium text-foreground-muted block mb-1">{field.label}</label>
                    <input defaultValue={field.value} type={field.type}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                  </div>
                ))}
                <button className="btn-brand w-full py-2.5">Хадгалах</button>
              </div>

              {/* Language */}
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold flex items-center gap-2 mb-4"><Globe size={16} /> Хэл</h3>
                <div className="flex gap-3">
                  {['Монгол', 'English'].map(lang => (
                    <button key={lang} className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      lang === 'Монгол' ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary')}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold flex items-center gap-2 mb-4"><Bell size={16} /> Мэдэгдэл</h3>
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Имэйл мэдэгдэл' },
                    { key: 'push', label: 'Push мэдэгдэл' },
                    { key: 'marketing', label: 'Маркетингийн мэдэгдэл' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <div onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                        className={cn('relative w-10 h-5 rounded-full transition-colors cursor-pointer',
                          notifications[item.key as keyof typeof notifications] ? 'bg-brand-primary' : 'bg-border')}>
                        <div className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                          notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="p-5 rounded-2xl border border-brand-danger/30 bg-brand-danger/4">
                <h3 className="font-semibold text-brand-danger flex items-center gap-2 mb-3"><Shield size={16} /> Аюулын бүс</h3>
                <button className="w-full py-2.5 rounded-xl border border-brand-danger text-brand-danger text-sm font-medium hover:bg-brand-danger hover:text-white transition-all">
                  Бүртгэл устгах
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
