import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import PlacesPanel from '@/components/lists/PlacesPanel'

export default async function PlacesPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let places
  try {
    places = await ListController.getPlacesWithVotes(tripId, user.id)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-red-200 bg-red-50/40">
        <p className="text-lg font-semibold text-red-700 mb-2">Database tables not found</p>
        <p className="text-sm text-red-500 text-center max-w-sm mb-4">
          Run <code className="font-mono bg-white px-1 rounded border border-red-200">supabase/migrations/002_lists.sql</code> in your Supabase SQL editor to enable this feature.
        </p>
        <p className="text-xs text-red-400 font-mono">{msg}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Places to Visit</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Save and vote on restaurants, attractions, and activities for your trip</p>
      </div>
      <PlacesPanel tripId={tripId} initialPlaces={places} />
    </div>
  )
}
