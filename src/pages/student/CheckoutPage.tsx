import { useCallback, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { createPendingOrder, patchOrder } from '../../firebase/db'
import { DEFAULT_BOT_ID, ROUTE_DEST } from '../../constants'
import type { Order } from '../../types'

export default function CheckoutPage() {
  const { user, profile } = useAuth()
  const { lines, total, clear } = useCart()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [success, setSuccess] = useState<{ orderId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const ensurePending = useCallback(async () => {
    setErr(null)
    if (!user || !profile) {
      setErr('Sesi tidak valid. Muat ulang halaman atau login lagi.')
      return
    }
    if (lines.length === 0) {
      setErr('Keranjang kosong.')
      return
    }
    if (pendingId) return
    setBusy(true)
    try {
      const first = lines[0]!
      const order: Omit<Order, 'id'> = {
        studentId: user.uid,
        studentName: profile.name,
        tenantId: first.tenantId,
        tenantName: first.tenantName,
        items: lines.map((l) => {
          const row: Order['items'][number] = {
            menuItemId: l.item.id,
            name: l.item.name,
            qty: l.qty,
            price: l.item.price,
          }
          if (l.tags && l.tags.length > 0) row.tags = l.tags
          return row
        }),
        total,
        createdAt: Date.now(),
        paymentStatus: 'pending',
        kitchenStatus: 'none',
        deliveryStatus: 'none',
      }
      const id = await createPendingOrder(order)
      setPendingId(id)
    } catch (e: unknown) {
      if (e instanceof FirebaseError) {
        setErr(e.message || 'Gagal menyimpan pesanan ke database.')
      } else {
        setErr(e instanceof Error ? e.message : 'Gagal membuat pesanan.')
      }
    } finally {
      setBusy(false)
    }
  }, [user, profile, lines, total, pendingId])

  if (lines.length === 0 && !success) {
    return <Navigate to="/app/explore" replace />
  }

  const pay = async () => {
    if (!pendingId) return
    setBusy(true)
    try {
      await patchOrder(pendingId, {
        paymentStatus: 'paid',
        robot: {
          progress: 0,
          botId: DEFAULT_BOT_ID,
          destination: ROUTE_DEST,
          origin: 'Kantin Eka',
        },
      })
      setPayOpen(false)
      setSuccess({ orderId: pendingId })
      clear()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <h1 className="font-display text-2xl font-semibold">Checkout</h1>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#12161c] p-4">
        {lines.map((l) => (
          <div key={l.key} className="flex justify-between text-sm">
            <span>
              {l.item.name} × {l.qty}
            </span>
            <span className="text-zinc-400">
              Rp{(l.item.price * l.qty).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-white/10 pt-3 font-semibold">
          <span>Total</span>
          <span className="text-[var(--accent)]">Rp{total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {!success && (
        <div className="space-y-3">
          {err && <p className="text-center text-sm text-red-400">{err}</p>}
          {!pendingId ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void ensurePending()}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              {busy ? 'Memproses…' : 'Buat pesanan (pending payment)'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[#0b0e11] glow-blue"
            >
              Bayar (simulasi)
            </button>
          )}
          <Link to="/app/explore" className="block text-center text-sm text-zinc-500 hover:text-zinc-300">
            Kembali ke Explore
          </Link>
        </div>
      )}

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
            <p className="text-center text-sm text-zinc-400">Simulasi pembayaran</p>
            <p className="mt-2 text-center text-lg font-semibold">Total Rp{total.toLocaleString('id-ID')}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="flex-1 rounded-xl border border-white/15 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void pay()}
                className="flex-1 rounded-xl bg-[var(--accent)] py-2 text-sm font-semibold text-[#0b0e11]"
              >
                Konfirmasi bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glow-green w-full max-w-md rounded-3xl border border-[var(--success)]/40 bg-[#161b22] p-8 text-center shadow-[0_0_40px_rgba(62,207,142,0.25)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)] text-3xl text-[#0b0e11]">
              ✓
            </div>
            <h2 className="text-xl font-bold">Pembayaran Sukses!</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Order ID</p>
            <p className="mt-1 rounded-lg bg-black/30 px-3 py-2 font-mono text-[var(--accent)]">
              #{success.orderId.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              Robot <span className="text-[var(--accent)]">{DEFAULT_BOT_ID}</span> akan mengantar ke{' '}
              <span className="font-semibold text-white">{ROUTE_DEST}</span>. Pantau status secara real-time.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to={`/app/orders/${success.orderId}/tracking`}
                className="block rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[#0b0e11]"
              >
                Lacak pesanan
              </Link>
              <Link
                to="/app/orders"
                className="block rounded-xl border border-white/20 py-3 text-sm font-medium text-zinc-200"
              >
                Selesai
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
