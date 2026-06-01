'use client'
// src/components/map/MapView.tsx

import { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import Supercluster from 'supercluster'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Star, ChevronRight, Navigation, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { MapBusiness } from '@/types'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Mongolia bounds
const MONGOLIA_BOUNDS: mapboxgl.LngLatBoundsLike = [[87.7, 41.5], [119.9, 52.2]]
const UB_CENTER: [number, number] = [106.9057, 47.9021]

const CATEGORY_COLORS: Record<string, string> = {
  restaurants: '#ef4444',
  hotels: '#3b82f6',
  camps: '#22c55e',
  shopping: '#f59e0b',
  fitness: '#8b5cf6',
  salons: '#ec4899',
  default: '#6366f1',
}

interface MapViewProps {
  initialBounds?: mapboxgl.LngLatBoundsLike
  filters?: {
    categorySlug?: string
    minRating?: number
    priceRange?: string[]
    isVerified?: boolean
    hasVirtualTour?: boolean
  }
  height?: string
  showControls?: boolean
  onBusinessSelect?: (business: MapBusiness) => void
}

export default function MapView({
  filters = {},
  height = '100%',
  showControls = true,
  onBusinessSelect,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)
  const [businesses, setBusinesses] = useState<MapBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState<'standard' | 'satellite'>('standard')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: UB_CENTER,
      zoom: 12,
      maxBounds: MONGOLIA_BOUNDS,
      minZoom: 4,
      maxZoom: 20,
      attributionControl: false,
    })

    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    }

    map.current.on('load', () => {
      setIsLoading(false)
      fetchBusinesses()
    })

    map.current.on('moveend', fetchBusinesses)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Fetch businesses when bounds change
  const fetchBusinesses = useCallback(async () => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    if (!bounds) return

    const params = new URLSearchParams({
      swLat: bounds.getSouth().toFixed(6),
      swLng: bounds.getWest().toFixed(6),
      neLat: bounds.getNorth().toFixed(6),
      neLng: bounds.getEast().toFixed(6),
      ...(filters.categorySlug && { categorySlug: filters.categorySlug }),
      ...(filters.minRating && { minRating: filters.minRating.toString() }),
      ...(filters.isVerified && { isVerified: 'true' }),
      ...(filters.hasVirtualTour && { hasVirtualTour: 'true' }),
    })

    try {
      const res = await fetch(`/api/map?${params}`)
      const { data } = await res.json()
      if (data?.features) {
        const biz = data.features.map((f: any) => ({
          ...f.properties,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        }))
        setBusinesses(biz)
        renderMarkers(biz)
      }
    } catch (err) {
      console.error('Map fetch error:', err)
    }
  }, [filters])

  // Render markers with clustering
  function renderMarkers(data: MapBusiness[]) {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!map.current) return
    const zoom = map.current.getZoom()

    // Use supercluster for clustering
    const points = data
      .filter(b => b.latitude && b.longitude)
      .map(b => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [b.longitude, b.latitude] },
        properties: b,
      }))

    const supercluster = new Supercluster({ radius: 60, maxZoom: 16 })
    supercluster.load(points)

    const bounds = map.current.getBounds()
    if (!bounds) return

    const clusters = supercluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(zoom)
    )

    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates

      if (cluster.properties.cluster) {
        // Cluster marker
        const count = cluster.properties.point_count
        const el = document.createElement('div')
        el.className = 'cluster-marker'
        el.style.cssText = `
          width: ${count > 100 ? 52 : count > 20 ? 44 : 36}px;
          height: ${count > 100 ? 52 : count > 20 ? 44 : 36}px;
          background: hsl(220 85% 57%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: transform 0.15s;
        `
        el.textContent = count > 999 ? `${Math.floor(count / 1000)}k` : count.toString()
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.1)' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
        el.addEventListener('click', () => {
          map.current?.flyTo({ center: [lng, lat], zoom: zoom + 2, duration: 600 })
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!)
        markersRef.current.push(marker)
      } else {
        // Individual business marker
        const biz = cluster.properties as MapBusiness
        const color = CATEGORY_COLORS[biz.categorySlug] || biz.categoryColor || CATEGORY_COLORS.default

        const el = document.createElement('div')
        el.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        `

        const icon = document.createElement('div')
        icon.style.cssText = `
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 14px;
          margin-top: 2px;
        `
        // Icon based on category would go here

        el.appendChild(icon)

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'rotate(-45deg) scale(1.2)'
          el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = biz.id === selectedBusiness?.id ? 'rotate(-45deg) scale(1.2)' : 'rotate(-45deg)'
          el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)'
        })
        el.addEventListener('click', () => {
          setSelectedBusiness(biz)
          onBusinessSelect?.(biz)
          map.current?.flyTo({ center: [lng, lat], offset: [0, -80], duration: 500 })
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!)
        markersRef.current.push(marker)
      }
    })
  }

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      setUserLocation([longitude, latitude])
      map.current?.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1000 })

      // Add user dot
      const el = document.createElement('div')
      el.style.cssText = `
        width: 16px; height: 16px;
        background: hsl(220 85% 57%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 8px hsl(220 85% 57% / 0.2);
      `
      new mapboxgl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map.current!)
    })
  }

  function toggleLayer() {
    const newLayer = activeLayer === 'standard' ? 'satellite' : 'standard'
    setActiveLayer(newLayer)
    map.current?.setStyle(
      newLayer === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11'
    )
    map.current?.once('styledata', () => fetchBusinesses())
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background-secondary flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
            <p className="text-sm text-foreground-muted">Газрын зураг ачааллаж байна...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={handleLocate}
            className="size-10 rounded-xl bg-card border border-border shadow-md flex items-center justify-center text-foreground-secondary hover:text-brand-primary hover:border-brand-primary transition-colors"
            title="Байршил тогтоох"
          >
            <Navigation size={18} />
          </button>
          <button
            onClick={toggleLayer}
            className={cn(
              'size-10 rounded-xl border shadow-md flex items-center justify-center transition-colors',
              activeLayer === 'satellite'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-card border-border text-foreground-secondary hover:text-brand-primary'
            )}
            title="Давхарга солих"
          >
            <Layers size={18} />
          </button>
        </div>
      )}

      {/* Selected Business Popup */}
      <AnimatePresence>
        {selectedBusiness && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20"
          >
            <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
              {/* Header image */}
              {selectedBusiness.coverImageUrl ? (
                <div className="relative h-36">
                  <Image src={selectedBusiness.coverImageUrl} alt={selectedBusiness.nameMn} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className="h-16 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20" />
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-base leading-tight line-clamp-1">
                    {selectedBusiness.nameMn}
                  </h3>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="size-6 rounded-full hover:bg-background-secondary flex items-center justify-center text-foreground-muted shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-sm mb-3">
                  {selectedBusiness.avgRating > 0 && (
                    <div className="star-rating flex items-center gap-1">
                      <Star size={13} fill="currentColor" />
                      <span className="font-medium">{Number(selectedBusiness.avgRating).toFixed(1)}</span>
                      <span className="text-foreground-muted">({selectedBusiness.totalReviews})</span>
                    </div>
                  )}
                  {selectedBusiness.isVerified && (
                    <span className="verified-badge text-xs">✓</span>
                  )}
                </div>

                <Link
                  href={`/business/${selectedBusiness.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:brightness-110 transition-all"
                >
                  Дэлгэрэнгүй харах
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Business count */}
      {businesses.length > 0 && (
        <div className="absolute top-4 right-4 sm:right-16">
          <div className="px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs font-medium shadow-sm">
            {businesses.length} газар
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
