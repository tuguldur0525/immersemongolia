import {
  Building2,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Hotel,
  Scissors,
  ShoppingBag,
  Tent,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restaurants: Utensils,
  hotels: Hotel,
  camps: Tent,
  shopping: ShoppingBag,
  fitness: Dumbbell,
  salons: Scissors,
  entertainment: Gamepad2,
  medical: HeartPulse,
  education: GraduationCap,
}

export function getCategoryIcon(slug?: string | null): LucideIcon {
  if (!slug) return Building2
  return CATEGORY_ICONS[slug] || Building2
}
