export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-800">Open Travel</span>
        <a
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Sign in to collaborate →
        </a>
      </div>
      {children}
    </div>
  )
}
