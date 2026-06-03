"use client";
// src/app/page.tsx — Immerse Mongolia Home Page

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hotel,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  ChevronRight,
  Tent,
  TrendingUp,
  Utensils,
  Users,
  Building2,
  Globe,
} from "lucide-react";
import HeroSearchBar from "@/components/layout/HeroSearchBar";
import CategoryGrid from "@/components/business/CategoryGrid";
import FeaturedBusinesses from "@/components/business/FeaturedBusinesses";
import MapPreview from "@/components/map/MapPreview";
import TestimonialsSection from "@/components/layout/TestimonialsSection";
import StatsSection from "@/components/layout/StatsSection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { usePlatformStats } from "@/hooks";
import { formatInteger } from "@/lib/utils";

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroLinks = [
  {
    label: "Ресторан",
    href: "/business/search?categorySlug=restaurants",
    icon: Utensils,
  },
  {
    label: "Зочид буудал",
    href: "/business/search?categorySlug=hotels",
    icon: Hotel,
  },
  { label: "Кемп", href: "/business/search?categorySlug=camps", icon: Tent },
  {
    label: "Дэлгүүр",
    href: "/business/search?categorySlug=shopping",
    icon: ShoppingBag,
  },
];

const heroPins = [
  {
    label: "Ресторан",
    top: "24%",
    left: "26%",
    icon: Utensils,
    color: "bg-brand-danger",
  },
  {
    label: "Зочид буудал",
    top: "38%",
    left: "64%",
    icon: Hotel,
    color: "bg-brand-primary",
  },
  {
    label: "Кемп",
    top: "62%",
    left: "35%",
    icon: Tent,
    color: "bg-brand-success",
  },
  {
    label: "Дэлгүүр",
    top: "55%",
    left: "72%",
    icon: ShoppingBag,
    color: "bg-brand-accent",
  },
];

export default function HomePage() {
  const { data: platformStats } = usePlatformStats();
  const heroStats = [
    {
      label: "Бизнес",
      value: formatInteger(platformStats?.totalBusinesses ?? 0),
      icon: Building2,
    },
    {
      label: "Үнэлгээ",
      value: formatInteger(platformStats?.totalReviews ?? 0),
      icon: Star,
    },
    {
      label: "Хэрэглэгч",
      value: formatInteger(platformStats?.totalUsers ?? 0),
      icon: Users,
    },
  ];
  const featuredCount = platformStats?.featuredBusinesses ?? 0;
  const activeBusinessCount = platformStats?.totalBusinesses ?? 0;

  return (
    <>
      <Navbar transparent />

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-hero-gradient pt-20 sm:pt-28 lg:flex lg:min-h-[660px] lg:items-center lg:pt-24">
          <div
            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 68%, transparent 100%)",
            }}
          />

          <div className="section-container relative z-10 pb-14 lg:pb-16">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)] xl:gap-14">
              <motion.div
                variants={stagger}
                initial="initial"
                animate="animate"
                className="max-w-4xl"
              >
                <motion.h1
                  variants={fadeUp}
                  className="mb-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-normal text-foreground text-balance sm:text-5xl lg:text-6xl"
                >
                  Монголын хамгийн
                  <span className="gradient-text block py-2">
                    шилдэг газруудыг
                  </span>
                  нээж илрүүл
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mb-6 max-w-2xl text-base font-medium leading-7 text-foreground-secondary sm:mb-7 sm:text-lg sm:leading-8"
                >
                  Ресторан, зочид буудал, амралтын газар, дэлгүүрийг нэг дороос
                  хайж, үнэлгээ болон газрын зурагтай нь харьцуул.
                </motion.p>
                <motion.div variants={fadeUp} className="max-w-4xl">
                  <HeroSearchBar />
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  className="mt-5 flex flex-wrap gap-2.5"
                >
                  {heroLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/78 px-3.5 py-2 text-sm font-semibold text-foreground-secondary shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:border-brand-primary/50 hover:bg-card hover:text-brand-primary dark:bg-card/78"
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  ))}
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  className="mt-7 hidden max-w-2xl grid-cols-3 gap-2 rounded-2xl border border-border/75 bg-white/66 p-2 shadow-sm backdrop-blur dark:bg-card/66 sm:grid"
                >
                  {heroStats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl px-3 py-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-brand-primary">
                        <Icon size={15} />
                        <span className="text-[11px] font-bold uppercase text-foreground-muted">
                          {label}
                        </span>
                      </div>
                      <p className="text-lg font-black leading-none text-foreground sm:text-xl">
                        {value}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="hidden lg:block"
              >
                <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 p-3 shadow-xl shadow-slate-900/12 backdrop-blur-xl dark:border-border/80 dark:bg-card/82">
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Улаанбаатар
                      </p>
                      <p className="text-xs font-medium text-foreground-muted">
                        Газрын зураг дээрх нээлт
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-success/10 px-3 py-1 text-xs font-bold text-brand-success">
                      <ShieldCheck size={13} />
                      Live
                    </div>
                  </div>

                  <div className="relative h-[330px] overflow-hidden rounded-[1.45rem] border border-border/75 bg-[linear-gradient(135deg,hsl(var(--background-secondary)),hsl(var(--brand-primary)/0.10),hsl(var(--brand-secondary)/0.14))]">
                    <div
                      className="absolute inset-0 opacity-[0.22]"
                      style={{
                        backgroundImage:
                          "linear-gradient(35deg, transparent 47%, hsl(var(--foreground) / 0.18) 48%, hsl(var(--foreground) / 0.18) 52%, transparent 53%), linear-gradient(125deg, transparent 47%, hsl(var(--foreground) / 0.14) 48%, hsl(var(--foreground) / 0.14) 52%, transparent 53%), linear-gradient(hsl(var(--foreground) / 0.10) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.10) 1px, transparent 1px)",
                        backgroundSize:
                          "190px 190px, 210px 210px, 42px 42px, 42px 42px",
                      }}
                    />

                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/80 bg-white/86 px-3 py-2 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                      <Navigation size={14} className="text-brand-primary" />
                      47.9189, 106.9176
                    </div>

                    {heroPins.map(({ label, top, left, icon: Icon, color }) => (
                      <div
                        key={label}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top, left }}
                      >
                        <div
                          className={`mx-auto flex size-10 items-center justify-center rounded-2xl border-2 border-white text-white shadow-lg ${color}`}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="mt-1 rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
                          {label}
                        </div>
                      </div>
                    ))}

                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                          <Search size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground">
                            {featuredCount > 0
                              ? `Өнөөдөр онцлох ${formatInteger(featuredCount)} газар`
                              : `Нийт ${formatInteger(activeBusinessCount)} газар`}
                          </p>
                          <p className="text-xs font-medium text-foreground-muted">
                            Үнэлгээ, зай, ангиллаар эрэмбэлэгдэнэ
                          </p>
                        </div>
                        <Link
                          href="/map"
                          className="rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background transition-colors hover:bg-brand-primary"
                        >
                          Нээх
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Categories ───────────────────────────────────────────────────── */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ангилалаар хайх
              </h2>
              <p className="text-foreground-secondary text-lg">
                Таны хайж буй зүйлийг олоорой
              </p>
            </motion.div>
            <Suspense
              fallback={
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl bg-background-tertiary"
                    />
                  ))}
                </div>
              }
            >
              <CategoryGrid />
            </Suspense>
          </div>
        </section>

        {/* ── Featured Businesses ───────────────────────────────────────── */}
        <section className="py-20">
          <div className="section-container">
            <div className="flex items-center justify-between mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-brand-primary font-medium text-sm mb-2 block">
                  Онцлох газрууд
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Санал болгох газрууд
                </h2>
              </motion.div>
              <Link
                href="/business/search?featured=true"
                className="hidden sm:flex items-center gap-1 text-brand-primary hover:underline text-sm font-medium"
              >
                Бүгдийг харах <ChevronRight size={16} />
              </Link>
            </div>
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedBusinesses />
            </Suspense>
          </div>
        </section>

        {/* ── Interactive Map Preview ───────────────────────────────────── */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <span className="text-brand-primary font-medium text-sm mb-3 block flex items-center gap-2">
                  <MapPin size={16} />
                  Интерактив газрын зураг
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
                  Газрын зургаас шууд нээж илрүүлэх
                </h2>
                <p className="text-foreground-secondary text-lg leading-relaxed mb-8">
                  Байршил дээрээ тулгуурлан ойролцоо газруудыг олж, нэг
                  товшилтоор дэлгэрэнгүй мэдээллийг авна уу.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Ангиллаар шүүх",
                    "Ойрын газруудыг нээх",
                    "Чиглэл авах",
                    "360° виртуал аялал",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-foreground-secondary"
                    >
                      <div className="size-5 rounded-full bg-brand-success/15 flex items-center justify-center flex-shrink-0">
                        <svg
                          viewBox="0 0 12 12"
                          className="size-3 text-brand-success"
                          fill="currentColor"
                        >
                          <path
                            d="M10 2L4.5 9.5 2 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/map" className="btn-brand">
                  <MapPin size={18} />
                  Газрын зурагруу очих
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative"
              >
                <div className="rounded-3xl overflow-hidden border border-border shadow-xl aspect-[4/3]">
                  <MapPreview />
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 glass-card rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                  <div className="size-10 rounded-xl bg-brand-accent/15 flex items-center justify-center">
                    <Globe size={20} className="text-brand-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">360° Virtual Tour</p>
                    <p className="text-xs text-foreground-muted">
                      Виртуал аялал боломжтой
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <StatsSection />

        {/* ── Popular by Category ────────────────────────────────────────── */}
        <section className="py-20 bg-background-secondary">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-brand-primary font-medium text-sm mb-2 block flex items-center justify-center gap-2">
                <TrendingUp size={16} />
                Trending
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Хамгийн их хандалттай
              </h2>
            </motion.div>
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedBusinesses filter="trending" />
            </Suspense>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────── */}
        <TestimonialsSection />

        {/* ── For Business Owners CTA ───────────────────────────────────── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gradient opacity-[0.06]" />
          <div className="section-container relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-balance">
                Бизнесээ Immerse Mongolia дээр бүртгүүлэх үү?
              </h2>
              <p className="text-foreground-secondary text-lg mb-10 max-w-2xl mx-auto">
                {formatInteger(platformStats?.totalUsers ?? 0)} хэрэглэгчид
                хүрч, бизнесийн дэлгэрэнгүй мэдээллийг харуулж, харилцагчдаа
                нэмэгдүүлэх боломж.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="btn-brand px-8 py-3.5 text-base"
                >
                  Одоо бүртгүүлэх
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm border border-border hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  Дэлгэрэнгүй мэдэх
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-border"
        >
          <div className="aspect-[4/3] bg-background-tertiary" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-background-tertiary rounded-lg w-3/4" />
            <div className="h-4 bg-background-tertiary rounded-lg w-1/2" />
            <div className="h-4 bg-background-tertiary rounded-lg w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
