import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MenuItem } from '../types'

export type CartLine = {
  key: string
  tenantId: string
  tenantName: string
  item: MenuItem
  qty: number
  tags?: string[]
}

type CartCtx = {
  lines: CartLine[]
  addItem: (item: MenuItem, ctx: { tenantId: string; tenantName: string }, qty?: number) => void
  removeLine: (key: string) => void
  clear: () => void
  total: number
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const addItem = useCallback((item: MenuItem, ctx: { tenantId: string; tenantName: string }, qty = 1) => {
    setLines((prev) => {
      const hasOtherTenant = prev.some((l) => l.tenantId !== ctx.tenantId)
      const base = hasOtherTenant ? [] : prev
      const existing = base.find((l) => l.item.id === item.id && l.tenantId === ctx.tenantId)
      if (existing) {
        return base.map((l) =>
          l.item.id === item.id && l.tenantId === ctx.tenantId ? { ...l, qty: l.qty + qty } : l,
        )
      }
      return [
        ...base,
        {
          key: `${ctx.tenantId}_${item.id}_${Date.now()}`,
          tenantId: ctx.tenantId,
          tenantName: ctx.tenantName,
          item,
          qty,
        },
      ]
    })
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const total = useMemo(() => lines.reduce((s, l) => s + l.item.price * l.qty, 0), [lines])

  const value = useMemo(
    () => ({ lines, addItem, removeLine, clear, total }),
    [lines, addItem, removeLine, clear, total],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCart outside CartProvider')
  return v
}
