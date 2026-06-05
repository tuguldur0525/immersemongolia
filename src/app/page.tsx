"use client";
// src/app/page.tsx — Immerse Mongolia Home Page

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Hotel,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShoppingBag,
  Sparkles,
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
import { useLanguage } from "@/lib/i18n/client";
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
    key: "restaurants",
    label: "Restaurants",
    href: "/business/search?categorySlug=restaurants",
    icon: Utensils,
  },
  {
    key: "hotels",
    label: "Hotels",
    href: "/business/search?categorySlug=hotels",
    icon: Hotel,
  },
  {
    key: "camps",
    label: "Ger Camps",
    href: "/business/search?categorySlug=camps",
    icon: Tent,
  },
  {
    key: "shopping",
    label: "Shopping",
    href: "/business/search?categorySlug=shopping",
    icon: ShoppingBag,
  },
] as const;

const heroPins = [
  {
    key: "restaurants",
    top: "26%",
    left: "22%",
    icon: Utensils,
    tint: "hsl(var(--brand-danger))",
    label: "Modern Nomads",
  },
  {
    key: "hotels",
    top: "40%",
    left: "62%",
    icon: Hotel,
    tint: "hsl(var(--brand-primary))",
    label: "Shangri-La",
  },
  {
    key: "camps",
    top: "66%",
    left: "32%",
    icon: Tent,
    tint: "hsl(var(--brand-success))",
    label: "Three Camel Lodge",
  },
  {
    key: "shopping",
    top: "56%",
    left: "74%",
    icon: ShoppingBag,
    tint: "hsl(var(--brand-accent))",
    label: "Gobi Cashmere",
  },
] as const;

const heroStats = [
  { key: "businesses", label: "Businesses", value: "12,480", icon: Building2 },
  { key: "reviews", label: "Reviews", value: "84,320", icon: Star },
  { key: "users", label: "Users", value: "126,540", icon: Users },
] as const;

const HOME_COPY = {
  mn: {
    heroTitleTop: "Монголын хамгийн",
    heroTitleAccent: "шилдэг газруудыг",
    heroTitleBottom: "нээж илрүүл",
    heroDescription:
      "Ресторан, зочид буудал, амралтын газар, дэлгүүрийг нэг дороос хайж, үнэлгээ болон газрын зурагтай нь харьцуул.",
    stats: {
      businesses: "Бизнес",
      reviews: "Үнэлгээ",
      users: "Хэрэглэгч",
    },
    heroPanelTitle: "Улаанбаатар",
    heroPanelSubtitle: "Газрын зураг дээрх нээлт",
    heroPanelCoordinates: "47.9189, 106.9176",
    heroPanelFeatured: (count: string) => `Өнөөдөр онцлох ${count} газар`,
    heroPanelTotal: (count: string) => `Нийт ${count} газар`,
    heroPanelMeta: "Үнэлгээ, зай, ангиллаар эрэмбэлэгдэнэ",
    heroPanelOpen: "Нээх",
    categoriesTitle: "Ангилалаар хайх",
    categoriesSubtitle: "Таны хайж буй зүйлийг олоорой",
    featuredEyebrow: "Онцлох газрууд",
    featuredTitle: "Санал болгох газрууд",
    seeAll: "Бүгдийг харах",
    mapEyebrow: "Интерактив газрын зураг",
    mapTitle: "Газрын зургаас шууд нээж илрүүлэх",
    mapDescription:
      "Байршил дээрээ тулгуурлан ойролцоо газруудыг олж, нэг товшилтоор дэлгэрэнгүй мэдээллийг авна уу.",
    mapBullets: [
      "Ангиллаар шүүх",
      "Ойрын газруудыг нээх",
      "Чиглэл авах",
      "360° виртуал аялал",
    ],
    mapCta: "Газрын зурагруу очих",
    virtualTourTitle: "360° Virtual Tour",
    virtualTourSubtitle: "Виртуал аялал боломжтой",
    trendingEyebrow: "Trending",
    trendingTitle: "Хамгийн их хандалттай",
    ownerCtaTitle: "Бизнесээ Immerse Mongolia дээр бүртгүүлэх үү?",
    ownerCtaDescription: (count: string) =>
      `${count} хэрэглэгчид хүрч, бизнесийн дэлгэрэнгүй мэдээллийг харуулж, харилцагчдаа нэмэгдүүлэх боломж.`,
    ownerCtaPrimary: "Одоо бүртгүүлэх",
    ownerCtaSecondary: "Дэлгэрэнгүй мэдэх",
  },
  en: {
    heroTitleTop: "Discover",
    heroTitleAccent: "Mongolia's best",
    heroTitleBottom: "places in one view",
    heroDescription:
      "Find restaurants, hotels, camps, shops, and local services with ratings, map context, and rich business details.",
    stats: {
      businesses: "Businesses",
      reviews: "Reviews",
      users: "Users",
    },
    heroPanelTitle: "Ulaanbaatar",
    heroPanelSubtitle: "Live discovery map",
    heroPanelCoordinates: "47.9189, 106.9176",
    heroPanelFeatured: (count: string) => `${count} featured places today`,
    heroPanelTotal: (count: string) => `${count} places listed`,
    heroPanelMeta: "Ranked by rating, distance, and category",
    heroPanelOpen: "Open",
    categoriesTitle: "Browse by Category",
    categoriesSubtitle: "Find the place you are looking for",
    featuredEyebrow: "Featured",
    featuredTitle: "Recommended Places",
    seeAll: "See all",
    mapEyebrow: "Interactive Map",
    mapTitle: "Explore directly from the map",
    mapDescription:
      "Use your location to discover nearby places and open full business details in one tap.",
    mapBullets: [
      "Filter by category",
      "Discover nearby places",
      "Get directions",
      "360° virtual tours",
    ],
    mapCta: "Open map",
    virtualTourTitle: "360° Virtual Tour",
    virtualTourSubtitle: "Available at selected places",
    trendingEyebrow: "Trending",
    trendingTitle: "Most Visited",
    ownerCtaTitle: "List your business on Immerse Mongolia",
    ownerCtaDescription: (count: string) =>
      `Reach ${count} users, present richer business details, and grow customer demand.`,
    ownerCtaPrimary: "Get started",
    ownerCtaSecondary: "Learn more",
  },
} as const;

export default function HomePage() {
  const { locale, t } = useLanguage();
  const { data: platformStats } = usePlatformStats();
  const copy = HOME_COPY[locale];
  const activeBusinessCount = platformStats?.totalBusinesses ?? 0;
  const featuredCount = platformStats?.featuredBusinesses ?? 0;
  const activeBusinessCountLabel =
    activeBusinessCount > 0
      ? formatInteger(activeBusinessCount)
      : heroStats[0].value;
  const featuredCountLabel =
    featuredCount > 0 ? formatInteger(featuredCount) : "248";
  const localizedHeroLinks = heroLinks.map((item) => ({
    ...item,
    label: locale === "en" ? item.label : t(`categories.${item.key}`),
  }));
  const heroStatValues = {
    businesses: activeBusinessCountLabel,
    reviews:
      platformStats?.totalReviews && platformStats.totalReviews > 0
        ? formatInteger(platformStats.totalReviews)
        : heroStats[1].value,
    users:
      platformStats?.totalUsers && platformStats.totalUsers > 0
        ? formatInteger(platformStats.totalUsers)
        : heroStats[2].value,
  } as const;
  const localizedHeroStats = heroStats.map((item) => ({
    ...item,
    label: locale === "en" ? item.label : copy.stats[item.key],
    value: heroStatValues[item.key],
  }));

  return (
    <>
      <Navbar transparent />

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border bg-hero-gradient pt-20 sm:pt-24 lg:flex lg:min-h-[720px] lg:items-center lg:pt-24">
          <div className="absolute inset-0 grid-bg opacity-45 [mask-image:radial-gradient(ellipse_at_center,black_28%,transparent_76%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background-secondary/80 to-transparent" />
          <div className="section-container relative z-10 pb-16 lg:pb-20">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:gap-16">
              <motion.div
                variants={stagger}
                initial="initial"
                animate="animate"
                className="max-w-4xl space-y-7"
              >
                <motion.h1
                  variants={fadeUp}
                  className="max-w-4xl text-4xl font-black leading-[1.03] tracking-normal text-foreground text-balance sm:text-5xl lg:text-5xl xl:text-6xl"
                >
                  {copy.heroTitleTop}
                  <span className="relative block w-fit py-2 pr-1">
                    <span className="text-gradient-brand relative z-10">
                      {copy.heroTitleAccent}
                    </span>
                  </span>
                  {copy.heroTitleBottom}
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="max-w-2xl text-base font-medium leading-7 text-foreground-secondary text-balance sm:text-lg sm:leading-8"
                >
                  {copy.heroDescription}
                </motion.p>
                <motion.div variants={fadeUp} className="max-w-4xl">
                  <HeroSearchBar />
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  className="flex flex-wrap items-center gap-2"
                >
                  {localizedHeroLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm font-semibold text-foreground-muted shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-primary/45 hover:bg-brand-primary/5 hover:text-brand-primary"
                    >
                      <Icon className="size-3.5 transition-transform group-hover:scale-110" />
                      {label}
                    </Link>
                  ))}
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  className="hidden max-w-2xl grid-cols-3 gap-3 pt-1 sm:grid"
                >
                  {localizedHeroStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="group rounded-2xl border border-border bg-card/65 p-4 shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-primary/30"
                    >
                      <div className="flex items-center gap-2 text-foreground-muted">
                        <Icon className="size-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wide">
                          {label}
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-black leading-none text-foreground sm:text-2xl">
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
                className="relative hidden lg:block"
              >
                <div className="relative animate-float">
                  <div
                    className="absolute -inset-1 rounded-[2rem] opacity-55 blur-2xl"
                    style={{ background: "var(--gradient-brand)" }}
                  />

                  <div className="ring-ambient relative overflow-hidden rounded-[2rem] glass shadow-elegant">
                    <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-brand">
                          <Compass size={20} />
                        </div>
                        <div>
                          <p className="text-base font-black text-foreground">
                            {copy.heroPanelTitle}
                          </p>
                          <p className="text-xs font-medium text-foreground-muted">
                            {copy.heroPanelSubtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative aspect-[4/3.6] overflow-hidden bg-background-secondary">
                      <svg
                        className="absolute inset-0 size-full opacity-70"
                        viewBox="0 0 400 400"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <defs>
                          <radialGradient
                            id="hero-map-land"
                            cx="50%"
                            cy="40%"
                            r="80%"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--brand-secondary))"
                              stopOpacity="0.18"
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--brand-secondary))"
                              stopOpacity="0"
                            />
                          </radialGradient>
                        </defs>
                        <rect
                          width="400"
                          height="400"
                          fill="url(#hero-map-land)"
                        />
                        {Array.from({ length: 8 }).map((_, i) => (
                          <path
                            key={i}
                            d={`M0 ${60 + i * 38} Q 100 ${40 + i * 38} 200 ${
                              70 + i * 38
                            } T 400 ${50 + i * 38}`}
                            fill="none"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.08"
                            strokeWidth="1"
                          />
                        ))}
                        <path
                          d="M-20 240 Q 80 180 180 230 T 420 200"
                          fill="none"
                          stroke="hsl(var(--brand-primary))"
                          strokeOpacity="0.35"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M40 380 L 200 200 L 360 320"
                          fill="none"
                          stroke="hsl(var(--foreground))"
                          strokeOpacity="0.12"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      </svg>

                      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg glass px-3 py-2 font-mono text-[11px] font-semibold text-foreground-muted">
                        <Navigation size={14} />
                        {copy.heroPanelCoordinates}
                      </div>

                      <div className="absolute right-5 top-5 overflow-hidden rounded-lg glass text-foreground-muted">
                        <button
                          className="flex size-10 items-center justify-center transition-colors hover:bg-brand-primary/5 hover:text-brand-primary"
                          aria-label="Zoom in"
                        >
                          <Plus size={16} />
                        </button>
                        <div className="h-px bg-border" />
                        <button
                          className="flex size-10 items-center justify-center transition-colors hover:bg-brand-primary/5 hover:text-brand-primary"
                          aria-label="Zoom out"
                        >
                          <Minus size={16} />
                        </button>
                      </div>

                      {heroPins.map(
                        ({ key, top, left, icon: Icon, tint, label }, i) => (
                          <div
                            key={key}
                            className="group absolute -translate-x-1/2 -translate-y-1/2"
                            style={{ top, left }}
                          >
                            <div
                              style={{
                                animation: `float ${5 + i}s ease-in-out infinite`,
                                animationDelay: `${i * 0.4}s`,
                              }}
                            >
                              <span
                                className="absolute inset-0 m-auto size-10 animate-ping-slow rounded-full"
                                style={{ background: tint, opacity: 0.35 }}
                              />
                              <div
                                className="relative flex size-11 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-background"
                                style={{ background: tint }}
                              >
                                <Icon size={18} strokeWidth={2.5} />
                              </div>
                              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md glass px-2 py-1 text-[11px] font-semibold opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                                {label}
                              </div>
                            </div>
                          </div>
                        ),
                      )}

                      <div className="absolute inset-x-4 bottom-4 rounded-2xl glass p-3 shadow-elegant">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--gradient-accent)] text-white">
                            <Sparkles size={19} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-foreground">
                              {copy.heroPanelFeatured(featuredCountLabel)}
                            </p>
                            <p className="text-xs font-medium text-foreground-muted">
                              {copy.heroPanelMeta}
                            </p>
                          </div>
                          <Link
                            href="/map"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white transition-all hover:brightness-110"
                          >
                            {copy.heroPanelOpen}
                            <ArrowRight size={13} />
                          </Link>
                        </div>
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
                {copy.categoriesTitle}
              </h2>
              <p className="text-foreground-secondary text-lg">
                {copy.categoriesSubtitle}
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
                  {copy.featuredEyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  {copy.featuredTitle}
                </h2>
              </motion.div>
              <Link
                href="/business/search?featured=true"
                className="hidden sm:flex items-center gap-1 text-brand-primary hover:underline text-sm font-medium"
              >
                {copy.seeAll} <ChevronRight size={16} />
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
                  {copy.mapEyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
                  {copy.mapTitle}
                </h2>
                <p className="text-foreground-secondary text-lg leading-relaxed mb-8">
                  {copy.mapDescription}
                </p>
                <ul className="space-y-3 mb-8">
                  {copy.mapBullets.map((item) => (
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
                  {copy.mapCta}
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
                    <p className="font-semibold text-sm">
                      {copy.virtualTourTitle}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {copy.virtualTourSubtitle}
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
                {copy.trendingEyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                {copy.trendingTitle}
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
                {copy.ownerCtaTitle}
              </h2>
              <p className="text-foreground-secondary text-lg mb-10 max-w-2xl mx-auto">
                {copy.ownerCtaDescription(
                  formatInteger(platformStats?.totalUsers ?? 0),
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="btn-brand px-8 py-3.5 text-base"
                >
                  {copy.ownerCtaPrimary}
                </Link>
                <Link
                  href="/public/about"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm border border-border hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  {copy.ownerCtaSecondary}
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
