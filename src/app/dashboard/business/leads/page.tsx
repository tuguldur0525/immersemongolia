'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Users,
} from 'lucide-react'
import BusinessDashboardShell from '@/components/dashboard/business/BusinessDashboardShell'
import { cn, formatRelativeTime } from '@/lib/utils'

type Lead = {
  id: string
  businessId: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  source: string
  isRead: boolean
  createdAt: string
  respondedAt: string | null
  business: { id: string; slug: string; name: string } | null
}

type LeadsData = {
  leads: Lead[]
  stats: { total: number; unread: number; responded: number }
  businesses: Array<{ id: string; slug: string; name: string }>
}

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  contact_form: { label: 'Холбоо барих маягт', icon: MessageSquare, color: 'text-brand-primary' },
  phone_click: { label: 'Утасны товшилт', icon: Phone, color: 'text-brand-success' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  email: { label: 'Имэйл', icon: Mail, color: 'text-brand-secondary' },
}

function readApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback
  return typeof payload.error === 'string' ? payload.error : fallback
}

export default function BusinessLeadsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'responded'>('all')
  const [businessId, setBusinessId] = useState('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<LeadsData>({
    queryKey: ['business-leads', filter, search, businessId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      if (search.trim()) params.set('search', search.trim())
      if (businessId !== 'all') params.set('businessId', businessId)
      const res = await fetch(`/api/dashboard/business/leads?${params.toString()}`, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Лидүүд ачаалж чадсангүй'))
      return payload.data
    },
    staleTime: 15_000,
  })

  async function updateLead(id: string, action: 'mark_read' | 'mark_unread' | 'mark_responded') {
    setErrorMessage('')
    try {
      const res = await fetch('/api/dashboard/business/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(readApiError(payload, 'Лид шинэчлэхэд алдаа гарлаа'))
      setOpenMenu(null)
      queryClient.invalidateQueries({ queryKey: ['business-leads'] })
    } catch (updateError) {
      setErrorMessage(updateError instanceof Error ? updateError.message : 'Лид шинэчлэхэд алдаа гарлаа')
    }
  }

  const leads = data?.leads ?? []
  const stats = data?.stats ?? { total: 0, unread: 0, responded: 0 }

  return (
    <BusinessDashboardShell
      title="Лид & Харилцагч"
      subtitle="Холбоо барих хүсэлтүүд, дуудлага, message action-ууд"
      breadcrumbs={[{ label: 'Хяналтын самбар', href: '/dashboard/business' }, { label: 'Лид & Харилцагч' }]}
    >
      <div className="space-y-6 max-w-7xl">
        {(error || errorMessage) && (
          <div className="rounded-xl border border-brand-danger/25 bg-brand-danger/8 p-4 text-sm text-brand-danger">
            {errorMessage || 'Лидүүд ачаалж чадсангүй.'}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Нийт лид', value: stats.total, color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Users },
            { label: 'Уншаагүй', value: stats.unread, color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: MessageSquare },
            { label: 'Хариулсан', value: stats.responded, color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4 min-h-[118px]">
              <div className={cn('size-9 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className="text-2xl font-bold">{isLoading ? '...' : stat.value}</p>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
            <div className="flex gap-1 bg-background-secondary rounded-xl border border-border p-1 w-fit overflow-x-auto">
              {[
                { value: 'all', label: 'Бүгд' },
                { value: 'unread', label: 'Уншаагүй' },
                { value: 'responded', label: 'Хариулсан' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as typeof filter)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    filter === tab.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {data && data.businesses.length > 1 && (
                <select
                  value={businessId}
                  onChange={(event) => setBusinessId(event.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="all">Бүх бизнес</option>
                  {data.businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
              )}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Нэр, утас, имэйлээр хайх..."
                  className="w-full sm:w-72 pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="bg-card rounded-2xl border border-border py-16 text-center text-sm text-foreground-muted">
              Ачаалж байна...
            </div>
          )}

          {!isLoading && leads.length === 0 && (
            <div className="bg-card rounded-2xl border border-border py-20 text-center">
              <MessageSquare size={36} className="text-foreground-subtle mx-auto mb-3" />
              <p className="font-medium">Харилцагч олдсонгүй</p>
              <p className="text-sm text-foreground-muted mt-1">Шүүлтүүрээ өөрчлөх эсвэл шинэ lead бүртгэгдэхийг хүлээнэ үү.</p>
            </div>
          )}

          {leads.map((lead, i) => {
            const sourceCfg = SOURCE_CONFIG[lead.source] || SOURCE_CONFIG.contact_form
            const SourceIcon = sourceCfg.icon

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'bg-card rounded-2xl border overflow-hidden transition-all',
                  !lead.isRead ? 'border-brand-primary/40 shadow-sm' : 'border-border'
                )}
                onClick={() => {
                  if (!lead.isRead) updateLead(lead.id, 'mark_read')
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'size-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
                        !lead.isRead ? 'bg-brand-primary text-white' : 'bg-background-tertiary text-foreground-muted'
                      )}>
                        {lead.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-sm truncate">{lead.name}</p>
                          {!lead.isRead && <span className="size-2 rounded-full bg-brand-primary inline-block flex-shrink-0" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                          <SourceIcon size={11} className={sourceCfg.color} />
                          <span>{sourceCfg.label}</span>
                          {lead.business && (
                            <>
                              <span>-</span>
                              <span>{lead.business.name}</span>
                            </>
                          )}
                          <span>-</span>
                          <Clock size={11} />
                          <span>{formatRelativeTime(lead.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 relative flex-shrink-0">
                      {lead.respondedAt && (
                        <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-medium">
                          <CheckCircle size={11} />
                          Хариулсан
                        </span>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setOpenMenu(openMenu === lead.id ? null : lead.id)
                        }}
                        className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center text-foreground-muted"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenu === lead.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-card border border-border shadow-xl py-1 z-10">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                              <Mail size={13} className="text-brand-primary" />
                              Имэйл бичих
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                              <Phone size={13} className="text-brand-success" />
                              Утасдах
                            </a>
                          )}
                          <button
                            onClick={() => updateLead(lead.id, lead.isRead ? 'mark_unread' : 'mark_read')}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors"
                          >
                            <MessageSquare size={13} className="text-brand-primary" />
                            {lead.isRead ? 'Уншаагүй болгох' : 'Уншсан болгох'}
                          </button>
                          {!lead.respondedAt && (
                            <button
                              onClick={() => updateLead(lead.id, 'mark_responded')}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors"
                            >
                              <CheckCircle size={13} className="text-brand-success" />
                              Хариулсан гэж тэмдэглэх
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-3">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand-primary transition-colors">
                        <Phone size={12} />
                        {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand-primary transition-colors">
                        <Mail size={12} />
                        {lead.email}
                      </a>
                    )}
                  </div>

                  {lead.message && (
                    <div className="p-3 rounded-xl bg-background-secondary text-sm text-foreground-secondary leading-relaxed">
                      {lead.message}
                    </div>
                  )}

                  {!lead.respondedAt && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-success/10 text-brand-success text-xs font-medium hover:bg-brand-success/20 transition-colors">
                          <Phone size={13} />
                          Залгах
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20 transition-colors">
                          <Mail size={13} />
                          Хариу бичих
                        </a>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          updateLead(lead.id, 'mark_responded')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background-secondary transition-colors ml-auto"
                      >
                        <CheckCircle size={13} />
                        Хариулсан
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </BusinessDashboardShell>
  )
}
