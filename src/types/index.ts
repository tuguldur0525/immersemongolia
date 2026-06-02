// src/types/index.ts
// Central type exports for Immerse Mongolia

export type { Database } from './database'

// ─── USER TYPES ──────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'BUSINESS_OWNER' | 'ADMIN' | 'SUPER_ADMIN'

export interface User {
  id: string
  email: string
  emailVerified: string | null
  firstName: string
  lastName: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  role: UserRole
  isActive: boolean
  preferredLanguage: 'mn' | 'en'
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  _count: {
    reviews: number
    savedBusinesses: number
    businesses: number
  }
}

// ─── BUSINESS TYPES ──────────────────────────────────────────────────────────

export type BusinessStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'CLAIMED'
export type PriceRange = '$' | '$$' | '$$$' | '$$$$'

export interface Category {
  id: string
  slug: string
  nameMn: string
  nameEn: string
  descriptionMn: string | null
  descriptionEn: string | null
  icon: string | null
  coverImageUrl: string | null
  color: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  businessCount: number
  children?: Category[]
}

export interface BusinessHours {
  id: string
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  is24Hours: boolean
  notes: string | null
}

export interface BusinessMedia {
  id: string
  type: 'PHOTO' | 'VIDEO' | 'VIRTUAL_TOUR_360' | 'THUMBNAIL' | 'LOGO' | 'COVER'
  url: string
  thumbnailUrl: string | null
  caption: string | null
  altText: string | null
  sortOrder: number
  width: number | null
  height: number | null
}

export interface Business {
  id: string
  slug: string
  ownerId: string | null
  categoryId: string
  status: BusinessStatus
  isVerified: boolean
  isFeatured: boolean
  isPremium: boolean
  featuredUntil: string | null

  nameMn: string
  nameEn: string | null
  descriptionMn: string | null
  descriptionEn: string | null
  taglineMn: string | null
  taglineEn: string | null

  addressMn: string | null
  addressEn: string | null
  district: string | null
  city: string
  country: string
  latitude: number | null
  longitude: number | null

  phone: string | null
  phone2: string | null
  email: string | null
  website: string | null
  whatsapp: string | null

  facebook: string | null
  instagram: string | null
  twitter: string | null
  youtube: string | null
  tiktok: string | null

  priceRange: PriceRange | null
  starRating: number | null
  established: number | null
  tags: string[]
  amenities: string[]

  avgRating: number
  totalReviews: number
  totalViews: number
  totalSaves: number

  logoUrl: string | null
  coverImageUrl: string | null
  virtualTourUrl: string | null
  virtualTourType: string | null

  createdAt: string
  updatedAt: string
}

export interface BusinessDetail extends Business {
  category: Category
  hours: BusinessHours[]
  media: BusinessMedia[]
  owner: Pick<User, 'id' | 'displayName' | 'avatarUrl'> | null
  _count: {
    reviews: number
    savedBy: number
  }
}

export interface BusinessListItem extends Pick<Business,
  'id' | 'slug' | 'nameMn' | 'nameEn' | 'taglineMn' | 'taglineEn' |
  'coverImageUrl' | 'logoUrl' | 'avgRating' | 'totalReviews' |
  'isVerified' | 'isFeatured' | 'isPremium' | 'priceRange' |
  'latitude' | 'longitude' | 'city' | 'district' | 'addressMn'
> {
  category: Pick<Category, 'id' | 'slug' | 'nameMn' | 'nameEn' | 'icon' | 'color'>
  distanceKm?: number
}

export interface MapBusiness {
  id: string
  slug: string
  nameMn: string
  nameEn: string | null
  latitude: number
  longitude: number
  categorySlug: string
  categoryColor: string | null
  avgRating: number
  totalReviews: number
  logoUrl: string | null
  coverImageUrl: string | null
  isVerified: boolean
  isFeatured: boolean
  priceRange: string | null
}

// ─── REVIEW TYPES ────────────────────────────────────────────────────────────

export type ReviewStatus = 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED'

export interface ReviewImage {
  id: string
  url: string
  altText: string | null
  sortOrder: number
}

export interface Review {
  id: string
  businessId: string
  userId: string
  status: ReviewStatus
  rating: number
  title: string | null
  body: string | null
  pros: string | null
  cons: string | null
  visitDate: string | null
  visitType: string | null
  isVerified: boolean
  helpfulCount: number
  ownerReply: string | null
  ownerRepliedAt: string | null
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'firstName' | 'lastName'>
  images: ReviewImage[]
  _count: { votes: number }
  userVote?: 'helpful' | 'not_helpful' | null
}

export interface ReviewFormData {
  rating: number
  title?: string
  body?: string
  pros?: string
  cons?: string
  visitDate?: string
  visitType?: string
  images?: File[]
}

// ─── PAYMENT & SUBSCRIPTION TYPES ────────────────────────────────────────────

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT'
export type PaymentMethod = 'QPAY' | 'BANK_CARD' | 'BANK_TRANSFER' | 'INVOICE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

export interface SubscriptionPlanConfig {
  plan: SubscriptionPlan
  nameMn: string
  nameEn: string
  descriptionMn?: string | null
  descriptionEn?: string | null
  monthlyPriceMnt: number
  annualPriceMnt: number
  features: Record<string, boolean | string | number>
  maxPhotos: number
  maxListings: number
  hasVirtualTour: boolean
  hasAnalytics: boolean
  hasPrioritySupport: boolean
  isFeatured: boolean
}

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  isAnnual: boolean
  startDate: string
  endDate: string
  renewalDate: string | null
  autoRenew: boolean
  priceAtPurchase: number
  currency: string
}

export interface Payment {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  description: string | null
  invoiceNumber: string | null
  qpayQrCode: string | null
  receiptUrl: string | null
  paidAt: string | null
  createdAt: string
}

export interface QPaYInvoice {
  invoiceId: string
  qrCode: string
  qrText: string
  urls: Array<{ name: string; description: string; logo: string; link: string }>
}

// ─── SEARCH & FILTER TYPES ───────────────────────────────────────────────────

export interface SearchFilters {
  query?: string
  categorySlug?: string
  city?: string
  district?: string
  priceRange?: PriceRange[]
  minRating?: number
  isVerified?: boolean
  isFeatured?: boolean
  isOpen?: boolean
  hasVirtualTour?: boolean
  lat?: number
  lng?: number
  radiusKm?: number
  sortBy?: 'relevance' | 'rating' | 'reviews' | 'distance' | 'newest'
  page?: number
  limit?: number
}

export interface SearchResult {
  businesses: BusinessListItem[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
}

// ─── API TYPES ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: Record<string, unknown>
}

export interface PlatformStats {
  totalBusinesses: number
  totalReviews: number
  totalUsers: number
  coveredCities: number
  businessesWithLocation: number
  featuredBusinesses: number
  virtualTourBusinesses: number
  averageRating: number
  newUsersLast7Days: number
  newBusinessesLast7Days: number
  pendingBusinesses: number
  pendingReviews: number
  monthlyRevenueMnt: number
  activeSubscriptions: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
}

// ─── DASHBOARD TYPES ─────────────────────────────────────────────────────────

export interface BusinessAnalyticsSummary {
  period: 'week' | 'month' | 'year'
  totalViews: number
  uniqueViews: number
  totalSaves: number
  totalClicks: number
  phoneClicks: number
  websiteClicks: number
  reviewsCount: number
  avgRating: number
  viewsTrend: number
  clicksTrend: number
  chartData: Array<{ date: string; views: number; clicks: number; saves: number }>
}

export interface AdminStats {
  totalUsers: number
  newUsersToday: number
  totalBusinesses: number
  pendingApprovals: number
  totalRevenueMnt: number
  activeSubscriptions: number
  pendingClaims: number
  pendingReviews: number
}

// ─── FORM TYPES ──────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role?: UserRole
  agreeToTerms: boolean
}

export interface BusinessFormData {
  nameMn: string
  nameEn?: string
  descriptionMn?: string
  descriptionEn?: string
  categoryId: string
  addressMn?: string
  addressEn?: string
  district?: string
  city: string
  phone?: string
  email?: string
  website?: string
  priceRange?: PriceRange
  tags?: string[]
  amenities?: string[]
  facebook?: string
  instagram?: string
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

// ─── NOTIFICATION TYPES ──────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: string
  titleMn: string
  titleEn: string | null
  bodyMn: string | null
  bodyEn: string | null
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

// ─── CLAIM TYPES ─────────────────────────────────────────────────────────────

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'

export interface BusinessClaim {
  id: string
  businessId: string
  userId: string
  status: ClaimStatus
  message: string | null
  verificationDocs: string[]
  adminNotes: string | null
  createdAt: string
  business: Pick<Business, 'id' | 'slug' | 'nameMn' | 'coverImageUrl'>
  user: Pick<User, 'id' | 'displayName' | 'email' | 'avatarUrl'>
}
