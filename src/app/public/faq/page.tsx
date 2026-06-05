'use client'
// src/app/public/faq/page.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, HelpCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { cn } from '@/lib/utils'

const FAQ_CATEGORIES = [
  {
    category: 'Ерөнхий',
    items: [
      { q: 'Immerse Mongolia гэж юу вэ?', a: 'Immerse Mongolia нь Монголын рестораны, зочид буудал, кемп, дэлгүүр болон бусад бизнесүүдийг интерактив газрын зураг болон 360° виртуал аялалаар нээж харуулдаг бизнес нээлтийн платформ юм.' },
      { q: 'Immerse Mongolia үнэгүй ашиглаж болох уу?', a: 'Тийм! Бизнес хайх, газрын зурагт үзэх, санал хүсэлт унших зэрэг үндсэн функцүүд бүрэн үнэгүй. Зөвхөн санал бичих, газар хадгалах зэрэгт бүртгэл шаардагдана.' },
      { q: 'Монголын хаана хаанах бизнесүүд байдаг вэ?', a: 'Улаанбаатар хотоос гадна 21 аймгийн бизнесүүдийг бүртгэж, байнга нэмэгдүүлж байна.' },
    ]
  },
  {
    category: 'Бизнес эзэдэд',
    items: [
      { q: 'Бизнесээ хэрхэн бүртгүүлэх вэ?', a: 'Бүртгүүлэх хэсэгт "Бизнес эзэн" гэсэн сонголтыг идэвхжүүлж, бизнесийн мэдээллийг оруулна уу. Манай баг 1-2 ажлын өдрийн дотор шалгаж баталгаажуулна.' },
      { q: '360° виртуал аялал хэрхэн нэмэх вэ?', a: 'Мэргэжлийн болон үнэгүй тариффуудад 360° виртуал аялалын URL оруулах боломжтой. Matterport, Google Street View болон бусад платформтой нийцтэй.' },
      { q: 'Мэдэгдэл хэр хурдан нийтлэгдэх вэ?', a: '1-2 ажлын өдрийн дотор манай баг шалгаж, нийтэлнэ.' },
      { q: 'Бизнесийн мэдээллээ хэрхэн шинэчлэх вэ?', a: 'Бизнесийн панелаар нэвтэрч, жагсаалтын мэдээлэл, зураг, холбоо барих сувгуудаа шинэчилнэ үү. Тусламж хэрэгтэй бол бидэнтэй холбогдоорой.' },
    ]
  },
  {
    category: 'Төлбөр',
    items: [
      { q: 'Ямар төлбөрийн хэлбэр байдаг вэ?', a: 'QPay, Голомт банк, Хаан банк, TDB банкны карт болон банкны шилжүүлгээр төлбөр хийх боломжтой.' },
      { q: 'Тарифф цуцлах боломжтой юу?', a: 'Тийм, дурын цагт цуцлах боломжтой. Цуцлалт хийснээс хойш тарифф хугацаа дуустал үйлчилнэ.' },
      { q: 'Нэхэмжлэх авах боломжтой юу?', a: 'Тийм, бизнесийн панелаас PDF нэхэмжлэх татаж авах, и-мэйлээр хүлээн авах боломжтой.' },
    ]
  },
  {
    category: 'Техникийн',
    items: [
      { q: 'Аль гар утасны систем дэмжигддэг вэ?', a: 'iOS болон Android аль алинд нь Chrome, Safari хөтчөөр бүрэн ажиллана. Тусгай апп удахгүй гарна.' },
      { q: 'Мэдээллийг хэн бүртгэдэг вэ?', a: 'Бизнесийн эзэд өөрсдөө бүртгэж, манай баг баталгаажуулна. Хэрэглэгчид буруу мэдээлэл мэдэгдэх боломжтой.' },
    ]
  },
]

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('Бүгд')

  const allItems = FAQ_CATEGORIES.flatMap(c => c.items.map(i => ({ ...i, category: c.category })))
  const filtered = allItems.filter(item =>
    (activeCategory === 'Бүгд' || item.category === activeCategory) &&
    (item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container text-center max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="size-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={28} className="text-brand-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Түгээмэл асуулт</h1>
              <p className="text-foreground-secondary text-lg mb-8">Хариулт олдохгүй байвал бидэнтэй холбогдоно уу</p>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Асуулт хайх..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 shadow-sm" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="section-container max-w-3xl">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-8">
              {['Бүгд', ...FAQ_CATEGORIES.map(c => c.category)].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn('px-4 py-2 rounded-full text-sm font-medium border transition-all',
                    activeCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'border-border hover:border-brand-primary hover:text-brand-primary')}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-foreground-muted">Асуулт олдсонгүй. Өөр үг ашиглана уу.</p>
                </div>
              ) : (
                filtered.map((item, i) => (
                  <motion.div key={`${item.category}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button onClick={() => setOpenItem(openItem === `${i}` ? null : `${i}`)}
                      className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-background-secondary transition-colors">
                      <div>
                        <span className="text-[10px] font-semibold text-brand-primary uppercase tracking-wider block mb-1">{item.category}</span>
                        <span className="font-medium">{item.q}</span>
                      </div>
                      <ChevronDown size={18} className={cn('text-foreground-muted flex-shrink-0 mt-0.5 transition-transform', openItem === `${i}` && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {openItem === `${i}` && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-5 pb-5 text-sm text-foreground-secondary leading-relaxed border-t border-border pt-4">{item.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>

            {/* Contact nudge */}
            <div className="mt-12 p-6 rounded-2xl bg-brand-primary/6 border border-brand-primary/20 text-center">
              <p className="font-semibold mb-2">Хариулт олоогүй юу?</p>
              <p className="text-sm text-foreground-muted mb-4">Бидэнтэй шууд холбогдоно уу, 24 цагийн дотор хариу өгнө.</p>
              <a href="/public/contact" className="btn-brand py-2.5 px-6">Холбоо барих</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
