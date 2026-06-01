// src/app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://immersemongolia.mn'

// In production, fetch real business slugs from DB
async function getBusinessSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/businesses?limit=1000&status=ACTIVE`, {
      next: { revalidate: 3600 },
    })
    const { data } = await res.json()
    return (data?.businesses || []).map((b: { slug: string }) => b.slug)
  } catch {
    return []
  }
}

async function getCategorySlugs(): Promise<string[]> {
  return [
    'restaurants', 'hotels', 'camps', 'shopping',
    'fitness', 'salons', 'entertainment', 'medical', 'education',
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businessSlugs, categorySlugs] = await Promise.all([
    getBusinessSlugs(),
    getCategorySlugs(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/map`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/business/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/public/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/public/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/public/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/public/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/public/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map(slug => ({
    url: `${BASE_URL}/business/search?categorySlug=${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const businessPages: MetadataRoute.Sitemap = businessSlugs.map(slug => ({
    url: `${BASE_URL}/business/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...businessPages]
}
