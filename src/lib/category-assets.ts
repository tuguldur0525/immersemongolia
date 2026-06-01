export const CATEGORY_IMAGE_PATHS: Record<string, string> = {
  restaurants: '/images/categories/restaurants.webp',
  hotels: '/images/categories/hotels.webp',
  camps: '/images/categories/camps.webp',
  shopping: '/images/categories/shopping.webp',
  fitness: '/images/categories/fitness.webp',
  salons: '/images/categories/salons.webp',
  entertainment: '/images/categories/entertainment.webp',
  medical: '/images/categories/medical.webp',
  education: '/images/categories/education.webp',
}

export function getCategoryImage(slug?: string | null) {
  if (!slug) return undefined
  return CATEGORY_IMAGE_PATHS[slug]
}
