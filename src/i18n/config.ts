// src/i18n/config.ts
export const locales = ['mn', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'mn'

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
