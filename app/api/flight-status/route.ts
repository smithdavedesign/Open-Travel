import { NextRequest, NextResponse } from 'next/server'
import { fetchFlightStatus } from '@/lib/aviationstack/client'

export async function GET(request: NextRequest) {
  const flightIata = request.nextUrl.searchParams.get('flight')
  if (!flightIata) {
    return NextResponse.json(
      { error: 'flight query parameter is required' },
      { status: 400 }
    )
  }

  if (!process.env.AVIATIONSTACK_API_KEY) {
    return NextResponse.json(
      { error: 'Flight status service is not configured' },
      { status: 503 }
    )
  }

  const status = await fetchFlightStatus(flightIata)
  if (!status) {
    return NextResponse.json(
      { error: 'Flight not found or service unavailable' },
      { status: 404 }
    )
  }

  return NextResponse.json(status)
}
