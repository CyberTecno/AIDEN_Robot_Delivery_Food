import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subscribeStudentOrders } from '../../firebase/db'
import type { Order } from '../../types'

function statusLabel(o: Order) {
  if (o.paymentStatus === 'pending') return 'Menunggu pembayaran'
  if (o.kitchenStatus === 'preparing') return 'Dipersiapkan dapur'
  if (o.kitchenStatus === 'ready' && o.deliveryStatus === 'none') return 'Siap — menunggu robot'
  if (o.deliveryStatus === 'in_transit') return 'Robot mengantar'
  if (o.deliveryStatus === 'delivered') return 'Sampai tujuan'
  if (o.paymentStatus === 'paid' && o.kitchenStatus === 'none') return 'Diterima dapur'
  return 'Diproses'
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeStudentOrders(user.uid, setOrders)
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-zinc-500">Riwayat & status pengiriman robot.</p>
      </div>

      <div className="space-y-3">
        {orders.length === 0 && <p className="text-sm text-zinc-500">Belum ada pesanan.</p>}
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#12161c] p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-xs font-mono text-[var(--accent)]">#{o.id.slice(0, 8).toUpperCase()}</p>
              <p className="font-medium">{o.tenantName}</p>
              <p className="text-xs text-zinc-500">
                {o.items.map((i) => `${i.name}×${i.qty}`).join(', ')}
              </p>
              <p className="mt-2 text-sm text-zinc-400">{statusLabel(o)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {o.paymentStatus === 'paid' && (
                <Link
                  to={`/app/orders/${o.id}/tracking`}
                  className="rounded-xl border border-[var(--accent)]/40 px-4 py-2 text-center text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
                >
                  Robot tracking
                </Link>
              )}
              <span className="rounded-xl bg-white/5 px-4 py-2 text-xs text-zinc-400">
                Rp{o.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
