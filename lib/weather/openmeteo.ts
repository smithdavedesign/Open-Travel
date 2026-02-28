/**
 * Open-Meteo weather integration — free, no API key required.
 * Docs: https://open-meteo.com/en/docs
 */

export interface DayWeather {
  weatherCode: number
  tempMax: number // °C
  tempMin: number // °C
}

export type WeatherByDate = Record<string, DayWeather> // YYYY-MM-DD → weather

// ─── WMO weather code helpers ─────────────────────────────────────────────

export function weatherEmoji(code: number): string {
  if (code === 0)            return '☀️'
  if (code <= 2)             return '🌤️'
  if (code === 3)            return '☁️'
  if (code <= 48)            return '🌫️'
  if (code <= 55)            return '🌦️'
  if (code <= 65)            return '🌧️'
  if (code <= 75)            return '❄️'
  if (code <= 82)            return '🌧️'
  return '⛈️'
}

export function weatherDesc(code: number): string {
  if (code === 0)    return 'Clear sky'
  if (code <= 2)     return 'Partly cloudy'
  if (code === 3)    return 'Overcast'
  if (code <= 48)    return 'Foggy'
  if (code <= 55)    return 'Drizzle'
  if (code <= 65)    return 'Rain'
  if (code <= 75)    return 'Snow'
  if (code <= 82)    return 'Showers'
  return 'Thunderstorm'
}

// ─── Geocoding ────────────────────────────────────────────────────────────

interface GeoResult {
  lat: number
  lng: number
  name: string
  country: string
}

async function geocode(location: string): Promise<GeoResult | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24 h
    if (!res.ok) return null
    const data = await res.json()
    const r = data.results?.[0]
    if (!r) return null
    return { lat: r.latitude, lng: r.longitude, name: r.name, country: r.country_code ?? '' }
  } catch {
    return null
  }
}

// ─── Forecast fetch ───────────────────────────────────────────────────────

export interface WeatherResult {
  location: string
  daily: WeatherByDate
}

/**
 * Fetches daily weather for a location and date range.
 * Uses the forecast endpoint with past_days support — covers trips up to
 * 92 days in the past and 16 days into the future.
 * Returns null silently on any error so the UI degrades gracefully.
 */
export async function fetchTripWeather(
  destinations: string[],
  startDate: string | null,
  endDate: string | null
): Promise<WeatherResult | null> {
  const location = destinations[0]
  if (!location) return null

  const geo = await geocode(location)
  if (!geo) return null

  // Build date params.
  // End always stretches to today+14 regardless of trip end_date, so the calendar
  // always shows forecast for the current week even when the trip has ended or its
  // end_date falls mid-week (e.g. Feb 28 while the week runs into March).
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const maxForecastStr = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0]

  const start = startDate ?? todayStr
  const end   = maxForecastStr

  try {
    const params = new URLSearchParams({
      latitude:    String(geo.lat),
      longitude:   String(geo.lng),
      daily:       'weather_code,temperature_2m_max,temperature_2m_min',
      timezone:    'auto',
      start_date:  start,
      end_date:    end,
    })

    const url = `https://api.open-meteo.com/v1/forecast?${params}`
    const res = await fetch(url, { next: { revalidate: 3600 } }) // cache 1 h
    if (!res.ok) return null

    const data = await res.json()
    const dates:    string[] = data.daily?.time                ?? []
    const codes:    number[] = data.daily?.weather_code        ?? []
    const maxTemps: number[] = data.daily?.temperature_2m_max  ?? []
    const minTemps: number[] = data.daily?.temperature_2m_min  ?? []

    const daily: WeatherByDate = {}
    dates.forEach((d, i) => {
      daily[d] = {
        weatherCode: codes[i]    ?? 0,
        tempMax:     Math.round(maxTemps[i] ?? 0),
        tempMin:     Math.round(minTemps[i] ?? 0),
      }
    })

    return { location: `${geo.name}${geo.country ? ', ' + geo.country.toUpperCase() : ''}`, daily }
  } catch {
    return null
  }
}
