import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subscribeTenantSupportThreads } from '../../firebase/db'
import type { SupportThreadSummary } from '../../types'
import SupportChatPanel from '../../components/SupportChatPanel'
import { DEFAULT_TENANT_ID } from '../../constants'

export default function TenantSupportPage() {
  const { user, profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [threads, setThreads] = useState<SupportThreadSummary[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  useEffect(() => {
    return subscribeTenantSupportThreads(tenantId, setThreads)
  }, [tenantId])

  useEffect(() => {
    if (threads.length === 0) {
      setSelectedStudentId(null)
      return
    }
    if (!selectedStudentId || !threads.some((t) => t.studentId === selectedStudentId)) {
      setSelectedStudentId(threads[0]!.studentId)
    }
  }, [threads, selectedStudentId])

  const active = useMemo(
    () => threads.find((t) => t.studentId === selectedStudentId) ?? null,
    [threads, selectedStudentId],
  )

  const peerLabel = active?.studentName ?? (selectedStudentId ? `Pelanggan · ${selectedStudentId.slice(0, 8)}…` : '—')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Help &amp; Operations Center</h1>
          <p className="text-sm text-zinc-500">Chat langsung dengan mahasiswa yang menghubungi tenant Anda.</p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          ● All systems operational
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_260px]">
        <aside className="rounded-2xl border border-white/10 bg-[#0f141c] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Percakapan</p>
          <div className="max-h-[480px] space-y-1 overflow-y-auto">
            {threads.length === 0 && (
              <p className="p-2 text-xs text-zinc-500">Belum ada chat. Mahasiswa memulai dari menu Support.</p>
            )}
            {threads.map((t) => (
              <button
                key={t.studentId}
                type="button"
                onClick={() => setSelectedStudentId(t.studentId)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  selectedStudentId === t.studentId
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <span className="block font-medium">{t.studentName ?? `User ${t.studentId.slice(0, 6)}`}</span>
                <span className="line-clamp-1 text-xs text-zinc-500">{t.lastMessage ?? '—'}</span>
              </button>
            ))}
          </div>
        </aside>

        <div>
          {user && profile && selectedStudentId ? (
            <SupportChatPanel
              tenantId={tenantId}
              studentId={selectedStudentId}
              viewerRole="tenant"
              myUid={user.uid}
              myName={profile.name}
              peerLabel={peerLabel}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-zinc-500">
              Pilih percakapan di kiri.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f141c] p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Common issues</h3>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              <li className="rounded-lg bg-black/20 px-2 py-1.5">Robot connectivity</li>
              <li className="rounded-lg bg-black/20 px-2 py-1.5">Thermal printer</li>
              <li className="rounded-lg bg-black/20 px-2 py-1.5">Menu sync delay</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--orange)]/30 bg-black/30 p-4">
            <p className="text-xs font-bold text-[var(--orange)]">Urgent issue?</p>
            <p className="mt-1 text-[10px] text-zinc-500">Hotline ops (placeholder)</p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-white/20 py-2 text-xs font-bold text-white"
            >
              Call ops hotline
            </button>
          </div>
          <p className="text-[10px] text-zinc-600">ops@aiden-gourmet.tech · status.aiden.tech</p>
        </aside>
      </div>
    </div>
  )
}
