import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { subscribeOrder } from '../../firebase/db'
import type { Order } from '../../types'
import { IconRobot } from '../../components/Icons'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function TrackingPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }
    return subscribeOrder(orderId, setOrder)
  }, [orderId])

  const journey = useMemo(() => {
    if (!order) return []
    const paidAt = order.createdAt
    const steps: { title: string; detail: string; at: number; state: 'done' | 'active' | 'pending' }[] = [
      {
        title: 'Order paid',
        detail: 'Payment confirmed (simulasi)',
        at: paidAt,
        state: order.paymentStatus === 'paid' ? 'done' : 'pending',
      },
      {
        title: 'Preparing',
        detail: 'Chef tenant sedang menyiapkan',
        at: paidAt + 120_000,
        state:
          order.kitchenStatus === 'preparing'
            ? 'active'
            : order.kitchenStatus === 'ready' || order.deliveryStatus !== 'none'
              ? 'done'
              : 'pending',
      },
      {
        title: 'Ready for pickup',
        detail: 'Disanitasi dan dimasukkan ke robot',
        at: paidAt + 300_000,
        state:
          order.kitchenStatus === 'ready' && order.deliveryStatus === 'none'
            ? 'active'
            : order.deliveryStatus !== 'none'
              ? 'done'
              : 'pending',
      },
      {
        title: 'Delivering',
        detail: `${order.robot?.botId ?? 'AIDEN'} menuju STEM`,
        at: paidAt + 360_000,
        state:
          order.deliveryStatus === 'in_transit'
            ? 'active'
            : order.deliveryStatus === 'delivered'
              ? 'done'
              : 'pending',
      },
      {
        title: 'Arrived',
        detail: 'Paket tiba di titik kampus',
        at: paidAt + 420_000,
        state: order.deliveryStatus === 'delivered' ? 'done' : 'pending',
      },
    ]
    return steps
  }, [order])

  if (!orderId) {
    return <p className="text-sm text-red-400">Order ID hilang.</p>
  }
  if (order === undefined) {
    return <p className="text-sm text-zinc-500">Memuat…</p>
  }
  if (order === null) {
    return (
      <p className="text-sm text-zinc-500">
        Order tidak ditemukan.{' '}
        <Link to="/app/orders" className="text-[var(--accent)] hover:underline">
          Kembali
        </Link>
      </p>
    )
  }

  const progress = Math.round(order.robot?.progress ?? 0)
  const bot = order.robot?.botId ?? 'AIDEN-72'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <IconRobot className="h-8 w-8" />
            <h1 className="font-display text-2xl font-bold text-white md:text-3xl">Robot Delivery Tracking</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Pesanan Anda ditangani oleh <span className="text-zinc-300">{bot}</span>
          </p>
        </div>
        <Link to="/app/orders" className="text-xs text-[var(--accent)] hover:underline">
          ← Orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-[#151b24] to-[#0b0e11] p-6">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(142,202,230,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(142,202,230,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative flex min-h-[200px] flex-col justify-center">
              <div className="relative mx-auto w-full max-w-xl pt-8">
                <div className="h-1 rounded-full bg-white/10" />
                <div
                  className="absolute left-0 top-8 h-1 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--orange)]"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-5 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-lg border border-[var(--orange)] bg-[#0b0e11] text-[var(--orange)] shadow-[0_0_20px_rgba(255,159,67,0.45)]"
                  style={{ left: `${progress}%` }}
                >
                  <IconRobot className="h-5 w-5" />
                </div>
                <div className="mt-10 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  <span>Kantin Eka (origin)</span>
                  <span>STEM Hub (destination)</span>
                </div>
                <p className="mt-6 text-center text-4xl font-bold text-[var(--orange)]">{progress}%</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--orange)]" />
                {order.deliveryStatus === 'delivered'
                  ? 'Sampai'
                  : order.deliveryStatus === 'in_transit'
                    ? 'Delivering'
                    : order.kitchenStatus === 'ready'
                      ? 'Ready'
                      : order.kitchenStatus === 'preparing'
                        ? 'Preparing'
                        : 'Paid'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Order ID</p>
              <p className="mt-2 font-mono text-sm text-[var(--accent)]">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">ETA</p>
              <p className="mt-2 text-sm font-semibold text-zinc-200">
                ~{order.deliveryStatus === 'delivered' ? '0' : Math.max(1, 5 - Math.floor(progress / 25))} min
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#12161c]/80 p-4 backdrop-blur">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Journey log</h3>
            <ul className="mt-4 space-y-4 border-l border-white/10 pl-4">
              {journey.map((s, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                      s.state === 'done'
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : s.state === 'active'
                          ? 'border-[var(--orange)] bg-[var(--orange)]'
                          : 'border-zinc-600 bg-transparent'
                    }`}
                  />
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-zinc-500">{formatTime(s.at)}</p>
                  <p className="text-xs text-zinc-400">{s.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12161c] p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ringkasan</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((it) => (
                <li key={it.menuItemId + it.name} className="flex justify-between gap-2">
                  <span>
                    {it.name} ×{it.qty}
                  </span>
                  <span className="text-zinc-500">Rp{(it.price * it.qty).toLocaleString('id-ID')}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm font-semibold">
              <span>Total paid</span>
              <span className="text-lg text-[var(--accent)]">Rp{order.total.toLocaleString('id-ID')}</span>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-white/15 py-2 text-xs font-semibold text-zinc-300"
            >
              Contact concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
