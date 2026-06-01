// scripts/seed.ts
// Run: npx tsx scripts/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Immerse Mongolia database...')

  // ── Categories ──────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'restaurants' },
      update: {},
      create: {
        slug: 'restaurants',
        nameMn: 'Ресторан',
        nameEn: 'Restaurants',
        descriptionMn: 'Монгол болон олон улсын хоолны газрууд',
        descriptionEn: 'Mongolian and international restaurants',
        icon: '🍜',
        color: '#ef4444',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hotels' },
      update: {},
      create: {
        slug: 'hotels',
        nameMn: 'Зочид буудал',
        nameEn: 'Hotels',
        descriptionMn: 'Зочид буудал, хотхон, байр',
        descriptionEn: 'Hotels, motels, and accommodations',
        icon: '🏨',
        color: '#3b82f6',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'camps' },
      update: {},
      create: {
        slug: 'camps',
        nameMn: 'Кемп & Амралт',
        nameEn: 'Camps & Resorts',
        descriptionMn: 'Амралтын газар, кемп, ордон',
        descriptionEn: 'Camps, resorts, and retreats',
        icon: '⛺',
        color: '#22c55e',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'shopping' },
      update: {},
      create: {
        slug: 'shopping',
        nameMn: 'Дэлгүүр',
        nameEn: 'Shopping',
        descriptionMn: 'Дэлгүүр, молл, зах',
        descriptionEn: 'Shopping centers, malls, and markets',
        icon: '🛍️',
        color: '#f59e0b',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fitness' },
      update: {},
      create: {
        slug: 'fitness',
        nameMn: 'Фитнэс & Спорт',
        nameEn: 'Fitness & Sports',
        descriptionMn: 'Фитнэс клуб, спорт заал, тэнис',
        descriptionEn: 'Gyms, sports centers, and fitness clubs',
        icon: '💪',
        color: '#8b5cf6',
        sortOrder: 5,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'salons' },
      update: {},
      create: {
        slug: 'salons',
        nameMn: 'Салон & Гоо сайхан',
        nameEn: 'Beauty & Salons',
        descriptionMn: 'Үсчин, гоо сайхан, спа',
        descriptionEn: 'Hair salons, beauty, and spas',
        icon: '💇',
        color: '#ec4899',
        sortOrder: 6,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'entertainment' },
      update: {},
      create: {
        slug: 'entertainment',
        nameMn: 'Цэнгэл & Тоглоом',
        nameEn: 'Entertainment',
        icon: '🎮',
        color: '#06b6d4',
        sortOrder: 7,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'medical' },
      update: {},
      create: {
        slug: 'medical',
        nameMn: 'Эрүүл мэнд',
        nameEn: 'Healthcare',
        icon: '🏥',
        color: '#10b981',
        sortOrder: 8,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'education' },
      update: {},
      create: {
        slug: 'education',
        nameMn: 'Боловсрол',
        nameEn: 'Education',
        icon: '📚',
        color: '#6366f1',
        sortOrder: 9,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // ── Subscription Plans ──────────────────────────────────────────────────
  const plans = [
    {
      plan: 'FREE' as const,
      nameMn: 'Үнэгүй',
      nameEn: 'Free',
      monthlyPriceMnt: 0,
      annualPriceMnt: 0,
      maxPhotos: 5,
      maxListings: 1,
      hasVirtualTour: false,
      hasAnalytics: false,
      hasPrioritySupport: false,
      isFeatured: false,
      features: {
        photos: 5,
        listings: 1,
        virtualTour: false,
        analytics: false,
        support: 'email',
        featured: false,
      },
    },
    {
      plan: 'STARTER' as const,
      nameMn: 'Эхлэгч',
      nameEn: 'Starter',
      monthlyPriceMnt: 49000,
      annualPriceMnt: 490000,
      maxPhotos: 20,
      maxListings: 1,
      hasVirtualTour: false,
      hasAnalytics: true,
      hasPrioritySupport: false,
      isFeatured: false,
      features: {
        photos: 20,
        listings: 1,
        virtualTour: false,
        analytics: 'basic',
        support: 'email',
        featured: false,
      },
    },
    {
      plan: 'PROFESSIONAL' as const,
      nameMn: 'Мэргэжлийн',
      nameEn: 'Professional',
      monthlyPriceMnt: 99000,
      annualPriceMnt: 990000,
      maxPhotos: 100,
      maxListings: 3,
      hasVirtualTour: true,
      hasAnalytics: true,
      hasPrioritySupport: false,
      isFeatured: true,
      features: {
        photos: 'unlimited',
        listings: 3,
        virtualTour: true,
        analytics: 'advanced',
        support: 'priority',
        featured: true,
      },
    },
    {
      plan: 'ENTERPRISE' as const,
      nameMn: 'Корпорат',
      nameEn: 'Enterprise',
      monthlyPriceMnt: 199000,
      annualPriceMnt: 1990000,
      maxPhotos: 999,
      maxListings: 999,
      hasVirtualTour: true,
      hasAnalytics: true,
      hasPrioritySupport: true,
      isFeatured: true,
      features: {
        photos: 'unlimited',
        listings: 'unlimited',
        virtualTour: true,
        analytics: 'enterprise',
        support: '24/7',
        featured: 'priority',
        api: true,
        customBranding: true,
      },
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlanConfig.upsert({
      where: { plan: plan.plan },
      update: {},
      create: plan,
    })
  }

  console.log(`✅ Created ${plans.length} subscription plans`)

  // ── Content Pages ────────────────────────────────────────────────────────
  await prisma.contentPage.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      slug: 'about',
      titleMn: 'Immerse Mongolia-ийн тухай',
      titleEn: 'About Immerse Mongolia',
      bodyMn: 'Immerse Mongolia нь Монголын бизнес нээлтийн тэргүүлэх платформ юм.',
      bodyEn: 'Immerse Mongolia is the leading business discovery platform in Mongolia.',
      isPublished: true,
    },
  })

  console.log('✅ Created content pages')

  // ── Sample Admin User ────────────────────────────────────────────────────
  // Note: Create user in Supabase Auth first, then use that supabaseId here
  // This is just a reference — do NOT commit real credentials
  console.log('ℹ️  Remember to create admin user in Supabase Auth dashboard')
  console.log('   Then update the supabaseId in the database manually')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\nNext steps:')
  console.log('  1. Set up your .env.local with real credentials')
  console.log('  2. Run: npx prisma db push')
  console.log('  3. Run: npx prisma generate')
  console.log('  4. Create admin user in Supabase Auth dashboard')
  console.log('  5. Run: npm run dev')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
