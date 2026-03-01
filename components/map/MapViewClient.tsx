'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { Place } from '@/types'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center min-h-[500px]">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

export default function MapViewClient({ places, mapboxToken }: { places: Place[]; mapboxToken: string }) {
  return <MapView places={places} mapboxToken={mapboxToken} />
}
