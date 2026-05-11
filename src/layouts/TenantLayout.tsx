import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeTenants } from '../firebase/db'
import type { Tenant } from '../types'
import { DEFAULT_TENANT_ID } from '../constants'

const nav: { to: string; end?: boolean; label: string; icon: string }[] = [
  { to: '/tenant', end: true, label: 'Dashboard', icon: '▣' },
  { to: '/tenant/orders', label: 'Orders', icon: '◫' },
  { to: '/tenant/menu', label: 'Menu', icon: '◇' },
  { to: '/tenant/analytics', label: 'Analytics', icon: '◈' },
  { to: '/tenant/support', label: 'Support', icon: '◎' },
]

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
    active
      ? 'bg-[var(--accent)]/15 text-[var(--accent)] shadow-[0_0_24px_rgba(142,202,230,0.12)]'
      : 'text-zinc-400 hover:bg-white/5'
  }`
}

export default function TenantLayout() {
  const { logout, profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    return subscribeTenants((list) => {
      setTenant(list.find((t) => t.id === tenantId) ?? null)
    })
  }, [tenantId])

  const hub = tenant?.hubName || tenant?.name || 'Kantin Eka Hub'

  return (
    <div className="flex min-h-full bg-[#070a0f] pb-20 text-zinc-100 md:pb-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0c1118] p-4 md:flex">
        <div className="mb-8">
          <p className="font-display text-lg font-bold text-[var(--accent)]">AIDEN Tenant</p>
          <p className="text-xs uppercase tracking-widest text-zinc-500">{hub}</p>
        </div>
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--accent)]/60 to-transparent" />
            <div>
              <p className="text-sm font-semibold">{tenant?.name ?? 'Kitchen'}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Manager</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={!!end} className={({ isActive }) => navClass(isActive)}>
              <span className="w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/tenant/menu"
          className="mt-4 block w-full rounded-2xl bg-[var(--orange)]/90 py-3 text-center text-sm font-bold text-[#0b0e11] shadow-[0_0_20px_rgba(255,120,60,0.25)]"
        >
          + Add New Dish
        </Link>
        <div className="mt-auto space-y-2 pt-6 text-xs text-zinc-500">
          <button type="button" className="block w-full text-left hover:text-zinc-300">
            Settings
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="block w-full text-left text-red-400 hover:underline"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070a0f]/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <p className="font-display text-sm font-semibold text-white md:hidden">AIDEN Tenant</p>
            <div className="mx-auto hidden max-w-xl flex-1 md:block">
              <input
                placeholder="Search orders, dishes, or customers..."
                className="w-full rounded-full border border-white/10 bg-[#12161c] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]/40"
              />
            </div>
            <button type="button" className="rounded-full border border-white/10 p-2 text-zinc-400">
              🔔
            </button>
            <div className="hidden text-right text-xs md:block">
              <p className="font-semibold text-white">{profile?.name ?? 'Manager'}</p>
              <p className="text-zinc-500">Tenant</p>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-[#070a0f]/95 px-1 py-2 backdrop-blur md:hidden">
        {nav.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[9px] font-semibold uppercase tracking-tight ${
                isActive ? 'text-[var(--accent)]' : 'text-zinc-500'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label.slice(0, 8)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
