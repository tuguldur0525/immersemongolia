'use client'
// src/app/dashboard/business/analytics/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Eye, Heart, Phone, Globe, Star, MapPin, ArrowUp, ArrowDown, Calendar, Download } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { cn } from '@/lib/utils'

const PERIODS = ['7 хоног', '30 хоног', '3 сар', '1 жил']

// Mock chart data
const generateData = (days: number) =>
  Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }),
    views: Math.floor(40 + Math.random() * 80),
    saves: Math.floor(5 + Math.random() * 20),
    clicks: Math.floor(10 + Math.random() * 30),
    phoneClicks: Math.floor(2 + Math.random() * 10),
  }))

const SOURCE_DATA = [
  { name: 'Шууд хандалт', value: 42, color: '#3b82f6' },
  { name: 'Хайлтаас', value: 31, color: '#8b5cf6' },
  { name: 'Газрын зургаас', value: 18, color: '#22c55e' },
  { name: 'Сошиалаас', value: 9, color: '#f59e0b' },
]

const METRIC_CARDS = [
  { label: 'Нийт харалт', value: '1,840', delta: 12.4, icon: Eye, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { label: 'Хадгалсан', value: '142', delta: 8.2, icon: Heart, color: 'text-brand-danger', bg: 'bg-brand-danger/10' },
  { label: 'Утас товших', value: '67', delta: -3.1, icon: Phone, color: 'text-brand-success', bg: 'bg-brand-success/10' },
  { label: 'Вэб товших', value: '34', delta: 15.7, icon: Globe, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
  { label: 'Дундаж үнэлгээ', value: '4.3', delta: 0.2, icon: Star, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  { label: 'Газрын зурагт', value: '89', delta: 22.0, icon: MapPin, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
]

export default function BusinessAnalyticsPage() {
  const [period, setPeriod] = useState('30 хоног')
  const days = period === '7 хоног' ? 7 : period === '30 хоног' ? 30 : period === '3 сар' ? 90 : 365
  const chartData = generateData(Math.min(days, 30))

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
              <Link href="/dashboard/business" className="hover:text-foreground">Хяналтын самбар</Link>
              <span>/</span>
              <span>Аналитик</span>
            </div>
            <h1 className="font-bold text-lg">Аналитик тайлан</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Period picker */}
            <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl border border-border">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    period === p ? 'bg-card shadow-sm text-foreground' : 'text-foreground-muted hover:text-foreground')}>
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors">
              <Download size={15} />
              Татах
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {METRIC_CARDS.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4 border border-border">
              <div className={cn('size-9 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="text-xl font-bold mb-0.5">{card.value}</p>
              <p className="text-xs text-foreground-muted mb-1.5">{card.label}</p>
              <div className={cn('flex items-center gap-1 text-xs font-medium', card.delta >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
                {card.delta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {Math.abs(card.delta)}%
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main chart — Views over time */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-base">Харалтын динамик</h2>
              <p className="text-sm text-foreground-muted">Сүүлийн {period}ийн харалтын тоо</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-primary" />Харалт</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-success" />Хадгалсан</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-brand-accent" />Товших</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 85% 57%)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(220 85% 57%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="savesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155 65% 42%)" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="hsl(155 65% 42%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(220 10% 58%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 10% 58%)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(220 85% 57%)" strokeWidth={2} fill="url(#viewsGrad)" name="Харалт" />
              <Area type="monotone" dataKey="saves" stroke="hsl(155 65% 42%)" strokeWidth={2} fill="url(#savesGrad)" name="Хадгалсан" />
              <Area type="monotone" dataKey="clicks" stroke="hsl(35 95% 55%)" strokeWidth={2} fill="none" strokeDasharray="4 4" name="Товших" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart — clicks by type */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-base mb-1">Товших төрөл</h2>
            <p className="text-sm text-foreground-muted mb-5">Хэрэглэгч хаана товшиж байна</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Утас', value: 67 },
                { name: 'Вэбсайт', value: 34 },
                { name: 'Газрын зураг', value: 89 },
                { name: 'Чиглэл', value: 22 },
                { name: 'WhatsApp', value: 15 },
              ]} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(220 85% 57%)" radius={[6,6,0,0]} name="Тоо" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie — traffic sources */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-bold text-base mb-1">Хандалтын эх үүсвэр</h2>
            <p className="text-sm text-foreground-muted mb-5">Хэрэглэгч хаанаас ирж байна</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={SOURCE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {SOURCE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {SOURCE_DATA.map(src => (
                  <div key={src.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full flex-shrink-0" style={{ background: src.color }} />
                      <span className="text-xs text-foreground-secondary">{src.name}</span>
                    </div>
                    <span className="text-xs font-semibold">{src.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top search keywords */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-base mb-4">Хайлтын түлхүүр үгс</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-muted">
                <tr className="border-b border-border">
                  <th className="text-left pb-3 font-medium">Түлхүүр үг</th>
                  <th className="text-right pb-3 font-medium">Харагдалт</th>
                  <th className="text-right pb-3 font-medium">Товших</th>
                  <th className="text-right pb-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { keyword: 'монгол ресторан', impressions: 420, clicks: 67, ctr: '15.9%' },
                  { keyword: 'улаанбаатар хоол', impressions: 312, clicks: 45, ctr: '14.4%' },
                  { keyword: 'уламжлалт хоол', impressions: 189, clicks: 22, ctr: '11.6%' },
                  { keyword: 'ресторан захиалга', impressions: 145, clicks: 18, ctr: '12.4%' },
                  { keyword: 'mongolian restaurant', impressions: 98, clicks: 14, ctr: '14.3%' },
                ].map(row => (
                  <tr key={row.keyword} className="hover:bg-background-secondary transition-colors">
                    <td className="py-3 font-medium">{row.keyword}</td>
                    <td className="py-3 text-right text-foreground-secondary">{row.impressions}</td>
                    <td className="py-3 text-right text-foreground-secondary">{row.clicks}</td>
                    <td className="py-3 text-right text-brand-success font-medium">{row.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
