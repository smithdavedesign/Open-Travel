'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Timeline', href: '' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Budget', href: '/budget' },
  { label: 'Documents', href: '/documents' },
  { label: 'Map', href: '/map' },
  { label: 'Settings', href: '/settings' },
]

export default function TripNav({ tripId }: { tripId: string }) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  return (
    <nav className="flex gap-1 border-b px-6">
      {tabs.map(tab => {
        const href = `${base}${tab.href}`
        const isActive = tab.href === ''
          ? pathname === base
          : pathname.startsWith(href)

        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
