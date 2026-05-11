import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { IconBell, IconCart, IconSearch } from '../components/Icons'

export default function StudentLayout() {
  const { lines, total, removeLine } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <div className="flex min-h-full flex-col bg-[#0b0e11] pb-24 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b0e11]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            to="/app/explore"
            className="font-display shrink-0 text-lg font-semibold tracking-wide text-[var(--accent)]"
          >
            AIDEN Gourmet
          </Link>
          <div className="mx-auto hidden max-w-xl flex-1 md:block">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#12161c] px-4 py-2 text-sm text-zinc-400">
              <IconSearch className="text-[var(--accent)]" />
              <input
                readOnly
                placeholder="Search for gourmet food..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full border border-white/10 p-2 text-zinc-300 transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
            >
              <IconCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-[var(--accent)] px-1 text-center text-[10px] font-bold text-[#0b0e11]">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 p-2 text-zinc-300 hover:text-[var(--accent)]"
              aria-label="Notifications"
            >
              <IconBell className="h-5 w-5" />
            </button>
            <Link
              to="/app/profile"
              className="h-9 w-9 rounded-full border border-white/15 bg-gradient-to-br from-[var(--accent)]/40 to-transparent"
            />
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-6 px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 md:flex">
          <NavLink
            to="/app/explore"
            className={({ isActive }) =>
              isActive ? 'text-[var(--accent)] underline decoration-[var(--accent)] underline-offset-8' : ''
            }
          >
            Explore
          </NavLink>
          <NavLink
            to="/app/orders"
            className={({ isActive }) =>
              isActive ? 'text-[var(--accent)] underline decoration-[var(--accent)] underline-offset-8' : ''
            }
          >
            Orders
          </NavLink>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              isActive ? 'text-[var(--accent)] underline decoration-[var(--accent)] underline-offset-8' : ''
            }
          >
            Profile
          </NavLink>
          <NavLink
            to="/app/support"
            className={({ isActive }) =>
              isActive ? 'text-[var(--accent)] underline decoration-[var(--accent)] underline-offset-8' : ''
            }
          >
            Support
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0e11]/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <NavLink
            to="/app/explore"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : ''}`
            }
          >
            <span className="text-lg">◇</span>
            Explore
          </NavLink>
          <NavLink
            to="/app/orders"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : ''}`
            }
          >
            <span className="text-lg">◎</span>
            Orders
          </NavLink>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : ''}`
            }
          >
            <span className="text-lg">○</span>
            Profile
          </NavLink>
          <NavLink
            to="/app/support"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : ''}`
            }
          >
            <span className="text-lg">✉</span>
            Support
          </NavLink>
        </div>
      </nav>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#12161c] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Keranjang</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/5"
              >
                Tutup
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {lines.length === 0 ? (
                <p className="text-sm text-zinc-500">Belum ada item.</p>
              ) : (
                lines.map((l) => (
                  <div
                    key={l.key}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e11] p-3"
                  >
                    <div>
                      <p className="font-medium">{l.item.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-600">{l.tenantName}</p>
                      <p className="text-xs text-zinc-500">
                        {l.qty} × Rp{l.item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-zinc-400">Total</span>
                <span className="font-semibold text-[var(--accent)]">
                  Rp{total.toLocaleString('id-ID')}
                </span>
              </div>
              {lines.length === 0 ? (
                <span className="block w-full rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-zinc-500">
                  Checkout
                </span>
              ) : (
                <Link
                  to="/app/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block w-full rounded-xl bg-[var(--accent)] py-3 text-center text-sm font-semibold text-[#0b0e11] glow-blue"
                >
                  Checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
