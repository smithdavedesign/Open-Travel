/**
 * AviationStack flight status integration.
 * Docs: https://aviationstack.com/documentation
 *
 * Requires AVIATIONSTACK_API_KEY environment variable.
 * Free tier uses HTTP only and returns real-time flight data.
 */

export interface FlightStatusData {
  flight_iata: string
  airline_name: string
  status: string // scheduled | active | landed | cancelled | incident | diverted
  departure: {
    airport: string
    iata: string
    terminal: string | null
    gate: string | null
    delay: number | null // minutes
    scheduled: string | null
    estimated: string | null
    actual: string | null
  }
  arrival: {
    airport: string
    iata: string
    terminal: string | null
    gate: string | null
    delay: number | null
    scheduled: string | null
    estimated: string | null
    actual: string | null
  }
}

/**
 * Look up live status for a flight by its IATA flight number (e.g. "AA100").
 * Returns null on any error so the UI can degrade gracefully.
 */
export async function fetchFlightStatus(
  flightIata: string
): Promise<FlightStatusData | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) return null

  try {
    // AviationStack requires access_key as a query parameter (no header auth).
    // This runs server-side only — the key is never exposed to the client.
    const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&flight_iata=${encodeURIComponent(flightIata)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const json = await res.json()
    const flight = json.data?.[0]
    if (!flight) return null

    return {
      flight_iata: flight.flight?.iata ?? flightIata,
      airline_name: flight.airline?.name ?? '',
      status: flight.flight_status ?? 'unknown',
      departure: {
        airport: flight.departure?.airport ?? '',
        iata: flight.departure?.iata ?? '',
        terminal: flight.departure?.terminal ?? null,
        gate: flight.departure?.gate ?? null,
        delay: flight.departure?.delay ?? null,
        scheduled: flight.departure?.scheduled ?? null,
        estimated: flight.departure?.estimated ?? null,
        actual: flight.departure?.actual ?? null,
      },
      arrival: {
        airport: flight.arrival?.airport ?? '',
        iata: flight.arrival?.iata ?? '',
        terminal: flight.arrival?.terminal ?? null,
        gate: flight.arrival?.gate ?? null,
        delay: flight.arrival?.delay ?? null,
        scheduled: flight.arrival?.scheduled ?? null,
        estimated: flight.arrival?.estimated ?? null,
        actual: flight.arrival?.actual ?? null,
      },
    }
  } catch {
    return null
  }
}
