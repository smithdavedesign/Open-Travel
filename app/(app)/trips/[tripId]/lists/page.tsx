import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import ChecklistPanel from '@/components/lists/ChecklistPanel'
import PlacesPanel from '@/components/lists/PlacesPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ListsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let checklistItems, places
  try {
    ;[checklistItems, places] = await Promise.all([
      ListController.getChecklistItems(tripId),
      ListController.getPlaces(tripId),
    ])
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
        <h2 className="text-2xl font-bold text-foreground">Trip Lists &amp; Checklists</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Organize your trip with custom checklists and wishlist items</p>
      </div>

      <Tabs defaultValue="checklists" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="places">Places to Visit</TabsTrigger>
        </TabsList>

        <TabsContent value="checklists">
          <ChecklistPanel tripId={tripId} initialItems={checklistItems} />
        </TabsContent>

        <TabsContent value="places">
          <PlacesPanel tripId={tripId} initialPlaces={places} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
