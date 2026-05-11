import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { patchMenuItem, pushMenuItem, seedDemoData, subscribeTenants } from '../../firebase/db'
import type { MenuItem, Tenant } from '../../types'
import { DEFAULT_TENANT_ID } from '../../constants'

const CATS = ['Semua', 'Main', 'Minuman', 'Dessert', 'Lainnya'] as const

function inferBucket(category: string): (typeof CATS)[number] {
  const c = category.toLowerCase()
  if (c.includes('drink') || c.includes('coffee') || c.includes('minum') || c.includes('juice') || c.includes('tea'))
    return 'Minuman'
  if (c.includes('dessert') || c.includes('sweet') || c.includes('mochi') || c.includes('cake')) return 'Dessert'
  if (c.includes('side') || c.includes('bread') || c.includes('starter')) return 'Lainnya'
  return 'Main'
}

export default function TenantMenuPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId ?? DEFAULT_TENANT_ID
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua')
  const [q, setQ] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState('Main')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return subscribeTenants((list) => {
      setTenant(list.find((t) => t.id === tenantId) ?? null)
    })
  }, [tenantId])

  const menuEntries = useMemo(() => {
    const m = tenant?.menu
    if (!m) return [] as MenuItem[]
    return Object.values(m)
  }, [tenant])

  const filtered = useMemo(() => {
    let list = menuEntries
    if (cat !== 'Semua') {
      list = list.filter((i) => inferBucket(i.category) === cat)
    }
    const s = q.trim().toLowerCase()
    if (s) list = list.filter((i) => i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s))
    return list
  }, [menuEntries, cat, q])

  const toggleMenu = async (item: MenuItem, field: 'active' | 'inStock') => {
    await patchMenuItem(tenantId, item.id, { [field]: !item[field] })
  }

  const onSeed = async () => {
    setSeeding(true)
    try {
      await seedDemoData()
    } finally {
      setSeeding(false)
    }
  }

  const submitAdd = async () => {
    const price = Number(newPrice.replace(/\D/g, ''))
    if (!newName.trim() || !Number.isFinite(price) || price <= 0) return
    setBusy(true)
    try {
      await pushMenuItem(tenantId, {
        name: newName.trim(),
        price,
        category: newCategory.trim() || 'Main',
        active: true,
        inStock: true,
      })
      setNewName('')
      setNewPrice('')
      setAddOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Menu Editor</h1>
          <p className="text-sm text-zinc-500">Kelola katalog, ketersediaan, dan status aktif menu.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!tenant && (
            <button
              type="button"
              disabled={seeding}
              onClick={() => void onSeed()}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
            >
              {seeding ? '…' : 'Seed data'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[#0b0e11] glow-blue"
          >
            + Add New Dish
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search menu items, categories, or tags…"
          className="w-full rounded-full border border-white/10 bg-[#12161c] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/40 md:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                cat === c ? 'bg-[var(--accent)] text-[#0b0e11]' : 'border border-white/10 bg-[#0f141c] text-zinc-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12161c] shadow-[0_0_24px_rgba(0,0,0,0.3)]"
          >
            <div
              className="h-36 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg,transparent,rgba(11,14,17,0.9)), url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80)`,
              }}
            />
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.inStock ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--orange)]/20 text-[var(--orange)]'
                  }`}
                >
                  {item.inStock ? 'Available' : 'Out of stock'}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--accent)]">{item.name}</h3>
              <p className="text-xs uppercase tracking-wide text-zinc-500">{item.category}</p>
              <p className="mt-2 text-xl font-bold text-amber-200/90">Rp{item.price.toLocaleString('id-ID')}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-xs text-zinc-400">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => void toggleMenu(item, 'active')}
                  />
                  Active
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.inStock}
                    onChange={() => void toggleMenu(item, 'inStock')}
                  />
                  In stock
                </label>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[#0c1118]/80 p-6 text-center text-sm text-zinc-500 transition hover:border-[var(--accent)]/70 hover:text-zinc-300"
        >
          <span className="mb-2 text-3xl text-[var(--accent)]">+</span>
          Add New Dish
          <span className="mt-1 text-xs">Upload foto &amp; detail (nama &amp; harga di form)</span>
        </button>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
            <h2 className="font-display text-lg font-semibold text-white">Menu baru</h2>
            <label className="mt-4 block text-xs font-medium uppercase tracking-widest text-zinc-500">
              Nama
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]/40"
              />
            </label>
            <label className="mt-3 block text-xs font-medium uppercase tracking-widest text-zinc-500">
              Harga (Rp)
              <input
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]/40"
              />
            </label>
            <label className="mt-3 block text-xs font-medium uppercase tracking-widest text-zinc-500">
              Kategori
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]/40"
              />
            </label>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex-1 rounded-xl border border-white/15 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitAdd()}
                className="flex-1 rounded-xl bg-[var(--accent)] py-2 text-sm font-bold text-[#0b0e11] disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-light text-[#0b0e11] shadow-lg md:bottom-8"
        aria-label="Tambah menu"
      >
        +
      </button>
    </div>
  )
}
