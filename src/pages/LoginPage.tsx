import { useEffect, useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

function authErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/user-not-found': 'Akun tidak ditemukan. Gunakan Sign up atau periksa email.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet Anda.',
    'auth/user-disabled': 'Akun ini dinonaktifkan.',
  }
  return map[code] ?? 'Gagal masuk. Periksa email dan password.'
}

export default function LoginPage() {
  const { user, profile, loading, login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<UserRole>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user && profile) {
      nav(profile.role === 'tenant' ? '/tenant' : '/app/explore', { replace: true })
    }
  }, [loading, user, profile, nav])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await login(email.trim(), password, role)
      } else {
        if (!name.trim()) {
          setErr('Nama wajib diisi.')
          return
        }
        await register({ email: email.trim(), password, name: name.trim(), role })
      }
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        setErr(authErrorMessage(e.code))
      } else if (e instanceof Error) {
        setErr(e.message)
      } else {
        setErr('Autentikasi gagal')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dot-grid flex min-h-full flex-col items-center justify-center bg-[#0b0e11] px-4 py-12 text-zinc-100">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-[0.2em] text-[var(--accent)] drop-shadow-[0_0_18px_rgba(142,202,230,0.45)]">
          AIDEN GOURMET
        </h1>
        <p className="mt-2 text-xs tracking-[0.35em] text-zinc-500">PRECISION CULINARY INTELLIGENCE</p>
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161b22] p-6 shadow-2xl"
      >
        <div className="mb-6 flex rounded-2xl bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
              role === 'student' ? 'bg-[var(--accent)] text-[#0b0e11]' : 'text-zinc-400'
            }`}
          >
            Mahasiswa
          </button>
          <button
            type="button"
            onClick={() => setRole('tenant')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
              role === 'tenant' ? 'bg-[var(--accent)] text-[#0b0e11]' : 'text-zinc-400'
            }`}
          >
            Tenant
          </button>
        </div>

        {mode === 'signup' && (
          <label className="mb-4 block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Nama
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b0e11] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]/50"
              placeholder="Nama tampilan"
            />
          </label>
        )}

        <label className="mb-4 block text-xs font-medium uppercase tracking-widest text-zinc-500">
          Identifier
          <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0e11] px-3">
            <span className="text-zinc-500">@</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent py-3 text-sm outline-none"
              placeholder="Email terdaftar"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="mb-4 block text-xs font-medium uppercase tracking-widest text-zinc-500">
          Access key
          <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0e11] px-3">
            <span className="text-zinc-500">🔒</span>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent py-3 text-sm outline-none"
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showPw ? 'hide' : 'show'}
            </button>
          </div>
        </label>

        <div className="mb-6 flex items-center justify-between text-xs text-zinc-500">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember device
          </label>
          <span className="cursor-pointer hover:text-[var(--accent)]">Forgot?</span>
        </div>

        {err && <p className="mb-4 text-center text-sm text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-[var(--accent)] py-3 text-sm font-bold text-[#0b0e11] glow-blue disabled:opacity-50"
        >
          {busy ? '…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>

        <div className="mt-4 flex justify-end text-xs">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setErr(null)
            }}
            className="text-[var(--accent)] hover:underline"
          >
            Switch to {mode === 'signin' ? 'signup' : 'sign in'} →
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-[10px] tracking-widest text-zinc-600">
        © 2026 AIDEN SYSTEMS. ALL SYSTEMS OPERATIONAL.
      </p>
    </div>
  )
}
