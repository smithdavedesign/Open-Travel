'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Timeline', href: '' },
  { label: 'Budget', href: '/budget' },
  { label: 'Documents', href: '/documents' },
  { label: 'Settings', href: '/settings' },
]

export default function TripNav({ tripId }: { tripId: string }) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`

  return (
    <nav className="flex gap-1 border-b border-slate-200 px-6">
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
