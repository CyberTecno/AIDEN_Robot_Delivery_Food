import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  patchOrder,
  startRobotSimulation,
  subscribeTenantAllOrders,
} from '../../firebase/db'
import type { Order } from '../../types'
import { DEFAULT_BOT_ID, DEFAULT_TENANT_ID, ROUTE_DEST } from '../../constants'

export default function TenantOrdersPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'all' | 'preparing' | 'ready' | 'pending'>('all')

  useEffect(() => {
    return subscribeTenantAllOrders(tenantId, setOrders)
  }, [tenantId])

  const filtered = useMemo(() => {
    if (tab === 'preparing') return orders.filter((o) => o.kitchenStatus === 'preparing')
    if (tab === 'ready') return orders.filter((o) => o.kitchenStatus === 'ready')
    if (tab === 'pending') return orders.filter((o) => o.paymentStatus === 'pending')
    return orders
  }, [orders, tab])

  const setKitchen = async (orderId: string, ks: Order['kitchenStatus']) => {
    await patchOrder(orderId, { kitchenStatus: ks })
  }

  const startRobot = async (orderId: string) => {
    await patchOrder(orderId, {
      deliveryStatus: 'in_transit',
      robot: {
        progress: 0,
        botId: DEFAULT_BOT_ID,
        destination: ROUTE_DEST,
        origin: 'Kantin Eka',
      },
    })
    startRobotSimulation(orderId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Order Manager</h1>
        <p className="text-sm text-zinc-500">Kelola pesanan realtime — termasuk menunggu pembayaran.</p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-[#0f141c] p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ['all', `Semua (${orders.length})`],
              ['pending', `Pending bayar (${orders.filter((o) => o.paymentStatus === 'pending').length})`],
              ['preparing', `Preparing (${orders.filter((o) => o.kitchenStatus === 'preparing').length})`],
              ['ready', `Ready (${orders.filter((o) => o.kitchenStatus === 'ready').length})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                tab === k ? 'bg-[var(--accent)] text-[#0b0e11]' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-sm text-zinc-500">Tidak ada order di tab ini.</p>}
          {filtered.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#12161c] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-[var(--accent)]">#{o.id.slice(0, 6).toUpperCase()}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      o.paymentStatus === 'paid' ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--orange)]/20 text-[var(--orange)]'
                    }`}
                  >
                    {o.paymentStatus === 'paid' ? 'Paid' : 'Pending payment'}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">{o.items.map((i) => i.name).join(', ')}</p>
                <p className="text-sm text-zinc-500">{o.studentName}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Total Rp{o.total.toLocaleString('id-ID')} · Kitchen: {o.kitchenStatus}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 lg:items-end">
                {o.paymentStatus !== 'paid' ? (
                  <p className="text-xs text-zinc-500">Tunggu mahasiswa menyelesaikan pembayaran.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={o.kitchenStatus === 'preparing'}
                        onClick={() => void setKitchen(o.id, 'preparing')}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                          o.kitchenStatus === 'preparing'
                            ? 'bg-[var(--accent)] text-[#0b0e11] glow-blue'
                            : 'border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/10'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        type="button"
                        disabled={o.kitchenStatus === 'ready'}
                        onClick={() => void setKitchen(o.id, 'ready')}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                          o.kitchenStatus === 'ready'
                            ? 'bg-[var(--success)] text-[#0b0e11] glow-green'
                            : 'border border-[var(--success)]/40 text-[var(--success)] hover:bg-[var(--success)]/10'
                        }`}
                      >
                        Ready
                      </button>
                    </div>
                    {o.kitchenStatus === 'ready' && o.deliveryStatus === 'none' && (
                      <button
                        type="button"
                        onClick={() => void startRobot(o.id)}
                        className="rounded-xl border border-[var(--orange)]/50 bg-[var(--orange)]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--orange)] hover:bg-[var(--orange)]/20"
                      >
                        Load robot &amp; Start
                      </button>
                    )}
                    {o.deliveryStatus === 'in_transit' && (
                      <p className="text-xs text-[var(--orange)]">
                        Robot delivering… {Math.round(o.robot?.progress ?? 0)}%
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
