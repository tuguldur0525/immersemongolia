'use client'
// src/app/public/about/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import { MapPin, Target, Users, Globe, Award } from 'lucide-react'
import Link from 'next/link'
import { usePlatformStats } from '@/hooks'
import { formatInteger } from '@/lib/utils'

export default function AboutPage() {
  const { data: platformStats } = usePlatformStats()
  const values = [
    { icon: Target, title: 'Зорилго', desc: 'Монголын аж ахуйн нэгжүүдийг дижитал ертөнцтэй холбож, хэрэглэгчдэд шинэ нээлтийн туршлага өгөх.' },
    { icon: Users, title: 'Хамтын ажиллагаа', desc: 'Бизнес эзэд болон хэрэглэгчдийн хооронд итгэлт, ил тод харилцааг дэмжинэ.' },
    { icon: Globe, title: 'Инноваци', desc: '360° виртуал аялал, интерактив газрын зураг зэрэг тэргүүлэх технологиор дамжуулан туршлагыг сайжруулна.' },
    { icon: Award, title: 'Чанар', desc: 'Мэдээллийн нарийвчлал, платформын найдвартай байдлыг хамгийн чухал зүйл гэж үздэг.' },
  ]

  const team = [
    { name: 'Б. Мөнхбаяр', role: 'Үүсгэн байгуулагч & CEO', initials: 'БМ' },
    { name: 'О. Энхтуяа', role: 'CTO', initials: 'ОЭ' },
    { name: 'Д. Батболд', role: 'Бүтээгдэхүүний захирал', initials: 'ДБ' },
    { name: 'С. Нарантуяа', role: 'Маркетингийн захирал', initials: 'СН' },
  ]
  const stats = [
    { value: '2025', label: 'Үүссэн он' },
    { value: formatInteger(platformStats?.totalBusinesses ?? 0), label: 'Бизнесүүд' },
    { value: formatInteger(platformStats?.totalUsers ?? 0), label: 'Хэрэглэгчид' },
    { value: formatInteger(platformStats?.coveredCities ?? 0), label: 'Хот/аймаг' },
  ]

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="section-container relative text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2.5 mb-6">
                <div className="size-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">
                  <MapPin size={22} className="text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">Immerse Mongolia</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-balance">
                Монголыг дижитал зургаар<br />нээж харуулна
              </h1>
              <p className="text-foreground-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                Immerse Mongolia нь Монголын рестораны, зочид буудал, амралтын газар болон бусад бизнесүүдийг
                орчин үеийн технологиор дамжуулан хэрэглэгчдэд нээж харуулах зорилготой платформ юм.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-background-secondary">
          <div className="section-container grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                <p className="text-4xl font-bold gradient-text mb-1">{s.value}</p>
                <p className="text-sm text-foreground-muted">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="section-container grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-brand-primary font-medium text-sm mb-3 block">Бидний тухай</span>
              <h2 className="text-3xl font-bold mb-5">Яагаад Immerse Mongolia гэж?</h2>
              <div className="space-y-4 text-foreground-secondary leading-relaxed">
                <p>Монголд аялагч болон нутгийн хүмүүс газар хайхдаа найдвартай мэдээлэл авахад хэцүү байдаг. Найзаасаа асуух, буруу хаягаар очих — эдгээр асуудлыг шийдэхийг бид зорьсон.</p>
                <p>Immerse Mongolia дээр бизнесийн бодит мэдээлэл, зургийн галерей, 360° виртуал аялал болон хэрэглэгчдийн санал хүсэлтийг нэг дороос олж, шийдвэр гаргахад хялбар болгодог.</p>
                <p>Бид 2025 онд үүсгэн байгуулагдсан. Монголын дижитал экосистемд ач холбогдолтой бүтээгдэхүүн бий болгох нь бидний гол зорилго.</p>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-2xl border border-border bg-card">
                  <div className="size-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-3">
                    <v.icon size={18} className="text-brand-primary" />
                  </div>
                  <h4 className="font-semibold mb-1.5 text-sm">{v.title}</h4>
                  <p className="text-xs text-foreground-muted leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Манай баг</h2>
              <p className="text-foreground-muted">Монголын шилдэг мэргэжилтнүүд</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member, i) => (
                <motion.div key={member.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                  <div className="size-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-glow-brand">
                    {member.initials}
                  </div>
                  <h4 className="font-semibold text-sm mb-0.5">{member.name}</h4>
                  <p className="text-xs text-foreground-muted">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="section-container text-center">
            <h2 className="text-3xl font-bold mb-4">Бидэнтэй нэгдэнэ үү</h2>
            <p className="text-foreground-muted mb-8">Бизнесээ бүртгүүлж, Монголын хамгийн том бизнесийн платформд байршина уу.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn-brand px-8 py-3.5">Бүртгүүлэх</Link>
              <Link href="/public/contact" className="px-8 py-3.5 rounded-xl border border-border font-medium text-sm hover:border-brand-primary hover:text-brand-primary transition-colors">Холбоо барих</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
