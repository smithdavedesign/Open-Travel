export interface ParsedMapPlace {
  name: string | null
  address: string | null
  lat: number | null
  lng: number | null
  url: string
}

/**
 * Extracts place name and coordinates from a Google Maps URL.
 *
 * Handles these formats:
 *   https://www.google.com/maps/place/Ichiran+Ramen/@35.6595,139.7005,17z/
 *   https://www.google.com/maps/place/Some+Place/data=...
 *   https://maps.google.com/?q=35.6595,139.7005
 *   https://www.google.com/maps?q=Eiffel+Tower
 *   https://maps.apple.com/?ll=48.8584,2.2945&q=Eiffel+Tower
 */
export function parseGoogleMapsUrl(rawUrl: string): ParsedMapPlace {
  const result: ParsedMapPlace = { name: null, address: null, lat: null, lng: null, url: rawUrl }

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return result
  }

  // ── Apple Maps ─────────────────────────────────────────────────────────────
  if (url.hostname === 'maps.apple.com') {
    const ll = url.searchParams.get('ll')
    const q  = url.searchParams.get('q')
    if (ll) {
      const [lat, lng] = ll.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) { result.lat = lat; result.lng = lng }
    }
    if (q) result.name = decodeURIComponent(q.replace(/\+/g, ' '))
    return result
  }

  // ── Google Maps ────────────────────────────────────────────────────────────

  // Format: /maps/place/{name}/@{lat},{lng},{zoom}z
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/@]+)/)
  if (placeMatch) {
    result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
  }

  // Coordinates from @lat,lng,zoom
  const coordMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordMatch) {
    result.lat = parseFloat(coordMatch[1])
    result.lng = parseFloat(coordMatch[2])
  }

  // Fallback: ?q=lat,lng or ?q=place+name
  if (!result.lat || !result.lng) {
    const q = url.searchParams.get('q')
    if (q) {
      const latLng = q.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/)
      if (latLng) {
        result.lat = parseFloat(latLng[1])
        result.lng = parseFloat(latLng[2])
      } else if (!result.name) {
        result.name = decodeURIComponent(q.replace(/\+/g, ' '))
      }
    }
  }

  return result
}

/** Returns true if the URL looks like a Google/Apple Maps link */
export function isMapsUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'maps.app.goo.gl' ||
      hostname === 'maps.google.com' ||
      hostname.endsWith('google.com') && url.includes('/maps') ||
      hostname === 'maps.apple.com'
    )
  } catch {
    return false
  }
}

/** Returns true if the URL is a short link that needs server-side resolution */
export function isShortMapsUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'maps.app.goo.gl'
  } catch {
    return false
  }
}
