# NomadView 🗺️

**Монголын бизнес нээлтийн тэргүүлэх платформ**

NomadView is a full-stack, production-ready business discovery platform for Mongolia — combining interactive Mapbox maps, 360° virtual tours, real-time reviews, and a complete business management ecosystem.

---

## ✨ Features

- 🗺️ **Interactive Mapbox Map** — business clustering, category filters, geolocation
- 360° **Virtual Tours** — Matterport and custom embed support
- ⭐ **Reviews & Ratings** — moderated, with photos, helpful votes, owner replies
- 💳 **QPay Integration** — Mongolia's leading mobile payment
- 🏢 **Business Dashboard** — analytics, leads, media, payments
- 🛡️ **Admin Panel** — approvals, moderation, categories, ads
- 🌐 **Bilingual** — Mongolian (mn) + English (en) with next-intl
- 🌙 **Dark/Light Mode** — system preference + manual toggle
- 📱 **PWA** — installable, offline-capable, bottom nav
- 🔐 **Supabase Auth** — Google OAuth, email/password, JWT

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Animation | Framer Motion |
| Database | Supabase PostgreSQL (Prisma ORM) |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| Maps | Mapbox GL JS |
| Payments | QPay + Bank Cards |
| Email | Resend + React Email |
| State | Zustand + TanStack Query |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A Supabase project
- A Mapbox account
- A QPay merchant account (for payments)

### 1. Clone & Install
```bash
git clone https://github.com/yourorg/nomadview.git
cd nomadview
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Fill in your credentials
```

### 3. Database Setup
```bash
# Push schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data (categories, plans)
npx tsx scripts/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
nomadview/
├── prisma/
│   └── schema.prisma          # Full database schema
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt
│   └── locales/               # i18n translation files
│       ├── mn/
│       └── en/
├── scripts/
│   └── seed.ts                # Database seeder
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # REST API routes
│   │   │   ├── businesses/    # Business CRUD
│   │   │   ├── reviews/       # Review system
│   │   │   ├── payments/      # QPay + payments
│   │   │   ├── map/           # GeoJSON for Mapbox
│   │   │   ├── search/        # Full-text search
│   │   │   ├── categories/    # Category management
│   │   │   ├── users/         # User profiles
│   │   │   ├── claims/        # Claim a business
│   │   │   └── subscriptions/ # Subscription management
│   │   ├── auth/              # Auth pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── callback/      # OAuth callback
│   │   ├── business/          # Public business pages
│   │   │   ├── [slug]/        # Business detail
│   │   │   └── search/        # Search + filters
│   │   ├── map/               # Full-page map
│   │   ├── pricing/           # Pricing page
│   │   ├── public/            # Static pages
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── faq/
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   └── dashboard/         # Protected dashboards
│   │       ├── user/          # User dashboard
│   │       ├── business/      # Business owner dashboard
│   │       │   ├── listings/  # Manage listings
│   │       │   ├── analytics/ # Business analytics
│   │       │   ├── payments/  # Subscriptions & invoices
│   │       │   ├── media/     # Photo management
│   │       │   └── leads/     # Customer leads
│   │       └── admin/         # Admin panel
│   │           ├── businesses/
│   │           ├── users/
│   │           ├── categories/
│   │           ├── analytics/
│   │           └── advertisements/
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, MobileNav
│   │   ├── business/          # BusinessCard, Reviews, Gallery
│   │   ├── map/               # MapView, MapPreview
│   │   ├── forms/             # Reusable form components
│   │   ├── ui/                # Base UI components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── admin/             # Admin components
│   │   └── providers/         # QueryProvider, ThemeProvider
│   ├── lib/
│   │   ├── supabase/          # Supabase clients (browser/server)
│   │   ├── auth/              # Auth helpers
│   │   ├── payments/          # QPay integration
│   │   ├── email/             # Resend + templates
│   │   ├── search/            # Search utilities
│   │   └── utils/             # cn(), formatters, helpers
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   ├── types/                 # TypeScript interfaces
│   ├── i18n/                  # next-intl configuration
│   ├── middleware.ts           # Auth + i18n middleware
│   └── styles/
│       └── globals.css        # Design tokens + Tailwind
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔑 API Routes

### Public Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/businesses` | List/search businesses |
| GET | `/api/businesses/:id` | Business detail |
| GET | `/api/map` | GeoJSON for Mapbox |
| POST | `/api/map` | Nearby businesses |
| GET | `/api/categories` | All categories |
| GET | `/api/reviews?businessId=` | Business reviews |
| GET | `/api/search?q=` | Full-text search |

### Authenticated Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/businesses` | Create business |
| PATCH | `/api/businesses/:id` | Update business |
| DELETE | `/api/businesses/:id` | Soft delete |
| POST | `/api/reviews` | Write review |
| POST | `/api/payments` | Create payment/subscription |
| GET | `/api/payments` | Payment history |
| POST | `/api/claims` | Claim business |
| POST | `/api/users` | Create user profile |

---

## 💳 QPay Integration

1. Set `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` in `.env.local`
2. QPay webhook URL: `https://yourdomain.mn/api/payments/webhook/qpay?paymentId={id}`
3. Register this URL in your QPay merchant settings

---

## 🗺️ Mapbox Setup

1. Create account at [mapbox.com](https://mapbox.com)
2. Create a public token with `styles:read` and `tiles:read` scopes
3. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables in Vercel dashboard.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔐 Security Features

- ✅ Row Level Security (Supabase RLS)
- ✅ JWT authentication with refresh tokens
- ✅ CSRF protection via Supabase
- ✅ Input validation with Zod
- ✅ XSS protection (Content Security Policy)
- ✅ Rate limiting ready (Redis)
- ✅ Soft deletes (no data loss)
- ✅ Role-based access control (USER / BUSINESS_OWNER / ADMIN / SUPER_ADMIN)

---

## 📊 Database Schema Highlights

- `users` — profiles with roles, social accounts, sessions
- `businesses` — full business profiles with PostGIS geo support
- `business_hours` — per-day open/close times
- `business_media` — photos, videos, 360 tour assets
- `reviews` — with images, votes, owner replies, moderation
- `business_claims` — verified ownership requests
- `subscriptions` — tiered plans with billing periods
- `payments` — QPay/bank/invoice payment records
- `business_analytics` — daily stats per business
- `advertisements` — banner/featured ad system
- `leads` — customer contact inquiries

---

## 🛣️ Roadmap

- [ ] Mobile App (React Native / Expo)
- [ ] AI Recommendation Engine
- [ ] AI Chatbot Assistant
- [ ] AR Navigation
- [ ] Booking System
- [ ] Event System
- [ ] Advertisement Marketplace
- [ ] Multi-city Expansion

---

## 📄 License

MIT License — © 2025 NomadView LLC, Mongolia
