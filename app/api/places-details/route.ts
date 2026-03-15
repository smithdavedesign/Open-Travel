import { NextRequest, NextResponse } from 'next/server'

/**
 * Fetches basic place details from Google Places API using a Place ID.
 * Only called as a fallback when URL parsing fails to extract a name.
 * Requests only `displayName` and `formattedAddress` (Basic tier — lowest cost).
 */
export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('place_id')
  if (!placeId) return NextResponse.json({ error: 'place_id is required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Places API not configured' }, { status: 503 })

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          // Request only the cheapest Basic-tier fields to minimize cost
          'X-Goog-FieldMask': 'displayName,formattedAddress',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Places API request failed' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({
      name: data.displayName?.text ?? null,
      address: data.formattedAddress ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 })
  }
}
