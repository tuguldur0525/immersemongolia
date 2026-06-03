'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCircle,
  Globe,
  Loader2,
  LogOut,
  Save,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'

type SettingsPreferences = {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
}

type UserSettings = {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string | null
  phone: string | null
  bio: string | null
  avatarUrl: string | null
  role: string
  preferredLanguage: 'mn' | 'en'
  preferences: unknown
  createdAt: string
  _count: { reviews: number; savedBusinesses: number; businesses: number }
}

type FormState = {
  firstName: string
  lastName: string
  displayName: string
  phone: string
  bio: string
  preferredLanguage: 'mn' | 'en'
  preferences: SettingsPreferences
}

const DEFAULT_PREFERENCES: SettingsPreferences = {
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
}

function normalizePreferences(raw: unknown): SettingsPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_PREFERENCES
  const value = raw as Partial<Record<keyof SettingsPreferences, unknown>>
  return {
    emailNotifications: typeof value.emailNotifications === 'boolean' ? value.emailNotifications : true,
    pushNotifications: typeof value.pushNotifications === 'boolean' ? value.pushNotifications : false,
    marketingEmails: typeof value.marketingEmails === 'boolean' ? value.marketingEmails : false,
  }
}

function initials(firstName: string, lastName: string) {
  return `${lastName.charAt(0)}${firstName.charAt(0)}`.trim().toUpperCase() || 'U'
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback
  return typeof payload.error === 'string' ? payload.error : fallback
}

export default function UserSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const res = await fetch('/api/users/settings', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Тохиргоо ачаалж чадсангүй'))
      return payload.data
    },
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!data) return
    setForm({
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName ?? '',
      phone: data.phone ?? '',
      bio: data.bio ?? '',
      preferredLanguage: data.preferredLanguage,
      preferences: normalizePreferences(data.preferences),
    })
  }, [data])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current)
  }

  function togglePreference(key: keyof SettingsPreferences) {
    setForm((current) => current
      ? {
          ...current,
          preferences: {
            ...current.preferences,
            [key]: !current.preferences[key],
          },
        }
      : current
    )
  }

  async function saveSettings() {
    if (!form) return
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          displayName: form.displayName || null,
          phone: form.phone || null,
          bio: form.bio || null,
          preferredLanguage: form.preferredLanguage,
          preferences: form.preferences,
        }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Тохиргоо хадгалахад алдаа гарлаа'))
      setMessage({ type: 'success', text: 'Тохиргоо хадгалагдлаа.' })
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      queryClient.invalidateQueries({ queryKey: ['business-dashboard'] })
    } catch (saveError) {
      setMessage({
        type: 'error',
        text: saveError instanceof Error ? saveError.message : 'Тохиргоо хадгалахад алдаа гарлаа',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const currentForm = form

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-24 md:pb-0 bg-background-secondary">
        <div className="bg-card border-b border-border">
          <div className="section-container py-8">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-bold text-white shadow-glow-brand">
                {data ? initials(data.firstName, data.lastName) : 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold">Хэрэглэгчийн тохиргоо</h1>
                <p className="text-sm text-foreground-muted truncate">{data?.email || 'Ачаалж байна...'}</p>
                {data?.createdAt && (
                  <p className="text-xs text-foreground-subtle mt-1">{formatDate(data.createdAt)}-аас хэрэглэж байна</p>
                )}
              </div>
              {data && (
                <div className="ml-auto hidden sm:flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold">{data._count.savedBusinesses}</p>
                    <p className="text-xs text-foreground-muted">Хадгалсан</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-bold">{data._count.reviews}</p>
                    <p className="text-xs text-foreground-muted">Санал</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section-container py-8">
          {error && (
            <div className="mb-5 rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger">
              Тохиргоо ачаалж чадсангүй.
            </div>
          )}
          {message && (
            <div className={cn(
              'mb-5 rounded-xl border p-4 text-sm flex items-center gap-2',
              message.type === 'success'
                ? 'border-brand-success/25 bg-brand-success/8 text-brand-success'
                : 'border-brand-danger/25 bg-brand-danger/8 text-brand-danger'
            )}>
              {message.type === 'success' && <CheckCircle size={16} />}
              {message.text}
            </div>
          )}

          {isLoading || !currentForm ? (
            <div className="rounded-2xl bg-card border border-border py-20 text-center text-sm text-foreground-muted">
              <Loader2 size={20} className="animate-spin mx-auto mb-3" />
              Ачаалж байна...
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_360px] gap-6">
              <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="font-semibold mb-5 flex items-center gap-2">
                  <User size={18} className="text-brand-primary" />
                  Профайл мэдээлэл
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Овог</label>
                    <input
                      value={currentForm.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Нэр *</label>
                    <input
                      value={currentForm.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Дэлгэцийн нэр</label>
                    <input
                      value={currentForm.displayName}
                      onChange={(event) => updateField('displayName', event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Утас</label>
                    <input
                      value={currentForm.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      placeholder="+976 9911-9911"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Био</label>
                    <textarea
                      value={currentForm.bio}
                      onChange={(event) => updateField('bio', event.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                      placeholder="Өөрийн тухай товч мэдээлэл..."
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Globe size={16} className="text-brand-primary" />
                    Хэл
                  </h3>
                  <div className="flex gap-3">
                    {[
                      { value: 'mn', label: 'Монгол' },
                      { value: 'en', label: 'English' },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => updateField('preferredLanguage', lang.value as 'mn' | 'en')}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                          currentForm.preferredLanguage === lang.value
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'border-border hover:border-brand-primary'
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Bell size={16} className="text-brand-primary" />
                    Мэдэгдэл
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'Имэйл мэдэгдэл' },
                      { key: 'pushNotifications', label: 'Push мэдэгдэл' },
                      { key: 'marketingEmails', label: 'Маркетингийн мэдэгдэл' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-xl bg-background-secondary border border-border p-3">
                        <span className="text-sm">{item.label}</span>
                        <button
                          onClick={() => togglePreference(item.key as keyof SettingsPreferences)}
                          className={cn(
                            'relative w-10 h-5 rounded-full transition-colors',
                            currentForm.preferences[item.key as keyof SettingsPreferences] ? 'bg-brand-primary' : 'bg-border'
                          )}
                        >
                          <span className={cn(
                            'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                            currentForm.preferences[item.key as keyof SettingsPreferences] ? 'translate-x-5' : 'translate-x-0.5'
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={isSaving || !currentForm.firstName.trim()}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
                  </button>
                </div>
              </section>

              <aside className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Settings size={16} className="text-brand-primary" />
                    Бүртгэлийн мэдээлэл
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground-muted">Имэйл</span>
                      <span className="font-medium text-right break-all">{data?.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground-muted">Эрх</span>
                      <span className="font-medium">{data?.role}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground-muted">Бизнес</span>
                      <span className="font-medium">{data?._count.businesses ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-semibold text-brand-danger flex items-center gap-2 mb-3">
                    <Shield size={16} />
                    Session
                  </h3>
                  <p className="text-sm text-foreground-muted mb-4">
                    Энэ төхөөрөмжөөс гарах үед дахин нэвтрэх шаардлагатай.
                  </p>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-danger text-brand-danger text-sm font-medium hover:bg-brand-danger hover:text-white transition-all"
                  >
                    <LogOut size={15} />
                    Гарах
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
