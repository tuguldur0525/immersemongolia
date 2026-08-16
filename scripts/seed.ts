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

  // ── Product Demo Data ────────────────────────────────────────────────────
  const demoUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@immersemongolia.mn' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        supabaseId: 'demo-admin-supabase-id',
        email: 'admin@immersemongolia.mn',
        firstName: 'Админ',
        lastName: 'Immerse',
        displayName: 'Immerse Admin',
        role: 'SUPER_ADMIN',
        preferredLanguage: 'mn',
      },
    }),
    prisma.user.upsert({
      where: { email: 'owner@immersemongolia.mn' },
      update: { role: 'BUSINESS_OWNER', isActive: true },
      create: {
        supabaseId: 'demo-owner-supabase-id',
        email: 'owner@immersemongolia.mn',
        firstName: 'Мөнхбаяр',
        lastName: 'Батхуяг',
        displayName: 'Б. Мөнхбаяр',
        role: 'BUSINESS_OWNER',
        preferredLanguage: 'mn',
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-user-supabase-id',
        email: 'user@immersemongolia.mn',
        firstName: 'Ариун',
        lastName: 'Эрдэнэ',
        displayName: 'Э. Ариун',
        role: 'USER',
        preferredLanguage: 'mn',
      },
    }),
    prisma.user.upsert({
      where: { email: 'traveler@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-traveler-supabase-id',
        email: 'traveler@immersemongolia.mn',
        firstName: 'Sarah',
        lastName: 'Chen',
        displayName: 'Sarah Chen',
        role: 'USER',
        preferredLanguage: 'en',
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer1@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-reviewer-1-supabase-id',
        email: 'reviewer1@immersemongolia.mn',
        firstName: 'Номин',
        lastName: 'Баяр',
        displayName: 'Б. Номин',
        role: 'USER',
        preferredLanguage: 'mn',
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer2@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-reviewer-2-supabase-id',
        email: 'reviewer2@immersemongolia.mn',
        firstName: 'Тэмүүлэн',
        lastName: 'Очир',
        displayName: 'О. Тэмүүлэн',
        role: 'USER',
        preferredLanguage: 'mn',
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer3@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-reviewer-3-supabase-id',
        email: 'reviewer3@immersemongolia.mn',
        firstName: 'Michael',
        lastName: 'Tan',
        displayName: 'Michael Tan',
        role: 'USER',
        preferredLanguage: 'en',
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer4@immersemongolia.mn' },
      update: { role: 'USER', isActive: true },
      create: {
        supabaseId: 'demo-reviewer-4-supabase-id',
        email: 'reviewer4@immersemongolia.mn',
        firstName: 'Саруул',
        lastName: 'Ганбат',
        displayName: 'Г. Саруул',
        role: 'USER',
        preferredLanguage: 'mn',
      },
    }),
  ])

  const [, owner, user, traveler, ...reviewers] = demoUsers
  console.log(`✅ Created ${demoUsers.length} demo users`)

  const categoryBySlug = Object.fromEntries(categories.map(category => [category.slug, category]))
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const demoBusinesses = [
    {
      slug: 'modern-nomads',
      categorySlug: 'restaurants',
      nameMn: 'Modern Nomads',
      nameEn: 'Modern Nomads',
      taglineMn: 'Монгол хоолны орчин үеийн амт',
      taglineEn: 'Modern Mongolian dining in the city center',
      descriptionMn: 'Жуулчин болон нутгийн хүмүүст зориулсан тав тухтай орчин, чанартай монгол хоол, хурдан үйлчилгээ.',
      descriptionEn: 'A polished Mongolian dining experience with classic dishes, warm service, and central Ulaanbaatar access.',
      addressMn: 'Сүхбаатар дүүрэг, Энхтайваны өргөн чөлөө',
      addressEn: 'Peace Avenue, Sukhbaatar District',
      district: 'Sukhbaatar',
      latitude: 47.918873,
      longitude: 106.917701,
      phone: '+976 7711-2233',
      email: 'hello@modernnomads.mn',
      website: 'https://modernnomads.mn',
      priceRange: '$$',
      tags: ['mongolian', 'family', 'central'],
      amenities: ['wifi', 'parking', 'english-menu', 'card-payment'],
      avgRating: 4.8,
      totalReviews: 128,
      totalViews: 18420,
      totalSaves: 930,
      totalClicks: 2710,
      weeklyViews: 540,
      monthlyViews: 2280,
      coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=256&q=80',
      virtualTourUrl: 'https://www.google.com/maps/embed',
      virtualTourType: 'google',
      isFeatured: true,
      isPremium: true,
    },
    {
      slug: 'shangri-la-ulaanbaatar',
      categorySlug: 'hotels',
      nameMn: 'Shangri-La Ulaanbaatar',
      nameEn: 'Shangri-La Ulaanbaatar',
      taglineMn: 'Хотын төвийн тансаг буудал',
      taglineEn: 'Luxury stay overlooking central Ulaanbaatar',
      descriptionMn: 'Аялал, бизнес уулзалт, амралтад тохиромжтой таван одтой үйлчилгээ.',
      descriptionEn: 'Premium hospitality, business amenities, dining, spa, and central access for travelers.',
      addressMn: 'Сүхбаатар дүүрэг, Олимпийн гудамж',
      addressEn: 'Olympic Street, Sukhbaatar District',
      district: 'Sukhbaatar',
      latitude: 47.91351,
      longitude: 106.92205,
      phone: '+976 7702-9999',
      email: 'reservations@shangri-la.mn',
      website: 'https://www.shangri-la.com',
      priceRange: '$$$$',
      starRating: 5,
      tags: ['hotel', 'luxury', 'spa', 'business'],
      amenities: ['spa', 'pool', 'gym', 'conference-room', 'airport-transfer'],
      avgRating: 4.7,
      totalReviews: 214,
      totalViews: 26340,
      totalSaves: 1410,
      totalClicks: 3890,
      weeklyViews: 710,
      monthlyViews: 3140,
      coverImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=256&q=80',
      virtualTourUrl: 'https://www.google.com/maps/embed',
      virtualTourType: 'google',
      isFeatured: true,
      isPremium: true,
    },
    {
      slug: 'three-camel-lodge',
      categorySlug: 'camps',
      nameMn: 'Three Camel Lodge',
      nameEn: 'Three Camel Lodge',
      taglineMn: 'Говийн тансаг гэр бааз',
      taglineEn: 'Eco-luxury ger camp in the Gobi',
      descriptionMn: 'Говийн байгаль, уламжлалт гэр, тогтвортой аялал жуулчлалын онцгой туршлага.',
      descriptionEn: 'A memorable Gobi experience with traditional design, comfort, and sustainable hospitality.',
      addressMn: 'Өмнөговь аймаг, Булган сум',
      addressEn: 'Bulgan Soum, Umnugovi Province',
      district: 'Bulgan',
      city: 'Dalanzadgad',
      latitude: 43.6141,
      longitude: 103.5276,
      phone: '+976 7011-9999',
      email: 'info@threecamellodge.mn',
      website: 'https://threecamellodge.com',
      priceRange: '$$$',
      tags: ['gobi', 'ger-camp', 'eco', 'tour'],
      amenities: ['airport-transfer', 'guided-tours', 'restaurant', 'english-speaking'],
      avgRating: 4.9,
      totalReviews: 96,
      totalViews: 15880,
      totalSaves: 1220,
      totalClicks: 1840,
      weeklyViews: 390,
      monthlyViews: 1750,
      coverImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1516410529446-2c777cb7366d?auto=format&fit=crop&w=256&q=80',
      virtualTourUrl: 'https://www.google.com/maps/embed',
      virtualTourType: 'google',
      isFeatured: true,
      isPremium: true,
    },
    {
      slug: 'gobi-cashmere-store',
      categorySlug: 'shopping',
      nameMn: 'Gobi Cashmere',
      nameEn: 'Gobi Cashmere',
      taglineMn: 'Монгол ноолуурын нэрийн дэлгүүр',
      taglineEn: 'Premium Mongolian cashmere flagship store',
      descriptionMn: 'Монгол ноолуурын чанартай бүтээгдэхүүн, бэлэг дурсгал, улирлын шинэ коллекц.',
      descriptionEn: 'Premium cashmere apparel and gifts from Mongolia, with seasonal collections and helpful staff.',
      addressMn: 'Хан-Уул дүүрэг, Говь ХК төв дэлгүүр',
      addressEn: 'Gobi flagship store, Khan-Uul District',
      district: 'Khan-Uul',
      latitude: 47.90231,
      longitude: 106.89524,
      phone: '+976 7013-9977',
      email: 'store@gobicashmere.com',
      website: 'https://www.gobicashmere.com',
      priceRange: '$$$',
      tags: ['cashmere', 'shopping', 'souvenir'],
      amenities: ['tax-free', 'card-payment', 'parking'],
      avgRating: 4.6,
      totalReviews: 82,
      totalViews: 12120,
      totalSaves: 650,
      totalClicks: 1430,
      weeklyViews: 310,
      monthlyViews: 1260,
      coverImageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=256&q=80',
      isFeatured: true,
      isPremium: true,
    },
    {
      slug: 'central-yoga-studio',
      categorySlug: 'fitness',
      nameMn: 'Central Yoga Studio',
      nameEn: 'Central Yoga Studio',
      taglineMn: 'Хотын төвийн тайван дасгалын орчин',
      taglineEn: 'Calm movement classes for busy city days',
      descriptionMn: 'Йог, сунгалт, амьсгалын хичээлүүдийг эхлэн суралцагч болон туршлагатай хүмүүст зориулан явуулна.',
      descriptionEn: 'Yoga, mobility, and breathwork classes for beginners and regular practitioners.',
      addressMn: 'Чингэлтэй дүүрэг, Бага тойруу',
      addressEn: 'Baga Toiruu, Chingeltei District',
      district: 'Chingeltei',
      latitude: 47.92244,
      longitude: 106.91081,
      phone: '+976 8800-1122',
      email: 'hello@centralyoga.mn',
      priceRange: '$$',
      tags: ['yoga', 'wellness', 'classes'],
      amenities: ['showers', 'lockers', 'drop-in'],
      avgRating: 4.5,
      totalReviews: 47,
      totalViews: 7420,
      totalSaves: 420,
      totalClicks: 820,
      weeklyViews: 210,
      monthlyViews: 850,
      coverImageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=256&q=80',
      isFeatured: false,
      isPremium: false,
    },
    {
      slug: 'blue-sky-dental',
      categorySlug: 'medical',
      nameMn: 'Blue Sky Dental',
      nameEn: 'Blue Sky Dental',
      taglineMn: 'Гэр бүлд зориулсан шүдний эмнэлэг',
      taglineEn: 'Family dental clinic with bilingual care',
      descriptionMn: 'Урьдчилан сэргийлэх үзлэг, цайруулалт, имплант, хүүхдийн шүдний эмчилгээ.',
      descriptionEn: 'Preventive care, whitening, implants, and pediatric dental services.',
      addressMn: 'Баянзүрх дүүрэг, 13-р хороолол',
      addressEn: '13th Microdistrict, Bayanzurkh District',
      district: 'Bayanzurkh',
      latitude: 47.9131,
      longitude: 106.9534,
      phone: '+976 7700-4545',
      email: 'care@blueskydental.mn',
      priceRange: '$$',
      tags: ['dental', 'clinic', 'family'],
      amenities: ['appointment', 'english-speaking', 'card-payment'],
      avgRating: 4.4,
      totalReviews: 35,
      totalViews: 6180,
      totalSaves: 260,
      totalClicks: 610,
      weeklyViews: 150,
      monthlyViews: 620,
      coverImageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=256&q=80',
      isFeatured: false,
      isPremium: false,
    },
  ]

  const businesses = []
  for (const item of demoBusinesses) {
    const { categorySlug, ...businessData } = item
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: {
        ...businessData,
        categoryId: categoryBySlug[categorySlug].id,
        ownerId: owner.id,
        status: 'ACTIVE',
        isVerified: true,
        featuredUntil: item.isFeatured ? nextMonth : null,
        approvedAt: new Date(),
      },
      create: {
        ...businessData,
        categoryId: categoryBySlug[categorySlug].id,
        ownerId: owner.id,
        status: 'ACTIVE',
        isVerified: true,
        featuredUntil: item.isFeatured ? nextMonth : null,
        approvedAt: new Date(),
      },
    })
    businesses.push(business)

    await prisma.businessHours.deleteMany({ where: { businessId: business.id } })
    await prisma.businessHours.createMany({
      data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        businessId: business.id,
        dayOfWeek,
        openTime: dayOfWeek === 0 ? '11:00' : '09:00',
        closeTime: dayOfWeek === 0 ? '18:00' : '22:00',
        isClosed: false,
      })),
    })

    await prisma.businessMedia.deleteMany({ where: { businessId: business.id } })
    await prisma.businessMedia.createMany({
      data: [
        {
          businessId: business.id,
          type: 'COVER',
          url: item.coverImageUrl,
          caption: `${item.nameEn} cover`,
          altText: item.taglineEn,
          sortOrder: 0,
          isPublic: true,
        },
        {
          businessId: business.id,
          type: 'LOGO',
          url: item.logoUrl,
          caption: `${item.nameEn} logo`,
          altText: item.nameEn,
          sortOrder: 1,
          isPublic: true,
        },
      ],
    })
  }

  console.log(`✅ Created ${businesses.length} demo businesses`)

  const reviewTemplates = [
    {
      user,
      rating: 5,
      title: 'Маш сайн үйлчилгээ',
      body: 'Мэдээлэл нь үнэн зөв, үйлчилгээ хурдан, байршил олоход амар байлаа.',
      visitType: 'family',
      helpfulCount: 8,
    },
    {
      user: traveler,
      rating: 4,
      title: 'Easy to find and worth visiting',
      body: 'The listing details matched the place well. Photos, hours, and map directions were useful.',
      visitType: 'solo',
      helpfulCount: 5,
    },
    ...reviewers.map((reviewer, index) => ({
      user: reviewer,
      rating: index === 2 ? 4 : 5,
      title: index % 2 === 0 ? 'Найдвартай мэдээлэлтэй' : 'Great local recommendation',
      body: index % 2 === 0
        ? 'Зураг, цагийн хуваарь, холбоо барих мэдээлэл нь шийдвэр гаргахад хэрэг боллоо.'
        : 'Helpful listing, clear directions, and a good experience overall.',
      visitType: index % 2 === 0 ? 'business' : 'couple',
      helpfulCount: 3 + index,
    })),
  ]

  for (const business of businesses) {
    for (const template of reviewTemplates) {
      await prisma.review.upsert({
        where: { businessId_userId: { businessId: business.id, userId: template.user.id } },
        update: {
          status: 'PUBLISHED',
          rating: template.rating,
          title: template.title,
          body: template.body,
          visitType: template.visitType,
          isVerified: true,
          helpfulCount: template.helpfulCount,
          moderatedAt: new Date(),
        },
        create: {
          businessId: business.id,
          userId: template.user.id,
          status: 'PUBLISHED',
          rating: template.rating,
          title: template.title,
          body: template.body,
          visitType: template.visitType,
          isVerified: true,
          helpfulCount: template.helpfulCount,
          moderatedAt: new Date(),
        },
      })
    }

    const reviewStats = await prisma.review.aggregate({
      where: { businessId: business.id, status: 'PUBLISHED', deletedAt: null },
      _avg: { rating: true },
      _count: { _all: true },
    })
    await prisma.business.update({
      where: { id: business.id },
      data: {
        avgRating: reviewStats._avg.rating ?? 0,
        totalReviews: reviewStats._count._all,
      },
    })
  }

  await prisma.savedBusiness.deleteMany({ where: { userId: { in: [user.id, traveler.id] } } })
  await prisma.savedBusiness.createMany({
    data: [
      { userId: user.id, businessId: businesses[0].id, notes: 'Гэр бүлээрээ очих' },
      { userId: user.id, businessId: businesses[2].id, notes: 'Зун аяллаар явах' },
      { userId: traveler.id, businessId: businesses[1].id, notes: 'Next UB stay' },
    ],
  })

  await prisma.recentlyViewed.deleteMany({ where: { userId: { in: [user.id, traveler.id] } } })
  await prisma.recentlyViewed.createMany({
    data: [
      { userId: user.id, businessId: businesses[0].id, source: 'featured' },
      { userId: user.id, businessId: businesses[4].id, source: 'search' },
      { userId: traveler.id, businessId: businesses[2].id, source: 'map' },
    ],
  })

  await prisma.payment.deleteMany({ where: { userId: owner.id } })
  await prisma.subscription.deleteMany({ where: { userId: owner.id } })
  const subscription = await prisma.subscription.create({
    data: {
      userId: owner.id,
      businessId: businesses[0].id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      isAnnual: false,
      startDate: lastWeek,
      endDate: nextMonth,
      renewalDate: nextMonth,
      priceAtPurchase: 99000,
      autoRenew: true,
    },
  })
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: owner.id,
      method: 'QPAY',
      status: 'PAID',
      amount: 99000,
      description: 'Professional plan monthly subscription',
      invoiceNumber: `DEMO-${Date.now()}`,
      externalId: 'demo-qpay-paid',
      paidAt: lastWeek,
    },
  })

  await prisma.advertisement.deleteMany({ where: { businessId: { in: businesses.map(b => b.id) } } })
  await prisma.advertisement.create({
    data: {
      businessId: businesses[0].id,
      type: 'FEATURED_LISTING',
      titleMn: 'Хотын төвийн онцлох ресторан',
      titleEn: 'Featured central restaurant',
      imageUrl: businesses[0].coverImageUrl,
      targetUrl: `/business/${businesses[0].slug}`,
      budget: 500000,
      cpmRate: 25,
      impressions: 12840,
      clicks: 640,
      spend: 321000,
      isActive: true,
      startsAt: lastWeek,
      endsAt: nextMonth,
    },
  })

  await prisma.businessAnalytics.deleteMany({ where: { businessId: { in: businesses.map(b => b.id) } } })
  await prisma.businessAnalytics.createMany({
    data: businesses.flatMap(business =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - index)
        return {
          businessId: business.id,
          date,
          views: 80 + index * 12,
          uniqueViews: 56 + index * 8,
          saves: 6 + index,
          clicks: 18 + index * 3,
          phoneClicks: 4 + index,
          websiteClicks: 5 + index,
          mapClicks: 9 + index * 2,
          reviewsCount: index % 3 === 0 ? 1 : 0,
          searchImpressions: 140 + index * 18,
          sources: { direct: 25, search: 45, map: 20, featured: 10 },
        }
      })
    ),
  })

  await prisma.lead.deleteMany({ where: { businessId: { in: businesses.map(b => b.id) } } })
  await prisma.lead.createMany({
    data: [
      {
        businessId: businesses[0].id,
        name: 'Тэмүүлэн',
        email: 'temuulen@example.mn',
        phone: '+976 9911-2233',
        message: '10 хүний ширээ захиалах боломжтой юу?',
        source: 'contact_form',
      },
      {
        businessId: businesses[1].id,
        name: 'John Miller',
        email: 'john@example.com',
        message: 'Do you offer airport transfer for late arrivals?',
        source: 'website_click',
      },
    ],
  })

  console.log('✅ Created reviews, media, subscriptions, analytics, ads, leads, and user activity')
  console.log('ℹ️  Demo user emails are seeded for profiles only. Create matching Supabase Auth users to sign in locally.')

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
