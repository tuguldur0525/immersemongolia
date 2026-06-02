'use client'
// src/components/map/MapView.tsx

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import Supercluster from 'supercluster'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Star, ChevronRight, Navigation, Layers } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { MapBusiness } from '@/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN
}

// Mongolia bounds
const MONGOLIA_BOUNDS: mapboxgl.LngLatBoundsLike = [[87.7, 41.5], [119.9, 52.2]]
const UB_CENTER: [number, number] = [106.9057, 47.9021]
const UB_FALLBACK_BOUNDS = {
  swLat: 47.75,
  swLng: 106.65,
  neLat: 48.05,
  neLng: 107.15,
}

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
  searchQuery?: string
  height?: string
  showControls?: boolean
  onBusinessSelect?: (business: MapBusiness) => void
}

export default function MapView({
  filters = {},
  searchQuery = '',
  height = '100%',
  showControls = true,
  onBusinessSelect,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const mapLoadedRef = useRef(false)
  const fetchBusinessesRef = useRef<() => void>(() => undefined)
  const focusedBusinessIdRef = useRef<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusiness | null>(null)
  const [businesses, setBusinesses] = useState<MapBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFallbackMap, setIsFallbackMap] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'standard' | 'satellite'>('standard')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const normalizedSearchQuery = searchQuery.trim()

  const fetchBusinesses = useCallback(async (fallbackBounds = UB_FALLBACK_BOUNDS) => {
    const mapBounds = map.current?.getBounds()
    const requestBounds = mapBounds
      ? {
          swLat: mapBounds.getSouth(),
          swLng: mapBounds.getWest(),
          neLat: mapBounds.getNorth(),
          neLng: mapBounds.getEast(),
        }
      : fallbackBounds

    const params = new URLSearchParams()
    params.set('swLat', requestBounds.swLat.toFixed(6))
    params.set('swLng', requestBounds.swLng.toFixed(6))
    params.set('neLat', requestBounds.neLat.toFixed(6))
    params.set('neLng', requestBounds.neLng.toFixed(6))

    if (filters.categorySlug) params.set('categorySlug', filters.categorySlug)
    if (filters.minRating) params.set('minRating', filters.minRating.toString())
    if (filters.priceRange?.length) params.set('priceRange', filters.priceRange.join(','))
    if (filters.isVerified) params.set('isVerified', 'true')
    if (filters.hasVirtualTour) params.set('hasVirtualTour', 'true')
    if (normalizedSearchQuery) params.set('query', normalizedSearchQuery)

    try {
      const res = await fetch(`/api/map?${params}`)
      if (!res.ok) throw new Error(`Map API failed with ${res.status}`)

      const { data } = await res.json()
      if (data?.features) {
        const biz = data.features.map((f: any) => ({
          ...f.properties,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        }))
        setBusinesses(biz)
        if (map.current && !isFallbackMap) renderMarkers(biz)
      }
    } catch (err) {
      console.error('Map fetch error:', err)
      setMapError('Газрын зураг дээрх газруудыг ачаалж чадсангүй.')
    }
  }, [
    filters.categorySlug,
    filters.hasVirtualTour,
    filters.isVerified,
    filters.minRating,
    filters.priceRange,
    isFallbackMap,
    normalizedSearchQuery,
  ])

  useEffect(() => {
    fetchBusinessesRef.current = () => {
      void fetchBusinesses()
    }
  }, [fetchBusinesses])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token тохируулаагүй тул газрын зургийг жагсаалттай fallback горимоор харуулж байна.')
      setIsFallbackMap(true)
      setIsLoading(false)
      fetchBusinessesRef.current()
      return
    }

    let loadTimeout: number | undefined

    try {
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
    } catch (error) {
      console.error('Mapbox init error:', error)
      setMapError('Газрын зураг ачаалж чадсангүй. Газруудыг fallback горимоор харуулж байна.')
      setIsFallbackMap(true)
      setIsLoading(false)
      fetchBusinessesRef.current()
      return
    }

    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    }

    const handleMapReady = () => {
      mapLoadedRef.current = true
      setIsFallbackMap(false)
      setMapError(null)
      setIsLoading(false)
      map.current?.resize()
      fetchBusinessesRef.current()
    }

    map.current.once('load', handleMapReady)
    map.current.on('moveend', () => fetchBusinessesRef.current())
    map.current.on('error', (event) => {
      console.error('Mapbox error:', event.error)
      if (!mapLoadedRef.current) {
        setMapError('Газрын зураг бүрэн ачаалж чадсангүй. Газруудыг fallback горимоор харуулж байна.')
        setIsFallbackMap(true)
        setIsLoading(false)
        fetchBusinessesRef.current()
      }
    })

    requestAnimationFrame(() => map.current?.resize())
    loadTimeout = window.setTimeout(() => {
      if (!mapLoadedRef.current) {
        setMapError('Газрын зураг ачаалахад удаж байна. Газруудыг fallback горимоор харуулж байна.')
        setIsFallbackMap(true)
        setIsLoading(false)
        fetchBusinessesRef.current()
      }
    }, 8000)

    const handleResize = () => map.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      if (loadTimeout) window.clearTimeout(loadTimeout)
      window.removeEventListener('resize', handleResize)
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      map.current?.remove()
      map.current = null
      mapLoadedRef.current = false
    }
  }, [showControls])

  useEffect(() => {
    if (!map.current && !isFallbackMap) return
    void fetchBusinesses()
  }, [fetchBusinesses, isFallbackMap])

  useEffect(() => {
    const businessId = new URLSearchParams(window.location.search).get('business')
    if (!businessId || (focusedBusinessIdRef.current === businessId && selectedBusiness?.id === businessId)) return

    let cancelled = false

    async function focusBusiness() {
      try {
        const res = await fetch(`/api/businesses/${businessId}`)
        if (!res.ok) return

        const { data } = await res.json()
        if (!data?.latitude || !data?.longitude) return

        const business: MapBusiness = {
          id: data.id,
          slug: data.slug,
          nameMn: data.nameMn,
          nameEn: data.nameEn,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          categorySlug: data.category?.slug || 'default',
          categoryColor: data.category?.color || null,
          avgRating: Number(data.avgRating || 0),
          totalReviews: data.totalReviews || data._count?.reviews || 0,
          logoUrl: data.logoUrl || null,
          coverImageUrl: data.coverImageUrl || null,
          isVerified: Boolean(data.isVerified),
          isFeatured: Boolean(data.isFeatured),
          priceRange: data.priceRange || null,
        }

        if (cancelled) return

        focusedBusinessIdRef.current = businessId
        setSelectedBusiness(business)
        onBusinessSelect?.(business)
        setBusinesses(prev => {
          const merged = prev.some(item => item.id === business.id) ? prev : [business, ...prev]
          if (map.current && !isFallbackMap) {
            requestAnimationFrame(() => renderMarkers(merged))
          }
          return merged
        })

        if (map.current && !isFallbackMap) {
          map.current.flyTo({
            center: [business.longitude, business.latitude],
            zoom: 15,
            offset: [0, -80],
            duration: 800,
          })
        }
      } catch (error) {
        console.error('Map business focus error:', error)
      }
    }

    void focusBusiness()

    return () => {
      cancelled = true
    }
  }, [isFallbackMap, onBusinessSelect, selectedBusiness?.id])

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
        el.className = 'business-map-marker'
        el.style.cssText = `
          width: 46px;
          height: 46px;
          border-radius: 999px;
          background: white;
          border: 3px solid ${color};
          cursor: pointer;
          box-shadow: 0 3px 14px rgba(15,23,42,0.24);
          transition: box-shadow 0.15s, border-color 0.15s;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        `

        if (biz.logoUrl) {
          const logo = document.createElement('img')
          logo.src = biz.logoUrl
          logo.alt = biz.nameMn
          logo.loading = 'lazy'
          logo.decoding = 'async'
          logo.referrerPolicy = 'no-referrer'
          logo.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
            pointer-events: none;
          `
          logo.onerror = () => {
            logo.remove()
            el.textContent = getBusinessInitials(biz.nameMn)
            el.style.color = color
            el.style.fontWeight = '800'
            el.style.fontSize = '13px'
          }
          el.appendChild(logo)
        } else {
          el.textContent = getBusinessInitials(biz.nameMn)
          el.style.color = color
          el.style.fontWeight = '800'
          el.style.fontSize = '13px'
        }

        el.addEventListener('mouseenter', () => {
          el.style.boxShadow = '0 5px 18px rgba(15,23,42,0.32), 0 0 0 4px rgba(255,255,255,0.9)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.boxShadow = '0 3px 14px rgba(15,23,42,0.24)'
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
    if (!navigator.geolocation) {
      setMapError('Таны browser байршил тогтоох боломжгүй байна.')
      return
    }

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      setUserLocation([longitude, latitude])
      if (!map.current || isFallbackMap) return

      map.current.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1000 })

      // Add user dot
      userMarkerRef.current?.remove()
      const el = document.createElement('div')
      el.style.cssText = `
        width: 16px; height: 16px;
        background: hsl(220 85% 57%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 8px hsl(220 85% 57% / 0.2);
      `
      userMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map.current)
    }, () => {
      setMapError('Байршлын зөвшөөрөл олдсонгүй.')
    })
  }

  function toggleLayer() {
    if (!map.current || isFallbackMap) return

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
      <div ref={mapContainer} className={cn('h-full w-full', isFallbackMap && 'hidden')} />

      {isFallbackMap && (
        <FallbackBusinessMap
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          userLocation={userLocation}
          onSelect={(biz) => {
            setSelectedBusiness(biz)
            onBusinessSelect?.(biz)
          }}
        />
      )}

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
            disabled={isFallbackMap}
            title="Давхарга солих"
          >
            <Layers size={18} />
          </button>
        </div>
      )}

      {mapError && !isLoading && (
        <div className="absolute top-4 left-16 right-4 sm:right-auto sm:max-w-sm z-20">
          <div className="rounded-xl border border-border bg-card/95 px-3 py-2 text-xs text-foreground-secondary shadow-md backdrop-blur-sm">
            {mapError}
          </div>
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

function FallbackBusinessMap({
  businesses,
  selectedBusiness,
  userLocation,
  onSelect,
}: {
  businesses: MapBusiness[]
  selectedBusiness: MapBusiness | null
  userLocation: [number, number] | null
  onSelect: (business: MapBusiness) => void
}) {
  const visibleBusinesses = useMemo(
    () => businesses.filter(b => Number.isFinite(b.latitude) && Number.isFinite(b.longitude)),
    [businesses]
  )

  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(0deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px]">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-background-secondary to-brand-success/10" />
      <div className="absolute left-4 top-4 right-4 sm:right-auto sm:w-72 rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin size={16} className="text-brand-primary" />
          Улаанбаатар орчмын газрууд
        </div>
        <p className="mt-1 text-xs text-foreground-muted">
          {visibleBusinesses.length > 0 ? `${visibleBusinesses.length} газар олдлоо` : 'Илэрц олдсонгүй'}
        </p>
      </div>

      {userLocation && <FallbackPin longitude={userLocation[0]} latitude={userLocation[1]} isUserPin />}

      {visibleBusinesses.map((biz) => (
        <FallbackPin
          key={biz.id}
          business={biz}
          longitude={biz.longitude}
          latitude={biz.latitude}
          isSelected={selectedBusiness?.id === biz.id}
          onClick={() => onSelect(biz)}
        />
      ))}

      <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-1 sm:left-auto sm:w-96 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0">
        {visibleBusinesses.slice(0, 8).map((biz) => (
          <button
            key={biz.id}
            onClick={() => onSelect(biz)}
            className={cn(
              'min-w-64 rounded-xl border bg-card/95 p-3 text-left shadow-md backdrop-blur-sm transition-all sm:min-w-0',
              selectedBusiness?.id === biz.id
                ? 'border-brand-primary ring-2 ring-brand-primary/20'
                : 'border-border hover:border-brand-primary'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="line-clamp-1 text-sm font-semibold">{biz.nameMn}</p>
                <p className="mt-1 text-xs text-foreground-muted">{biz.categorySlug}</p>
              </div>
              {biz.avgRating > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-brand-accent">
                  <Star size={12} fill="currentColor" />
                  {Number(biz.avgRating).toFixed(1)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function FallbackPin({
  business,
  longitude,
  latitude,
  isSelected,
  isUserPin,
  onClick,
}: {
  business?: MapBusiness
  longitude: number
  latitude: number
  isSelected?: boolean
  isUserPin?: boolean
  onClick?: () => void
}) {
  const left = clamp(((longitude - UB_FALLBACK_BOUNDS.swLng) / (UB_FALLBACK_BOUNDS.neLng - UB_FALLBACK_BOUNDS.swLng)) * 100, 8, 92)
  const top = clamp((1 - (latitude - UB_FALLBACK_BOUNDS.swLat) / (UB_FALLBACK_BOUNDS.neLat - UB_FALLBACK_BOUNDS.swLat)) * 100, 12, 88)
  const color = business ? CATEGORY_COLORS[business.categorySlug] || business.categoryColor || CATEGORY_COLORS.default : 'hsl(220 85% 57%)'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-lg transition-shadow',
        onClick && 'hover:shadow-xl',
        isSelected && 'ring-4 ring-brand-primary/20'
      )}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: isUserPin ? 18 : 34,
        height: isUserPin ? 18 : 34,
        background: color,
        boxShadow: isUserPin ? `0 0 0 8px ${color}33` : undefined,
      }}
      title={business?.nameMn || 'Таны байршил'}
    >
      {business?.logoUrl ? (
        <img
          src={business.logoUrl}
          alt={business.nameMn}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : !isUserPin ? (
        <MapPin size={17} className="text-white" />
      ) : null}
    </button>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getBusinessInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
