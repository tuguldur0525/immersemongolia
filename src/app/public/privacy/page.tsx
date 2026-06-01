// src/app/public/privacy/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Нууцлалын бодлого | Immerse Mongolia' }

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Цуглуулдаг мэдээлэл',
      content: `Бид дараах мэдээллийг цуглуулдаг:

• Бүртгэлийн мэдээлэл: нэр, имэйл хаяг, утасны дугаар
• Хэрэглэлтийн мэдээлэл: хайлт, хандалт, харилцан үйлдэл
• Байршлын мэдээлэл: зөвшөөрсөн тохиолдолд
• Гэрчилгээ мэдээлэл: бизнес нэхэмжлэлийн баримт бичиг
• Төлбөрийн мэдээлэл: QPay болон банкны гүйлгээний бүртгэл`
    },
    {
      title: '2. Мэдээллийг ашиглах зорилго',
      content: `Цуглуулсан мэдээллийг дараах зорилгоор ашиглана:

• Платформын үйлчилгээ үзүүлэх
• Бизнесийг баталгаажуулах
• Хэрэглэгчийн туршлагыг сайжруулах
• Хууль ёсны шаардлагыг биелүүлэх
• Аюулгүй байдлыг хангах`
    },
    {
      title: '3. Мэдээлэл хамгаалалт',
      content: `Таны мэдээллийн аюулгүй байдлыг хангахын тулд:

• SSL/TLS шифрлэлт ашигладаг
• Supabase Row Level Security ашигладаг
• Нууц үгийг bcrypt-ээр шифрлэдэг
• Хандалтын бүртгэл хөтөлдөг
• Гуравдагч талд зардаггүй`
    },
    {
      title: '4. Гуравдагч тал',
      content: `Дараах гуравдагч талуудтай ажилладаг:

• Supabase — мэдээллийн сан (АНУ)
• Mapbox — газрын зурагны үйлчилгээ
• Resend — имэйл илгээх үйлчилгээ
• QPay — төлбөрийн систем (Монгол)
• Vercel — вэб хостинг`
    },
    {
      title: '5. Хэрэглэгчийн эрх',
      content: `Та дараах эрхтэй:

• Хувийн мэдээллийн тайлан авах
• Буруу мэдээллийг засах
• Мэдээллийг устгуулах хүсэлт гаргах
• Мэдэгдэл хүлээн авахаас татгалзах
• Нэхэмжлэл гаргах`
    },
    {
      title: '6. Холбоо барих',
      content: 'Нууцлалын асуудлаар privacy@immersemongolia.mn хаяг руу хандана уу.'
    },
  ]

  return (
    <>
      <Navbar />
      <main className="py-16">
        <div className="section-container max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3">Нууцлалын бодлого</h1>
            <p className="text-foreground-muted">Сүүлд шинэчлэгдсэн: 2025 оны 1 дүгээр сар</p>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-foreground-secondary leading-relaxed mb-8">
              Immerse Mongolia LLC ("бид", "манай") нь таны хувийн мэдээллийг хамгаалах үүргийг чухалчлан үздэг.
              Энэхүү нууцлалын бодлого нь манай платформыг ашигласнаар ямар мэдээлэл цуглуулагдах,
              хэрхэн ашиглагдах, хамгаалагдах талаар тайлбарлана.
            </p>

            <div className="space-y-8">
              {sections.map(section => (
                <div key={section.title} className="p-6 rounded-2xl border border-border bg-card">
                  <h2 className="text-lg font-bold mb-4">{section.title}</h2>
                  <div className="text-sm text-foreground-secondary whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
