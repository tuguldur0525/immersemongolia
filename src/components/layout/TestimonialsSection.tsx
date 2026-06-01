'use client'
// src/components/layout/TestimonialsSection.tsx
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    id: 1, name: 'Б. Мөнхбаяр', role: 'Ресторан эзэн', rating: 5,
    text: 'Immerse Mongolia дээр бүртгүүлснээс хойш манай ресторанд орох хүний тоо 3 дахин нэмэгдсэн. Платформ маш хялбар ашиглагддаг.',
    avatar: 'М',
  },
  {
    id: 2, name: 'О. Энхтуяа', role: 'Аялагч', rating: 5,
    text: 'Улаанбаатарт шинэ газар хайхдаа Immerse Mongolia-г ашигладаг. Газрын зурагтай нь маш тохиромжтой, мэдээлэл нь нарийвчлалтай.',
    avatar: 'Э',
  },
  {
    id: 3, name: 'Д. Батболд', role: 'Зочид буудлын менежер', rating: 5,
    text: '360° виртуал аялалын боломж манай зочид буудалд хэрэглэгчдийн анхаарлыг маш их татсан. Захиалга мэдэгдэхүйц нэмэгдлээ.',
    avatar: 'Д',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-primary font-medium text-sm mb-2 block">Хэрэглэгчдийн санал</span>
          <h2 className="text-3xl sm:text-4xl font-bold">Тэд юу хэлэв?</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-4"
            >
              <Quote size={28} className="text-brand-primary/30" />
              <p className="text-foreground-secondary leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} className={s <= t.rating ? 'text-brand-accent fill-current' : 'text-foreground-subtle'} />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-brand-primary/15 flex items-center justify-center font-bold text-brand-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-foreground-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
