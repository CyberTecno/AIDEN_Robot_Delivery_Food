import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { seedDemoData, subscribeTenantOrders, subscribeTenants } from '../../firebase/db'
import type { Order, Tenant } from '../../types'
import { DEFAULT_TENANT_ID } from '../../constants'

export default function TenantHomePage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [orders, setOrders] = useState<Order[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    return subscribeTenantOrders(tenantId, setOrders)
  }, [tenantId])

  useEffect(() => {
    return subscribeTenants((list) => {
      setTenant(list.find((t) => t.id === tenantId) ?? null)
    })
  }, [tenantId])

  const kpis = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total, 0)
    return {
      revenue,
      count: orders.length,
      prep: '12m 4s',
      rating: 4.8,
    }
  }, [orders])

  const onSeed = async () => {
    setSeeding(true)
    try {
      await seedDemoData()
    } finally {
      setSeeding(false)
    }
  }

  const hubLabel = tenant?.hubName || tenant?.name || 'Kantin Eka Hub'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-zinc-500">{hubLabel} — realtime Firebase</p>
        </div>
        {!tenant && (
          <button
            type="button"
            disabled={seeding}
            onClick={() => void onSeed()}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-[#0b0e11] disabled:opacity-50"
          >
            {seeding ? '…' : 'Seed demo'}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue (paid orders)" value={`Rp${kpis.revenue.toLocaleString('id-ID')}`} hint="+12.5%" positive />
        <KpiCard label="Total orders" value={String(kpis.count)} hint="Terbayar" />
        <KpiCard label="Avg prep time" value={kpis.prep} hint="2m faster" positive />
        <KpiCard label="Avg rating" value={`${kpis.rating} ★`} hint="Top quartile" />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Shortcuts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['/tenant/orders', 'Order Manager', 'Kelola pesanan & robot', '▣'],
              ['/tenant/menu', 'Menu Editor', 'Katalog & ketersediaan', '◇'],
              ['/tenant/analytics', 'Analytics', 'Performa & heatmap', '◈'],
              ['/tenant/support', 'Support', 'Chat mahasiswa', '◎'],
            ] as const
          ).map(([to, title, desc, icon]) => (
            <Link
              key={to}
              to={to}
              className="rounded-2xl border border-white/10 bg-[#12161c] p-5 shadow-[0_0_24px_rgba(0,0,0,0.25)] transition hover:border-[var(--accent)]/40"
            >
              <span className="text-2xl text-[var(--accent)]">{icon}</span>
              <p className="mt-2 font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs text-zinc-500">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#121822] to-[#0b0e11] p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Hourly peak</h3>
          <div className="mt-4 flex h-28 items-end gap-1">
            {[40, 55, 35, 60, 45, 70, 90, 75, 50, 30, 25, 20].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-[var(--accent)]/40" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
            *Prediksi: lonjakan pukul 18:00. Siapkan +15% bahan baku.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--orange)]/30 bg-black/30 p-5">
          <p className="text-xs font-bold text-[var(--orange)]">Lunch Rush 20%</p>
          <p className="mt-1 text-2xl font-mono text-white">14:32</p>
          <p className="text-[10px] text-zinc-500">Countdown promo tenant</p>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
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
    <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4 shadow-[0_0_24px_rgba(0,0,0,0.25)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className={`mt-1 text-xs ${positive ? 'text-[var(--success)]' : 'text-zinc-500'}`}>{hint}</p>
    </div>
  )
}
