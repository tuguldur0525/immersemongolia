// src/hooks/index.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, SearchFilters, Review, ReviewFormData, PlatformStats } from '@/types'
import type { SubscriptionPlanConfig } from '@/types'

// ── Auth hook ──────────────────────────────────────────────────────────────
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: sbUser } }) => {
      if (!sbUser) { setIsLoading(false); return }
      const res = await fetch('/api/users')
      const { data } = await res.json()
      setUser(data)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { setUser(null); return }
      if (session?.user) {
        const res = await fetch('/api/users')
        const { data } = await res.json()
        setUser(data)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}

// ── Businesses hook ────────────────────────────────────────────────────────
export function useBusinesses(filters: SearchFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, Array.isArray(v) ? v.join(',') : String(v))
    }
  })

  return useQuery({
    queryKey: ['businesses', filters],
    queryFn: async () => {
      const res = await fetch(`/api/businesses?${params}`)
      if (!res.ok) throw new Error('Failed to fetch businesses')
      const { data } = await res.json()
      return data
    },
    staleTime: 60_000,
  })
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch platform stats')
      const { data } = await res.json()
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlanConfig[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/plans')
      if (!res.ok) throw new Error('Failed to fetch subscription plans')
      const { data } = await res.json()
      return data || []
    },
    staleTime: 5 * 60_000,
  })
}

export function useBusiness(slugOrId: string) {
  return useQuery({
    queryKey: ['business', slugOrId],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${slugOrId}`)
      if (!res.ok) throw new Error('Business not found')
      const { data } = await res.json()
      return data
    },
    enabled: !!slugOrId,
    staleTime: 120_000,
  })
}

// ── Reviews hook ───────────────────────────────────────────────────────────
export function useReviews(businessId: string, sortBy = 'newest') {
  return useQuery({
    queryKey: ['reviews', businessId, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?businessId=${businessId}&sortBy=${sortBy}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const { data } = await res.json()
      return data
    },
    enabled: !!businessId,
    staleTime: 60_000,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReviewFormData & { businessId: string }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Failed to create review')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.businessId] })
      queryClient.invalidateQueries({ queryKey: ['business', variables.businessId] })
    },
  })
}

// ── Saved businesses hook ──────────────────────────────────────────────────
export function useSavedBusinesses() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['saved-businesses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const res = await fetch('/api/users/saved')
      if (!res.ok) return []
      const { data } = await res.json()
      return data || []
    },
    staleTime: 60_000,
  })
}

export function useToggleSaved() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ businessId, isSaved }: { businessId: string; isSaved: boolean }) => {
      const res = await fetch(`/api/users/saved`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })
      if (!res.ok) throw new Error('Failed to update saved')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-businesses'] })
    },
  })
}

// ── Categories hook ────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const { data } = await res.json()
      return data
    },
    staleTime: 5 * 60_000,
  })
}

// ── Debounce hook ──────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Media query hook ───────────────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export const useIsMobile = () => useMediaQuery('(max-width: 768px)')

// ── Local storage hook ─────────────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
