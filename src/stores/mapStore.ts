import { create } from 'zustand'
import type { MapBusiness } from '@/types'

interface MapFilters {
  categorySlug: string
  minRating: number
  priceRange: string[]
  isVerified: boolean
  hasVirtualTour: boolean
}

interface MapState {
  selectedBusiness: MapBusiness | null
  filters: MapFilters
  zoom: number
  center: [number, number]
  setSelectedBusiness: (business: MapBusiness | null) => void
  setFilters: (filters: Partial<MapFilters>) => void
  resetFilters: () => void
  setZoom: (zoom: number) => void
  setCenter: (center: [number, number]) => void
}

const DEFAULT_FILTERS: MapFilters = {
  categorySlug: '',
  minRating: 0,
  priceRange: [],
  isVerified: false,
  hasVirtualTour: false,
}

export const useMapStore = create<MapState>((set) => ({
  selectedBusiness: null,
  filters: DEFAULT_FILTERS,
  zoom: 12,
  center: [106.9057, 47.9021],
  setSelectedBusiness: (selectedBusiness) => set({ selectedBusiness }),
  setFilters: (newFilters) => set((s) => ({ filters: { ...s.filters, ...newFilters } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setZoom: (zoom) => set({ zoom }),
  setCenter: (center) => set({ center }),
}))
