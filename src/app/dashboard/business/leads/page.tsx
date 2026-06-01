'use client'
// src/app/dashboard/business/leads/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, Mail, MessageSquare, Clock, CheckCircle, Search, Filter, MoreVertical, Users } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  source: string
  isRead: boolean
  createdAt: string
  respondedAt: string | null
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Б. Дулмаа', email: 'dulmaa@gmail.com', phone: '+976 9912-3456', message: 'Маш сайхан хоол байна. Бүлгийн захиалга хийж болох уу? 20 хүн байна.', source: 'contact_form', isRead: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), respondedAt: null },
  { id: '2', name: 'Г. Оюунчимэг', email: null, phone: '+976 8811-2233', message: null, source: 'phone_click', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString(), respondedAt: null },
  { id: '3', name: 'Д. Энхбаатар', email: 'enhbaatar@company.mn', phone: '+976 9955-6677', message: 'Байгууллагын хоол захиалгын талаар ярилцмаар байна. Ажлын цагт холбогдоно уу.', source: 'contact_form', isRead: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), respondedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', name: 'О. Сувд', email: 'suvd@mail.mn', phone: null, message: 'Эрсдэлгүй захиалга хийж болох уу? Дараагийн Бямба гарагт 8 хүн байна.', source: 'whatsapp', isRead: false, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), respondedAt: null },
]

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  contact_form: { label: 'Холбоо барих маягт', icon: MessageSquare, color: 'text-brand-primary' },
  phone_click: { label: 'Утасны товшилт', icon: Phone, color: 'text-brand-success' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  email: { label: 'Имэйл', icon: Mail, color: 'text-brand-secondary' },
}

export default function BusinessLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'responded'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = leads.filter(l => {
    if (filter === 'unread' && l.isRead) return false
    if (filter === 'responded' && !l.respondedAt) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) &&
        !(l.email || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function markRead(id: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, isRead: true } : l))
  }

  function markResponded(id: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, respondedAt: new Date().toISOString(), isRead: true } : l))
  }

  const unreadCount = leads.filter(l => !l.isRead).length

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/business" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Лид & Харилцагч</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg">Лид & Харилцагч</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-danger text-white text-xs font-bold">
                {unreadCount} шинэ
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хайх..."
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background-secondary text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Нийт лид', value: leads.length, color: 'text-brand-primary', bg: 'bg-brand-primary/10', icon: Users },
            { label: 'Уншаагүй', value: unreadCount, color: 'text-brand-danger', bg: 'bg-brand-danger/10', icon: MessageSquare },
            { label: 'Хариулсан', value: leads.filter(l => l.respondedAt).length, color: 'text-brand-success', bg: 'bg-brand-success/10', icon: CheckCircle },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={cn('size-9 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-card rounded-xl border border-border p-1 w-fit">
          {[
            { value: 'all', label: 'Бүгд' },
            { value: 'unread', label: 'Уншаагүй' },
            { value: 'responded', label: 'Хариулсан' },
          ].map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value as typeof filter)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filter === tab.value ? 'bg-brand-primary text-white' : 'text-foreground-muted hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leads list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border py-20 text-center">
              <MessageSquare size={36} className="text-foreground-subtle mx-auto mb-3" />
              <p className="font-medium">Харилцагч олдсонгүй</p>
            </div>
          ) : (
            filtered.map((lead, i) => {
              const sourceCfg = SOURCE_CONFIG[lead.source] || SOURCE_CONFIG.contact_form
              const SourceIcon = sourceCfg.icon

              return (
                <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn('bg-card rounded-2xl border overflow-hidden transition-all',
                    !lead.isRead ? 'border-brand-primary/40 shadow-sm' : 'border-border')}
                  onClick={() => markRead(lead.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('size-10 rounded-xl flex items-center justify-center font-bold text-white text-sm',
                          !lead.isRead ? 'bg-brand-primary' : 'bg-background-tertiary text-foreground-muted')}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{lead.name}</p>
                            {!lead.isRead && (
                              <span className="size-2 rounded-full bg-brand-primary inline-block" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <SourceIcon size={11} className={sourceCfg.color} />
                            <span>{sourceCfg.label}</span>
                            <span>•</span>
                            <Clock size={11} />
                            <span>{formatRelativeTime(lead.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 relative">
                        {lead.respondedAt && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-medium">
                            <CheckCircle size={11} />
                            Хариулсан
                          </span>
                        )}
                        <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === lead.id ? null : lead.id) }}
                          className="size-8 rounded-lg hover:bg-background-secondary flex items-center justify-center text-foreground-muted">
                          <MoreVertical size={14} />
                        </button>
                        {openMenu === lead.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-card border border-border shadow-xl py-1 z-10">
                            {lead.email && (
                              <a href={`mailto:${lead.email}`}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Mail size={13} className="text-brand-primary" />
                                Имэйл бичих
                              </a>
                            )}
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <Phone size={13} className="text-brand-success" />
                                Утасдах
                              </a>
                            )}
                            {!lead.respondedAt && (
                              <button onClick={() => markResponded(lead.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-background-secondary transition-colors">
                                <CheckCircle size={13} className="text-brand-success" />
                                Хариулсан гэж тэмдэглэх
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand-primary transition-colors">
                          <Phone size={12} />
                          {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand-primary transition-colors">
                          <Mail size={12} />
                          {lead.email}
                        </a>
                      )}
                    </div>

                    {/* Message */}
                    {lead.message && (
                      <div className="p-3 rounded-xl bg-background-secondary text-sm text-foreground-secondary leading-relaxed">
                        "{lead.message}"
                      </div>
                    )}

                    {/* Quick actions */}
                    {!lead.respondedAt && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-success/10 text-brand-success text-xs font-medium hover:bg-brand-success/20 transition-colors">
                            <Phone size={13} />
                            Залгах
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20 transition-colors">
                            <Mail size={13} />
                            Хариу бичих
                          </a>
                        )}
                        <button onClick={e => { e.stopPropagation(); markResponded(lead.id) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-background-secondary transition-colors ml-auto">
                          <CheckCircle size={13} />
                          Хариулсан
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
