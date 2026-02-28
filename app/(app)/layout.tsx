import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link href="/trips" className="text-lg font-bold text-slate-900">
          ✈️ Open Travel
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
