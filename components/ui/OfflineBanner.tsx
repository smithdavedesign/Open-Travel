'use client'

import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export default function OfflineBanner() {
  // The server has no navigator: it always renders "online", and the client takes over after hydration.
  const offline = useSyncExternalStore(subscribe, () => !navigator.onLine, () => false)

  if (!offline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
      <WifiOff className="h-4 w-4 shrink-0" />
      You&apos;re offline — changes will sync when reconnected
    </div>
  )
}
