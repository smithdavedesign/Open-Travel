import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg p-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Open Travel</h1>
          <p className="text-sm text-slate-500 mt-1">Your group trip, all in one place</p>
        </div>
        <LoginForm />
        <p className="text-xs text-slate-400 text-center">
          By continuing, you agree to Open Travel&apos;s terms of service.
        </p>
      </div>
    </main>
  )
}
