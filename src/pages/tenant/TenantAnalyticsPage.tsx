import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subscribeTenantOrders } from '../../firebase/db'
import type { Order } from '../../types'
import { DEFAULT_TENANT_ID } from '../../constants'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

export default function TenantAnalyticsPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [orders, setOrders] = useState<Order[]>([])
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h') // visual filter (demo); data = all paid orders

  useEffect(() => {
    return subscribeTenantOrders(tenantId, setOrders)
  }, [tenantId])

  const revenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders])

  const popular = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>()
    for (const o of orders) {
      for (const line of o.items) {
        const prev = map.get(line.menuItemId) ?? { name: line.name, qty: 0 }
        prev.qty += line.qty
        map.set(line.menuItemId, prev)
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [orders])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Performance Analytics</h1>
          <p className="text-sm text-zinc-500">Telemetri realtime &amp; ringkasan bisnis (data order terbayar).</p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-[#0c1118] p-1 text-[10px] font-bold uppercase">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 ${range === r ? 'bg-[var(--accent)] text-[#0b0e11]' : 'text-zinc-500'}`}
            >
              {r === '24h' ? 'Last 24h' : r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue trend"
          value={`Rp${revenue.toLocaleString('id-ID')}`}
          hint="+14.2% vs baseline (demo)"
          positive
        />
        <MetricCard label="Orders fulfilled" value={String(orders.length)} hint="98.5% success (simulasi)" positive />
        <MetricCard label="Avg. satisfaction" value="4.9 / 5.0" hint="312 reviews (placeholder)" />
        <MetricCard label="Robot fleet" value="12 / 14" hint="Active deployment (placeholder)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#0f141c] p-5">
          <h2 className="font-display text-lg font-semibold text-white">Peak demand heatmap</h2>
          <p className="mt-1 text-xs text-zinc-500">Ilustrasi pola kunjungan — Jumat sore puncak (mock).</p>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-zinc-600">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 4 * 7 }, (_, i) => {
              const col = i % 7
              const row = Math.floor(i / 7)
              const d = DAYS[col]!
              const hot = d === 'FRI' && row >= 2
              const mid = (d === 'THU' || d === 'SAT') && row >= 1
              return (
                <div
                  key={`${d}-${row}`}
                  className={`aspect-square rounded-md ${
                    hot ? 'bg-[var(--orange)]/90' : mid ? 'bg-[var(--accent)]/50' : 'bg-white/5'
                  }`}
                  style={{ opacity: 0.35 + col * 0.08 + row * 0.12 }}
                />
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f141c] p-5">
          <h2 className="font-display text-lg font-semibold text-white">Popular items</h2>
          <p className="mt-1 text-xs text-zinc-500">Dari order terbayar di Firebase.</p>
          <ul className="mt-4 space-y-3">
            {popular.length === 0 && <li className="text-sm text-zinc-500">Belum ada data penjualan.</li>}
            {popular.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#12161c] px-3 py-2">
                <span className="text-sm font-medium text-white">
                  {i + 1}. {p.name}
                </span>
                <span className="text-xs text-[var(--accent)]">{p.qty} terjual</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#0f141c] p-5">
          <h2 className="font-display text-lg font-semibold text-white">Robot efficiency</h2>
          <p className="mt-2 text-2xl font-mono text-[var(--accent)]">Avg. delivery: 6m 42s</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li>Robot #042 — Active · Hall C → Lab 4 · ETA 1m 20s</li>
            <li className="text-[var(--orange)]">Robot #108 — Charging · North dock · Ready in 22m</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#0f141c] p-5">
          <h2 className="font-display text-lg font-semibold text-white">Sentiment feed</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="rounded-xl border border-white/5 bg-[#12161c] p-3">
              <span className="text-amber-400">★★★★★</span> Dr. Aris S. — &quot;Neon bowl &amp; robot cepat.&quot;
            </li>
            <li className="rounded-xl border border-white/5 bg-[#12161c] p-3">
              <span className="text-amber-400">★★★★★</span> Mahasiswa 2045 — &quot;Burger bold, packaging rapi.&quot;
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  positive,
}: {
  label: string
  value: string
  hint: string
  positive?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-xl font-bold text-white">{value}</p>
      <p className={`mt-1 text-xs ${positive ? 'text-[var(--success)]' : 'text-zinc-500'}`}>{hint}</p>
    </div>
  )
}
