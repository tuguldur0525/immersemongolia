// src/lib/utils/index.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яөүё]+/gi, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function formatPrice(amount: number, currency = 'MNT'): string {
  if (currency === 'MNT') {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatInteger(n: number, locale = 'mn-MN'): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(date: string | Date, locale = 'mn-MN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Дөнгөж сая'
  if (minutes < 60) return `${minutes} минутын өмнө`
  if (hours < 24) return `${hours} цагийн өмнө`
  if (days < 7) return `${days} өдрийн өмнө`
  return formatDate(date)
}

export function isOpenNow(hours: Array<{ dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean; is24Hours: boolean }>): boolean {
  const now = new Date()
  const day = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const todayHours = hours.find(h => h.dayOfWeek === day)
  if (!todayHours) return false
  if (todayHours.isClosed) return false
  if (todayHours.is24Hours) return true
  if (!todayHours.openTime || !todayHours.closeTime) return false
  const [openH, openM] = todayHours.openTime.split(':').map(Number)
  const [closeH, closeM] = todayHours.closeTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NV-${year}${month}-${random}`
}

export function buildSearchParams(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, String(value))
      }
    }
  })
  return params.toString()
}

export function parseBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
