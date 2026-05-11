import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { profile, user, logout } = useAuth()

  return (
    <div className="mx-auto max-w-md space-y-6 py-4">
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <div className="rounded-3xl border border-white/10 bg-[#12161c] p-6">
        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-[var(--accent)]/50 to-transparent" />
        <p className="text-center text-lg font-semibold">{profile?.name}</p>
        <p className="text-center text-sm text-zinc-500">{profile?.email}</p>
        <p className="mt-2 text-center text-xs uppercase tracking-widest text-[var(--accent)]">
          {profile?.role === 'student' ? 'Mahasiswa' : 'Tenant'}
        </p>
        <p className="mt-4 break-all text-center font-mono text-[10px] text-zinc-600">{user?.uid}</p>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        className="w-full rounded-2xl border border-red-500/40 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
      >
        Log out
      </button>
    </div>
  )
}
