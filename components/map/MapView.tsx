'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Place, PlaceCategory } from '@/types'
import { MapPin, Loader2 } from 'lucide-react'

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food_drink: '#ea580c',
  things_to_do: '#db2777',
  nature: '#16a34a',
  shopping: '#9333ea',
  work_friendly: '#2563eb',
}

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food_drink: 'Food & Drink',
  things_to_do: 'Things To Do',
  nature: 'Nature',
  shopping: 'Shopping',
  work_friendly: 'Work-Friendly',
}

interface Props {
  places: Place[]
  mapboxToken: string
}

interface GeocodedPlace extends Place {
  lng: number
  lat: number
}

async function geocodeLocation(
  location: string,
  token: string
): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(location)}&access_token=${encodeURIComponent(token)}&limit=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    const [lng, lat] = feature.geometry.coordinates
    return [lng, lat]
  } catch {
    return null
  }
}

export default function MapView({ places, mapboxToken }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [loading, setLoading] = useState(true)
  const [geocoded, setGeocoded] = useState<GeocodedPlace[]>([])
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | 'all'>('all')

  // Build geocoded list: use stored coords where available, geocode the rest
  useEffect(() => {
    let cancelled = false
    async function run() {
      // Places that already have stored coordinates — instant, no API call
      const withCoords: GeocodedPlace[] = places
        .filter((p) => p.lng != null && p.lat != null)
        .map((p) => ({ ...p, lng: p.lng!, lat: p.lat! }))

      // Places that need geocoding (have a location string but no stored coords)
      const needsGeocode = places.filter((p) => (p.lng == null || p.lat == null) && p.location?.trim())

      const BATCH_SIZE = 5
      const geocodedResults: GeocodedPlace[] = []
      for (let i = 0; i < needsGeocode.length; i += BATCH_SIZE) {
        if (cancelled) return
        const batch = needsGeocode.slice(i, i + BATCH_SIZE)
        const coords = await Promise.all(
          batch.map((place) => geocodeLocation(place.location!, mapboxToken))
        )
        for (let j = 0; j < batch.length; j++) {
          if (coords[j]) {
            geocodedResults.push({ ...batch[j], lng: coords[j]![0], lat: coords[j]![1] })
          }
        }
      }

      if (!cancelled) {
        setGeocoded([...withCoords, ...geocodedResults])
        setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [places, mapboxToken])

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    mapboxgl.accessToken = mapboxToken
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 1.5,
    })
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [mapboxToken])

  // Render markers when geocoded data or filter changes
  useEffect(() => {
    const currentMap = map.current
    if (!currentMap) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const filtered =
      activeCategory === 'all'
        ? geocoded
        : geocoded.filter((p) => p.category === activeCategory)

    for (const place of filtered) {
      const lat = Number(place.lat)
      const lng = Number(place.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      const color = CATEGORY_COLORS[place.category] ?? '#6b7280'

      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = color
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      const safeUrl = place.url && /^https?:\/\//i.test(place.url) ? place.url.replace(/[\r\n]/g, '') : null
      const mapsHref = safeUrl
        ?? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

      const popup = new mapboxgl.Popup({ offset: 20, maxWidth: '240px' }).setHTML(
        `<div style="font-family:system-ui,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px">
            <p style="font-weight:600;font-size:14px;margin:0">${escapeHtml(place.name)}</p>
            <a href="${escapeHtml(mapsHref)}" target="_blank" rel="noopener noreferrer"
               title="Open in Maps"
               style="flex-shrink:0;color:#64748b;line-height:1;margin-top:1px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
            </a>
          </div>
          ${place.location ? `<p style="font-size:12px;color:#64748b;margin:0 0 4px">📍 ${escapeHtml(place.location)}</p>` : ''}
          <span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:9999px;background:${color}20;color:${color};font-weight:500">${CATEGORY_LABELS[place.category]}</span>
          ${place.status === 'approved' ? '<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:9999px;background:#dcfce7;color:#16a34a;font-weight:500;margin-left:4px">Approved</span>' : ''}
          ${place.notes ? `<p style="font-size:12px;color:#64748b;margin:6px 0 0">${escapeHtml(place.notes)}</p>` : ''}
        </div>`
      )

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(currentMap)

      markersRef.current.push(marker)
    }

    // Fit bounds if there are markers
    if (filtered.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      for (const p of filtered) {
        const pLat = Number(p.lat)
        const pLng = Number(p.lng)
        if (Number.isFinite(pLat) && Number.isFinite(pLng)) bounds.extend([pLng, pLat])
      }
      currentMap.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    }
  }, [geocoded, activeCategory])

  const categories: (PlaceCategory | 'all')[] = [
    'all',
    'food_drink',
    'things_to_do',
    'nature',
    'shopping',
    'work_friendly',
  ]

  const placesWithLocation = places.filter((p) => p.location?.trim())
  const filteredCount =
    activeCategory === 'all'
      ? geocoded.length
      : geocoded.filter((p) => p.category === activeCategory).length

  return (
    <div className="flex flex-col gap-4">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count =
            cat === 'all'
              ? geocoded.length
              : geocoded.filter((p) => p.category === cat).length
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat === 'all' ? (
                <>
                  <MapPin className="h-3 w-3" />
                  All Places
                </>
              ) : (
                <>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  {CATEGORY_LABELS[cat]}
                </>
              )}
              <span
                className={`ml-0.5 ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}
              >
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading places…
              </p>
            </div>
          </div>
        )}
        <div ref={mapContainer} style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }} />
      </div>

      {/* Summary */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredCount} of{' '}
          {places.length} places on map
          {places.length > geocoded.length && (
            <span>
              {' '}
              · {places.length - geocoded.length} places could not be mapped (missing or
              unrecognized location)
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function escapeHtml(str: string | null | undefined): string {
  if (str == null) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
