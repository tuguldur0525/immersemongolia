// src/app/public/terms/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Үйлчилгээний нөхцөл | Immerse Mongolia' }

export default function TermsPage() {
  const sections = [
    {
      title: '1. Нөхцөлийг зөвшөөрөх',
      content: 'Immerse Mongolia платформыг ашигласнаар та энэхүү Үйлчилгээний нөхцөлийг зөвшөөрсөнд тооцогдоно. Нөхцөлтэй санал нийлэхгүй бол платформыг ашиглахгүй байхыг хүсье.',
    },
    {
      title: '2. Бүртгэл ба нэвтрэлт',
      content: `• 18 ба түүнээс дээш насны хүн бүртгүүлж болно
• Нэвтрэх мэдээллийн нууцлалыг өөрөө хариуцна
• Нэг хүн нэгээс илүү бүртгэл үүсгэхийг хориглоно
• Бусдын нэвтрэх мэдээллийг ашиглахыг хориглоно`,
    },
    {
      title: '3. Бизнесийн бүртгэл',
      content: `• Зөвхөн өөрт хамаарах бизнесийг бүртгүүлэх эрхтэй
• Буруу болон худал мэдээлэл оруулахыг хориглоно
• Зохиомол санал хүсэлт үлдээхийг хориглоно
• Баталгаажуулалтын явцад шаардсан мэдээллийг үнэн зөв өгөх үүрэгтэй`,
    },
    {
      title: '4. Агуулгын дүрэм',
      content: `Дараах агуулгыг байршуулахыг хориглоно:
• Хүчирхийлэл, үзэл хүчирхийлэл
• Зохиогчийн эрх зөрчсөн материал
• Луйвар, хуурамч мэдээлэл
• Насанд хүрэгчдийн агуулга
• Вирус болон хортой код`,
    },
    {
      title: '5. Хариуцлага хязгаарлалт',
      content: 'Immerse Mongolia нь платформд нийтэлсэн бизнесүүдийн мэдээллийн үнэн зөв байдал, үйлчилгээний чанарыг баталгаажуулахгүй. Хэрэглэгч бизнестэй гарсан аливаа маргаанд Immerse Mongolia хариуцлага хүлээхгүй.',
    },
    {
      title: '6. Нөхцөл өөрчлөх',
      content: 'Бид нөхцөлийг хэдэн ч удаа өөрчлөх эрхтэй. Чухал өөрчлөлтийн талаар бүртгэлтэй имэйлд мэдэгдэл илгээнэ.',
    },
    {
      title: '7. Тохирох хуулийн харьяалал',
      content: 'Энэхүү нөхцөл нь Монгол Улсын хуулиар зохицуулагдана. Маргаан гарсан тохиолдолд Монгол Улсын шүүхийн харьяалалд байна.',
    },
  ]

  return (
    <>
      <Navbar />
      <main className="py-16">
        <div className="section-container max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3">Үйлчилгээний нөхцөл</h1>
            <p className="text-foreground-muted">Сүүлд шинэчлэгдсэн: 2025 оны 1 дүгээр сар</p>
          </div>

          <div className="p-5 rounded-2xl bg-brand-warning/8 border border-brand-warning/30 mb-8">
            <p className="text-sm text-foreground-secondary">
              <strong>Анхаар:</strong> Immerse Mongolia платформыг ашиглахын өмнө энэхүү нөхцөлийг анхааралтай уншина уу.
              Платформыг ашигласнаар та нөхцөлийг зөвшөөрсөнд тооцогдоно.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map(s => (
              <div key={s.title} className="p-6 rounded-2xl border border-border bg-card">
                <h2 className="text-lg font-bold mb-3">{s.title}</h2>
                <p className="text-sm text-foreground-secondary whitespace-pre-line leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-background-secondary border border-border text-center">
            <p className="text-sm text-foreground-muted">Асуулт байвал: <a href="mailto:legal@immersemongolia.mn" className="text-brand-primary hover:underline">legal@immersemongolia.mn</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
