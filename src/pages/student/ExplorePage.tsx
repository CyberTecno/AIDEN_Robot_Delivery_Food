import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { seedDemoData, subscribeTenants } from '../../firebase/db'
import { useCart } from '../../context/CartContext'
import type { MenuItem, Tenant } from '../../types'
import { DEFAULT_TENANT_ID } from '../../constants'

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

const TENANT_COVER: Record<string, string> = {
  [DEFAULT_TENANT_ID]:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'tenant-kyoto': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
  'tenant-neon': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  'tenant-vita': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'tenant-nexus': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'tenant-saffron': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'tenant-urban': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
}

function coverForTenant(id: string) {
  return TENANT_COVER[id] ?? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'
}

export default function ExplorePage() {
  const { tenantId: routeTenantId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [letter, setLetter] = useState('#')
  const [seeding, setSeeding] = useState(false)
  const menuSectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    return subscribeTenants(setTenants)
  }, [])

  useEffect(() => {
    if (!routeTenantId || tenants.length === 0) return
    const ok = tenants.some((t) => t.id === routeTenantId)
    if (!ok) navigate('/app/explore', { replace: true })
  }, [routeTenantId, tenants, navigate])

  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => a.name.localeCompare(b.name, 'id')),
    [tenants],
  )

  const activeTenant = useMemo(() => {
    if (tenants.length === 0) return null
    if (routeTenantId) return tenants.find((t) => t.id === routeTenantId) ?? null
    return tenants.find((t) => t.id === DEFAULT_TENANT_ID) ?? tenants[0]!
  }, [tenants, routeTenantId])

  const menuList: MenuItem[] = useMemo(() => {
    const m = activeTenant?.menu
    if (!m) return []
    return Object.values(m).filter((i) => i.active && i.inStock)
  }, [activeTenant])

  const filteredMenu = useMemo(() => {
    if (letter === '#') return menuList
    return menuList.filter((i) => i.name.toUpperCase().startsWith(letter))
  }, [menuList, letter])

  const heroItem = menuList[0]

  const cartCtx = activeTenant
    ? { tenantId: activeTenant.id, tenantName: activeTenant.name }
    : { tenantId: DEFAULT_TENANT_ID, tenantName: 'Tenant' }

  const onSeed = async () => {
    setSeeding(true)
    try {
      await seedDemoData()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:hidden">
        <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-[#12161c] px-3 py-2 text-sm text-zinc-400">
          <span className="text-[var(--accent)]">⌕</span>
          <input placeholder="Search gourmet…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {activeTenant && (
        <p className="text-center text-xs text-zinc-500 md:text-left">
          Menampilkan menu:{' '}
          <span className="font-semibold text-[var(--accent)]">{activeTenant.name}</span>
          {!routeTenantId && (
            <Link to={`/app/explore/${activeTenant.id}`} className="ml-2 text-[var(--accent)] underline">
              permalink
            </Link>
          )}
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {LETTERS.map((L) => (
          <button
            key={L}
            type="button"
            onClick={() => setLetter(L)}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              letter === L
                ? 'bg-[var(--accent)] text-[#0b0e11]'
                : 'border border-white/10 bg-[#12161c] text-zinc-400 hover:border-[var(--accent)]/40'
            }`}
          >
            {L}
          </button>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#12161c]/50 p-6 text-center text-sm text-zinc-400">
          <p>Belum ada data tenant di Firebase.</p>
          <button
            type="button"
            disabled={seeding}
            onClick={() => void onSeed()}
            className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[#0b0e11] disabled:opacity-50"
          >
            {seeding ? 'Menyimpan…' : 'Muat 7 tenant demo + menu (masing-masing 6 item)'}
          </button>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#12161c] lg:col-span-2">
          <div
            className="h-56 bg-cover bg-center md:h-72"
            style={{
              backgroundImage: activeTenant
                ? `linear-gradient(180deg,rgba(11,14,17,0.1),rgba(11,14,17,0.95)), url(${coverForTenant(activeTenant.id)})`
                : undefined,
              backgroundColor: '#1a222c',
            }}
          />
          <div className="space-y-3 p-6 md:absolute md:inset-0 md:flex md:flex-col md:justify-end md:bg-gradient-to-t md:from-[#0b0e11] md:via-[#0b0e11]/80 md:to-transparent">
            <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
              {activeTenant?.cuisine ?? 'Recommended'}
            </span>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {activeTenant?.name ?? 'Cerita Cinta Selection'}
            </h2>
            <p className="max-w-xl text-sm text-zinc-400">
              {activeTenant
                ? `${activeTenant.hubName || activeTenant.area} · ${activeTenant.deliveryEta}. Pilih menu di bawah atau scroll ke daftar.`
                : 'Kurasi chef untuk rasa bold, tekstur kontras, dan penyajian futuristik — siap dikirim robot AIDEN ke titik kampus Anda.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              {activeTenant && (
                <>
                  <span className="text-[var(--accent)]">★ {activeTenant.rating.toFixed(1)}</span>
                  <span>{activeTenant.area}</span>
                </>
              )}
            </div>
            <button
              type="button"
              disabled={!activeTenant || menuList.length === 0}
              onClick={() => menuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-2 w-fit rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[#0b0e11] glow-blue disabled:cursor-not-allowed disabled:opacity-40"
            >
              Explore Menu
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {heroItem && activeTenant && (
            <div className="relative flex-1 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-[#1a222c] to-[#0b0e11] p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--orange)]">Featured</div>
              <p className="mt-2 font-display text-xl font-semibold">{heroItem.name}</p>
              <p className="text-sm text-zinc-500">{heroItem.category}</p>
              <p className="mt-3 text-2xl font-bold text-[var(--accent)]">
                Rp{heroItem.price.toLocaleString('id-ID')}
              </p>
              <button
                type="button"
                onClick={() => addItem(heroItem, cartCtx)}
                className="mt-4 w-full rounded-xl border border-[var(--accent)]/40 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                + Tambah ke keranjang
              </button>
              <div className="mt-3 flex gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
                <span className="rounded-full border border-white/10 px-2 py-1">Robot delivery</span>
                <span className="rounded-full border border-[var(--orange)]/40 px-2 py-1 text-[var(--orange)]">
                  Promo kampus
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Discover Tenants</h3>
          <span className="text-xs text-zinc-500">{sortedTenants.length} tenant</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedTenants.map((t) => (
            <Link key={t.id} to={`/app/explore/${t.id}`} className="block">
              <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-[#12161c] shadow-[0_0_24px_rgba(0,0,0,0.35)] transition hover:border-[var(--accent)]/40">
                <div
                  className="relative h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverForTenant(t.id)})` }}
                >
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                    ★ {t.rating.toFixed(1)}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold group-hover:text-[var(--accent)]">{t.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t.cuisine}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                    <span className="rounded-md bg-white/5 px-2 py-1">{t.area}</span>
                    <span className="rounded-md bg-white/5 px-2 py-1">{t.deliveryEta}</span>
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Lihat menu →
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section ref={menuSectionRef} id="tenant-menu" className="scroll-mt-24">
        <h3 className="mb-4 font-display text-lg font-semibold">Menu tenant ini</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#12161c] p-4 shadow-[0_0_20px_rgba(142,202,230,0.08)]"
            >
              <div
                className="mb-3 h-28 rounded-xl bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg,transparent,rgba(11,14,17,0.85)), url(${coverForTenant(activeTenant?.id ?? DEFAULT_TENANT_ID)})`,
                }}
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{item.category}</p>
                </div>
                <span className="text-xs text-[var(--accent)]">★ 4.8</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Rp{item.price.toLocaleString('id-ID')}</span>
                <button
                  type="button"
                  onClick={() => activeTenant && addItem(item, { tenantId: activeTenant.id, tenantName: activeTenant.name })}
                  disabled={!activeTenant}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[#0b0e11] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex gap-2 text-[10px] text-zinc-500">
                <span className="rounded-full border border-white/10 px-2 py-0.5">Delivery</span>
                <span className="rounded-full border border-[var(--orange)]/30 px-2 py-0.5 text-[var(--orange)]">
                  Hot
                </span>
              </div>
            </div>
          ))}
        </div>
        {activeTenant && filteredMenu.length === 0 && (
          <p className="text-sm text-zinc-500">Tidak ada menu untuk huruf ini.</p>
        )}
      </section>

      <Link
        to="/app/orders"
        className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg text-[#0b0e11] shadow-lg md:bottom-8"
        aria-label="Orders"
      >
        ◎
      </Link>
    </div>
  )
}
