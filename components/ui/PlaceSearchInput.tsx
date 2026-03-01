'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'

export interface PlaceSuggestion {
  name: string
  address: string
  lng: number
  lat: number
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: PlaceSuggestion) => void
  onClear?: () => void
  placeholder?: string
  mapboxToken: string
  /** Show a subtle indicator that coords are stored */
  hasCoords?: boolean
}

export default function PlaceSearchInput({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder = 'Search for a place…',
  mapboxToken,
  hasCoords = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(value)}&access_token=${mapboxToken}&limit=5&types=poi,address,place`
        )
        if (!res.ok) return
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: PlaceSuggestion[] = (data.features ?? []).map((f: any) => ({
          name: f.properties.name ?? f.properties.full_address,
          address: f.properties.full_address ?? f.properties.place_formatted ?? '',
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }))
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        // silently fail — user can still type manually
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, mapboxToken])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 h-9 text-sm rounded-md border border-input bg-background px-3 py-1 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
        {!loading && value && onClear && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClear() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {hasCoords && !open && (
        <p className="mt-1 text-xs text-green-700 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Location pinned on map
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0"
              onMouseDown={e => {
                e.preventDefault()
                onSelect(s)
                setOpen(false)
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                {s.address !== s.name && (
                  <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
