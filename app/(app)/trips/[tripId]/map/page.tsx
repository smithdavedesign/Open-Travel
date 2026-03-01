import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import MapView from '@/components/map/MapView'

export default async function MapPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-slate-200 bg-white">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Map not configured</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Add your <code className="font-mono bg-slate-100 px-1 rounded border border-slate-200">NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable to enable interactive maps.
        </p>
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Get a free Mapbox token →
        </a>
      </div>
    )
  }

  let places
  try {
    places = await ListController.getPlaces(tripId)
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-red-200 bg-red-50/40">
        <p className="text-lg font-semibold text-red-700 mb-2">Database tables not found</p>
        <p className="text-sm text-red-500 text-center max-w-sm">
          Run <code className="font-mono bg-white px-1 rounded border border-red-200">supabase/migrations/002_lists.sql</code> in your Supabase SQL editor to enable this feature.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">Map</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your places to visit pinned on an interactive map
        </p>
      </div>
      <MapView places={places} mapboxToken={mapboxToken} />
    </div>
  )
}
