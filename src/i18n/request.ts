// Reserved for next-intl — enable when [locale] routes are added
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale } from './config'

export default getRequestConfig(async ({ locale }) => ({
  locale: locale || defaultLocale,
  messages: (await import(`../../public/locales/${locale || defaultLocale}/common.json`))
    .default,
}))
