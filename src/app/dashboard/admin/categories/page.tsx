'use client'
// src/app/dashboard/admin/categories/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Edit3, Trash2, GripVertical, Eye, EyeOff, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const INITIAL_CATEGORIES = [
  { id: '1', slug: 'restaurants', nameMn: 'Ресторан', nameEn: 'Restaurants', icon: '🍜', color: '#ef4444', businessCount: 420, isActive: true, sortOrder: 1 },
  { id: '2', slug: 'hotels', nameMn: 'Зочид буудал', nameEn: 'Hotels', icon: '🏨', color: '#3b82f6', businessCount: 186, isActive: true, sortOrder: 2 },
  { id: '3', slug: 'camps', nameMn: 'Кемп & Амралт', nameEn: 'Camps & Resorts', icon: '⛺', color: '#22c55e', businessCount: 94, isActive: true, sortOrder: 3 },
  { id: '4', slug: 'shopping', nameMn: 'Дэлгүүр', nameEn: 'Shopping', icon: '🛍️', color: '#f59e0b', businessCount: 312, isActive: true, sortOrder: 4 },
  { id: '5', slug: 'fitness', nameMn: 'Фитнэс & Спорт', nameEn: 'Fitness & Sports', icon: '💪', color: '#8b5cf6', businessCount: 78, isActive: true, sortOrder: 5 },
  { id: '6', slug: 'salons', nameMn: 'Салон & Гоо сайхан', nameEn: 'Beauty & Salons', icon: '💇', color: '#ec4899', businessCount: 143, isActive: true, sortOrder: 6 },
  { id: '7', slug: 'entertainment', nameMn: 'Цэнгэл & Тоглоом', nameEn: 'Entertainment', icon: '🎮', color: '#06b6d4', businessCount: 56, isActive: false, sortOrder: 7 },
  { id: '8', slug: 'medical', nameMn: 'Эрүүл мэнд', nameEn: 'Healthcare', icon: '🏥', color: '#10b981', businessCount: 89, isActive: true, sortOrder: 8 },
]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nameMn: '', nameEn: '', slug: '', icon: '', color: '#3b82f6' })

  function toggleActive(id: string) {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
  }

  function startEdit(cat: typeof INITIAL_CATEGORIES[0]) {
    setEditId(cat.id)
    setFormData({ nameMn: cat.nameMn, nameEn: cat.nameEn, slug: cat.slug, icon: cat.icon, color: cat.color })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Хяналтын самбар</Link>
          <span>/</span>
          <span>Ангилал</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Ангиллын удирдлага</h1>
          <button onClick={() => { setEditId(null); setFormData({ nameMn: '', nameEn: '', slug: '', icon: '', color: '#3b82f6' }); setShowForm(true) }}
            className="btn-brand py-2 text-sm">
            <Plus size={15} />
            Ангилал нэмэх
          </button>
        </div>
      </header>

      <main className="p-6 max-w-5xl">
        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h3 className="font-bold mb-5">{editId ? 'Ангилал засах' : 'Шинэ ангилал нэмэх'}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Монголоор нэр *</label>
                <input value={formData.nameMn} onChange={e => setFormData(f => ({ ...f, nameMn: e.target.value }))}
                  placeholder="жнь: Ресторан"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Англи нэр</label>
                <input value={formData.nameEn} onChange={e => setFormData(f => ({ ...f, nameEn: e.target.value }))}
                  placeholder="e.g. Restaurants"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Slug *</label>
                <input value={formData.slug} onChange={e => setFormData(f => ({ ...f, slug: e.target.value }))}
                  placeholder="restaurants"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Emoji icon</label>
                <input value={formData.icon} onChange={e => setFormData(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🍜"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Өнгө</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formData.color} onChange={e => setFormData(f => ({ ...f, color: e.target.value }))}
                    className="size-10 rounded-lg border border-border cursor-pointer" />
                  <span className="text-sm font-mono text-foreground-secondary">{formData.color}</span>
                </div>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-secondary border border-border w-full">
                  <div className="size-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${formData.color}20` }}>
                    {formData.icon || '📁'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{formData.nameMn || 'Нэр байхгүй'}</p>
                    <p className="text-xs text-foreground-muted">{formData.nameEn || 'No English name'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-background-secondary transition-colors">
                Болих
              </button>
              <button className="btn-brand py-2.5 px-6">
                {editId ? 'Шинэчлэх' : 'Нэмэх'}
              </button>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-foreground-muted">{categories.length} ангилал, {categories.filter(c => c.isActive).length} идэвхтэй</p>
          </div>
          <div className="divide-y divide-border">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={cn('flex items-center gap-4 px-5 py-4 hover:bg-background-secondary transition-colors', !cat.isActive && 'opacity-50')}>
                <button className="text-foreground-subtle hover:text-foreground-muted cursor-grab">
                  <GripVertical size={16} />
                </button>

                <div className="size-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${cat.color}18` }}>
                  {cat.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{cat.nameMn}</p>
                    {!cat.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background-tertiary text-foreground-muted font-medium">Идэвхгүй</span>}
                  </div>
                  <p className="text-xs text-foreground-muted">{cat.nameEn} • /{cat.slug}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Tag size={13} />
                  <span>{cat.businessCount} бизнес</span>
                </div>

                <div className="size-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />

                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(cat.id)}
                    className={cn('size-8 rounded-lg flex items-center justify-center transition-colors',
                      cat.isActive ? 'text-brand-success hover:bg-brand-success/10' : 'text-foreground-muted hover:bg-background-tertiary')}>
                    {cat.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => startEdit(cat)}
                    className="size-8 rounded-lg hover:bg-background-tertiary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button className="size-8 rounded-lg hover:bg-brand-danger/10 flex items-center justify-center text-foreground-muted hover:text-brand-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-foreground-muted mt-3 text-center">
          Эрэмбийг өөрчлөхийн тулд мөрийг чирнэ үү
        </p>
      </main>
    </div>
  )
}
