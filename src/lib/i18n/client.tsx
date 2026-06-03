'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import mnMessages from '../../../public/locales/mn/common.json'
import enMessages from '../../../public/locales/en/common.json'
import { defaultLocale, isValidLocale, type Locale } from '@/i18n/config'

type MessageValue = string | { [key: string]: MessageValue }
type MessageTree = { [key: string]: MessageValue }

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (path: string, fallback?: string) => string
}

const STORAGE_KEY = 'immerse-locale'
const dictionaries: Record<Locale, MessageTree> = {
  mn: mnMessages as MessageTree,
  en: enMessages as MessageTree,
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && isValidLocale(stored)) return stored

  const cookieLocale = document.cookie
    .split('; ')
    .find((item) => item.startsWith('NEXT_LOCALE='))
    ?.split('=')[1]

  return cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale
}

function lookupMessage(tree: MessageTree, path: string): string | null {
  const value = path.split('.').reduce<MessageValue | undefined>((current, key) => {
    if (!current || typeof current === 'string') return undefined
    return current[key]
  }, tree)

  return typeof value === 'string' ? value : null
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    if (typeof window === 'undefined') return

    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLocale
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const nextLocale = current === 'mn' ? 'en' : 'mn'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextLocale)
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`
        document.documentElement.lang = nextLocale
      }
      return nextLocale
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (path: string, fallback?: string) =>
      lookupMessage(dictionaries[locale], path) ??
      lookupMessage(dictionaries[defaultLocale], path) ??
      fallback ??
      path,
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
