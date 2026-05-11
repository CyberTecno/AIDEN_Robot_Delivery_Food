import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subscribeTenants } from '../../firebase/db'
import type { Tenant } from '../../types'
import SupportChatPanel from '../../components/SupportChatPanel'

export default function SupportChatPage() {
  const { tenantId } = useParams()
  const { user, profile } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])

  useEffect(() => {
    return subscribeTenants(setTenants)
  }, [])

  const tenant = useMemo(() => tenants.find((t) => t.id === tenantId) ?? null, [tenants, tenantId])

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Support &amp; chat</h1>
          <p className="text-sm text-zinc-500">Pilih tenant untuk mengobrol dengan dapur / operator.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {tenants.map((t) => (
            <Link
              key={t.id}
              to={`/app/support/${t.id}`}
              className="rounded-2xl border border-white/10 bg-[#12161c] p-4 transition hover:border-[var(--accent)]/40"
            >
              <p className="font-semibold text-[var(--accent)]">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.area}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Buka chat →</p>
            </Link>
          ))}
        </div>
        {tenants.length === 0 && (
          <p className="text-sm text-zinc-500">Belum ada tenant. Muat data demo dari Explore.</p>
        )}
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12161c] p-8 text-center text-sm text-zinc-500">
        Tenant tidak ditemukan.{' '}
        <Link to="/app/support" className="text-[var(--accent)] underline">
          Kembali
        </Link>
      </div>
    )
  }

  if (!user || !profile) {
    return <p className="text-sm text-zinc-500">Memuat profil…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">Chat: {tenant.name}</h1>
          <p className="text-xs text-zinc-500">{tenant.hubName || tenant.area}</p>
        </div>
        <Link to="/app/support" className="text-xs text-[var(--accent)] hover:underline">
          ← Ganti tenant
        </Link>
      </div>
      <SupportChatPanel
        tenantId={tenant.id}
        studentId={user.uid}
        viewerRole="student"
        myUid={user.uid}
        myName={profile.name}
        peerLabel={`${tenant.name} (Tenant)`}
      />
    </div>
  )
}
