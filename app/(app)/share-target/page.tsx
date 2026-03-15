'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isMapsUrl } from '@/lib/maps/parseGoogleMapsUrl'

/**
 * PWA Web Share Target landing page.
 *
 * When a user taps "Share" in Google Maps and selects Open Fly, the OS opens:
 *   /share-target?url=<maps-url>&title=<place-name>
 *
 * We find their most recent active trip and redirect to its Lists page
 * with the maps URL encoded in the query string so PlacesPanel can
 * auto-open the import dialog.
 */
export default function ShareTargetPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    async function handle() {
      const url   = params.get('url')   ?? ''
      const text  = params.get('text')  ?? ''
      const title = params.get('title') ?? ''

      // Extract the maps link — it may be in url or embedded in text
      const mapsLink = [url, text].find(s => isMapsUrl(s)) ?? ''

      // Find the user's most recent trip to default to
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: membership } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single()

      const tripId = membership?.trip_id
      if (!tripId) { router.replace('/trips'); return }

      const query = new URLSearchParams()
      if (mapsLink) query.set('import_url', mapsLink)
      else if (title) query.set('import_url', text || url)

      router.replace(`/trips/${tripId}/lists?${query.toString()}`)
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted-foreground">Opening your trip…</p>
    </div>
  )
}
