'use client'
// src/components/layout/Footer.tsx
import Link from 'next/link'
import { Globe, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
  const links = {
    platform: [
      { label: 'Нүүр', href: '/' },
      { label: 'Газрын зураг', href: '/map' },
      { label: 'Хайлт', href: '/business/search' },
      { label: 'Бидний тухай', href: '/public/about' },
    ],
    business: [
      { label: 'Бизнесээ нэмэх', href: '/auth/signup' },
      { label: 'Үнэ тариф', href: '/pricing' },
      { label: 'Бизнесийн панел', href: '/dashboard/business' },
    ],
    support: [
      { label: 'Холбоо барих', href: '/public/contact' },
      { label: 'Тусламж & FAQ', href: '/public/faq' },
      { label: 'Нүүцлалын бодлого', href: '/public/privacy' },
      { label: 'Үйлчилгээний нөхцөл', href: '/public/terms' },
    ],
  }

  return (
    <footer className="bg-background-secondary border-t border-border">
      <div className="section-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl mb-4">
              <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Globe size={18} className="text-white" />
              </div>
              <span className="gradient-text font-extrabold tracking-tight">Immerse Mongolia</span>
            </Link>
            <p className="text-sm text-foreground-muted leading-relaxed mb-5">
              Монголын бизнес нээлтийн платформ. Ресторан, зочид буудал, амралтын газар болон бусад.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: 'https://facebook.com/immersemongolia' },
                { icon: Instagram, href: 'https://instagram.com/immersemongolia' },
                { icon: Twitter, href: 'https://twitter.com/immersemongolia' },
                { icon: Youtube, href: 'https://youtube.com/@immersemongolia' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border flex items-center justify-center text-foreground-muted hover:text-brand-primary hover:border-brand-primary transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Платформ', links: links.platform },
            { title: 'Бизнес', links: links.business },
            { title: 'Тусламж', links: links.support },
          ].map(section => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
          <p>© 2026 Immerse Mongolia LLC. Монгол улс. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-brand-success animate-pulse" />
            <span>Системийн байдал: Хэвийн</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
