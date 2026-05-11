import {
  ref,
  set,
  push,
  update,
  onValue,
  get,
  type Unsubscribe,
} from 'firebase/database'
import { db } from './client'
import type { MenuItem, Order, SupportChatMessage, SupportThreadSummary, Tenant, UserProfile } from '../types'
import { DEFAULT_BOT_ID, DEFAULT_TENANT_ID, ROUTE_DEST, ROUTE_ORIGIN } from '../constants'

export function userProfileRef(uid: string) {
  return ref(db, `users/${uid}`)
}

export async function readUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(userProfileRef(uid))
  if (!snap.exists()) return null
  return snap.val() as UserProfile
}

export function subscribeUserProfile(uid: string, cb: (p: UserProfile | null) => void): Unsubscribe {
  const r = userProfileRef(uid)
  return onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as UserProfile) : null)
  })
}

export async function writeUserProfile(uid: string, profile: UserProfile) {
  const data: Record<string, string> = {
    role: profile.role,
    name: profile.name,
    email: profile.email,
  }
  if (profile.tenantId != null && profile.tenantId !== '') {
    data.tenantId = profile.tenantId
  }
  await set(userProfileRef(uid), data)
}

export function tenantsRef() {
  return ref(db, 'tenants')
}

export function subscribeTenants(cb: (tenants: Tenant[]) => void): Unsubscribe {
  return onValue(tenantsRef(), (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<string, Omit<Tenant, 'id'> & { menu?: Record<string, MenuItem> }>
    const list: Tenant[] = Object.entries(val).map(([id, t]) => ({ id, ...t }))
    cb(list)
  })
}

export function ordersRef() {
  return ref(db, 'orders')
}

export function orderRef(orderId: string) {
  return ref(db, `orders/${orderId}`)
}

export function subscribeOrder(orderId: string, cb: (o: Order | null) => void): Unsubscribe {
  return onValue(orderRef(orderId), (snap) => {
    if (!snap.exists()) {
      cb(null)
      return
    }
    cb({ ...(snap.val() as Omit<Order, 'id'>), id: orderId })
  })
}

export function subscribeStudentOrders(studentId: string, cb: (orders: Order[]) => void): Unsubscribe {
  return onValue(ordersRef(), (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<string, Omit<Order, 'id'>>
    const orders: Order[] = Object.entries(val)
      .map(([id, o]) => ({ ...o, id }))
      .filter((o) => o.studentId === studentId)
      .sort((a, b) => b.createdAt - a.createdAt)
    cb(orders)
  })
}

export function subscribeTenantOrders(tenantId: string, cb: (orders: Order[]) => void): Unsubscribe {
  return onValue(ordersRef(), (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<string, Omit<Order, 'id'>>
    const orders: Order[] = Object.entries(val)
      .map(([id, o]) => ({ ...o, id }))
      .filter((o) => o.tenantId === tenantId && o.paymentStatus === 'paid')
      .sort((a, b) => b.createdAt - a.createdAt)
    cb(orders)
  })
}

/** Semua order untuk tenant (termasuk pending payment) — untuk Order Manager. */
export function subscribeTenantAllOrders(tenantId: string, cb: (orders: Order[]) => void): Unsubscribe {
  return onValue(ordersRef(), (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<string, Omit<Order, 'id'>>
    const orders: Order[] = Object.entries(val)
      .map(([id, o]) => ({ ...o, id }))
      .filter((o) => o.tenantId === tenantId)
      .sort((a, b) => b.createdAt - a.createdAt)
    cb(orders)
  })
}

export function subscribeSupportMessages(
  tenantId: string,
  studentId: string,
  cb: (messages: SupportChatMessage[]) => void,
): Unsubscribe {
  const r = ref(db, `supportChats/${tenantId}/${studentId}/messages`)
  return onValue(r, (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<string, Omit<SupportChatMessage, 'id'>>
    const list: SupportChatMessage[] = Object.entries(val)
      .map(([id, m]) => ({ ...m, id }))
      .sort((a, b) => a.createdAt - b.createdAt)
    cb(list)
  })
}

export function subscribeTenantSupportThreads(
  tenantId: string,
  cb: (threads: SupportThreadSummary[]) => void,
): Unsubscribe {
  return onValue(ref(db, `supportChats/${tenantId}`), (snap) => {
    if (!snap.exists()) {
      cb([])
      return
    }
    const val = snap.val() as Record<
      string,
      {
        messages?: Record<string, { text?: string; createdAt?: number }>
        profile?: { studentName?: string; tenantName?: string }
      }
    >
    const threads: SupportThreadSummary[] = Object.entries(val)
      .filter(([, node]) => node.messages && Object.keys(node.messages).length > 0)
      .map(([studentId, node]) => {
        const messages = node.messages ? Object.values(node.messages) : []
        const sorted = messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        const last = sorted[sorted.length - 1]
        return {
          studentId,
          studentName: node.profile?.studentName,
          tenantName: node.profile?.tenantName,
          lastMessage: last?.text,
          lastAt: last?.createdAt,
        }
      })
    cb(threads.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0)))
  })
}

export async function sendSupportMessage(
  tenantId: string,
  studentId: string,
  payload: { senderRole: 'student' | 'tenant'; senderUid: string; senderName: string; text: string },
) {
  const base = `supportChats/${tenantId}/${studentId}`
  const msgRef = push(ref(db, `${base}/messages`))
  await set(msgRef, {
    senderRole: payload.senderRole,
    senderUid: payload.senderUid,
    senderName: payload.senderName,
    text: payload.text.trim(),
    createdAt: Date.now(),
  })
  const prof: Record<string, string> = {}
  if (payload.senderRole === 'student') prof.studentName = payload.senderName
  else prof.tenantName = payload.senderName
  await update(ref(db, `${base}/profile`), prof)
}

export async function pushMenuItem(tenantId: string, item: Omit<MenuItem, 'id'>) {
  const r = push(ref(db, `tenants/${tenantId}/menu`))
  const id = r.key!
  await set(r, { ...item, id })
}

/** RTDB rejects `undefined` anywhere in the payload. */
function serializeNewOrder(order: Omit<Order, 'id'>, id: string): Record<string, unknown> {
  const items = order.items.map((i) => {
    const row: Record<string, unknown> = {
      menuItemId: i.menuItemId,
      name: i.name,
      qty: i.qty,
      price: i.price,
    }
    if (Array.isArray(i.tags) && i.tags.length > 0) row.tags = i.tags
    return row
  })
  const payload: Record<string, unknown> = {
    id,
    studentId: order.studentId,
    studentName: order.studentName,
    tenantId: order.tenantId,
    tenantName: order.tenantName,
    items,
    total: order.total,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    kitchenStatus: order.kitchenStatus,
    deliveryStatus: order.deliveryStatus,
  }
  if (order.robot) payload.robot = order.robot
  return payload
}

export async function createPendingOrder(order: Omit<Order, 'id'>): Promise<string> {
  const r = push(ordersRef())
  const id = r.key!
  await set(r, serializeNewOrder(order, id))
  return id
}

export async function patchMenuItem(
  tenantId: string,
  itemId: string,
  patch: Partial<MenuItem>,
) {
  await update(ref(db, `tenants/${tenantId}/menu/${itemId}`), patch)
}

export async function patchOrder(orderId: string, patch: Partial<Omit<Order, 'id'>>) {
  await update(orderRef(orderId), patch)
}

function menuFrom(specs: readonly { name: string; price: number; category: string }[]): Record<string, MenuItem> {
  const out: Record<string, MenuItem> = {}
  specs.forEach((s, i) => {
    const id = `m${i + 1}`
    out[id] = { id, name: s.name, price: s.price, category: s.category, active: true, inStock: true }
  })
  return out
}

const SEED_TENANTS: Record<string, Omit<Tenant, 'id'> & { menu: Record<string, MenuItem> }> = {
  [DEFAULT_TENANT_ID]: {
    name: 'AIDEN Tenant Kitchen',
    hubName: 'Kantin Eka Hub',
    cuisine: 'INDONESIAN FUSION',
    rating: 4.9,
    area: 'Kampus — Kantin Eka',
    deliveryEta: '15–20 min',
    menu: menuFrom([
      { name: 'Cyber Burger Deluxe', price: 45000, category: 'Burger' },
      { name: 'Soto Betawi', price: 32000, category: 'Indonesian' },
      { name: 'Chicken Katsu Curry', price: 38000, category: 'Japanese' },
      { name: 'Nasi Goreng Aceh', price: 34000, category: 'Indonesian' },
      { name: 'Gado-gado Bowl', price: 28000, category: 'Indonesian' },
      { name: 'Es Cendol Premium', price: 18000, category: 'Drinks' },
    ]),
  },
  'tenant-kyoto': {
    name: 'Kyoto Protocol',
    hubName: 'Tech-District Hub',
    cuisine: 'JAPANESE FUSION',
    rating: 4.8,
    area: 'Tech-District',
    deliveryEta: '15–20 min',
    menu: menuFrom([
      { name: 'Salmon Aburi Bowl', price: 52000, category: 'Japanese' },
      { name: 'Tori Karaage Set', price: 36000, category: 'Japanese' },
      { name: 'Veggie Ramen', price: 34000, category: 'Noodles' },
      { name: 'Gyoza Platter', price: 29000, category: 'Sides' },
      { name: 'Matcha Latte', price: 22000, category: 'Drinks' },
      { name: 'Mochi Duo', price: 20000, category: 'Dessert' },
    ]),
  },
  'tenant-neon': {
    name: 'Neon Dough',
    hubName: 'Plaza Alpha',
    cuisine: 'PIZZA CRAFT',
    rating: 4.7,
    area: 'Plaza Alpha',
    deliveryEta: '12–18 min',
    menu: menuFrom([
      { name: 'Truffle Margherita', price: 89000, category: 'Pizza' },
      { name: 'Neon Pepperoni', price: 72000, category: 'Pizza' },
      { name: 'Garlic Focaccia', price: 28000, category: 'Sides' },
      { name: 'Caprese Skewers', price: 31000, category: 'Starters' },
      { name: 'Sparkling Yuzu', price: 19000, category: 'Drinks' },
      { name: 'Tiramisu Slice', price: 26000, category: 'Dessert' },
    ]),
  },
  'tenant-vita': {
    name: 'Vitality Lab',
    hubName: 'South Sector',
    cuisine: 'HEALTH BOWL',
    rating: 4.9,
    area: 'South Sector',
    deliveryEta: '10–15 min',
    menu: menuFrom([
      { name: 'Omega Poke Bowl', price: 48000, category: 'Bowl' },
      { name: 'Quinoa Power', price: 42000, category: 'Bowl' },
      { name: 'Green Detox Soup', price: 26000, category: 'Soup' },
      { name: 'Avocado Toast Pro', price: 33000, category: 'Light' },
      { name: 'Cold-press Juice', price: 24000, category: 'Drinks' },
      { name: 'Chia Parfait', price: 27000, category: 'Dessert' },
    ]),
  },
  'tenant-nexus': {
    name: 'Nexus Noodles',
    hubName: 'Food Court B',
    cuisine: 'ASIAN NOODLES',
    rating: 4.6,
    area: 'Kampus — Blok B',
    deliveryEta: '12–16 min',
    menu: menuFrom([
      { name: 'Pho Special', price: 39000, category: 'Vietnamese' },
      { name: 'Mie Ayam Nexus', price: 28000, category: 'Indonesian' },
      { name: 'Tom Yum Glass Noodles', price: 35000, category: 'Thai' },
      { name: 'Beef Ramen Rich', price: 41000, category: 'Japanese' },
      { name: 'Summer Rolls', price: 24000, category: 'Sides' },
      { name: 'Thai Tea Freeze', price: 18000, category: 'Drinks' },
    ]),
  },
  'tenant-saffron': {
    name: 'Saffron Express',
    hubName: 'Spice Lane',
    cuisine: 'NORTH INDIAN',
    rating: 4.8,
    area: 'Spice Lane',
    deliveryEta: '14–18 min',
    menu: menuFrom([
      { name: 'Butter Chicken', price: 44000, category: 'Curry' },
      { name: 'Paneer Tikka', price: 36000, category: 'Grill' },
      { name: 'Lamb Biryani', price: 52000, category: 'Rice' },
      { name: 'Garlic Naan Set', price: 16000, category: 'Bread' },
      { name: 'Mango Lassi', price: 20000, category: 'Drinks' },
      { name: 'Gulab Jamun', price: 18000, category: 'Dessert' },
    ]),
  },
  'tenant-urban': {
    name: 'Urban Roast',
    hubName: 'Library Wing',
    cuisine: 'COFFEE & LIGHT',
    rating: 4.7,
    area: 'Library Wing',
    deliveryEta: '8–12 min',
    menu: menuFrom([
      { name: 'Oat Flat White', price: 28000, category: 'Coffee' },
      { name: 'Cold Brew Float', price: 32000, category: 'Coffee' },
      { name: 'Smoked Salmon Bagel', price: 45000, category: 'Light meal' },
      { name: 'Truffle Croissant', price: 26000, category: 'Pastry' },
      { name: 'Berry Smoothie', price: 24000, category: 'Drinks' },
      { name: 'Basque Cheesecake', price: 30000, category: 'Dessert' },
    ]),
  },
}

export async function seedDemoData() {
  await update(tenantsRef(), SEED_TENANTS)
}

let robotTimer: ReturnType<typeof setInterval> | null = null

export function stopRobotSimulation() {
  if (robotTimer) {
    clearInterval(robotTimer)
    robotTimer = null
  }
}

/** Demo: advances progress in RTDB until delivered. Call from tenant UI after robot start. */
export function startRobotSimulation(orderId: string) {
  stopRobotSimulation()
  robotTimer = setInterval(async () => {
    const snap = await get(orderRef(orderId))
    if (!snap.exists()) return
    const o = snap.val() as Omit<Order, 'id'>
    if (o.deliveryStatus !== 'in_transit') {
      stopRobotSimulation()
      return
    }
    const prev = o.robot?.progress ?? 0
    const next = Math.min(100, prev + 7)
    const botId = o.robot?.botId ?? DEFAULT_BOT_ID
    const destination = o.robot?.destination ?? ROUTE_DEST
    if (next >= 100) {
      await patchOrder(orderId, {
        deliveryStatus: 'delivered',
        robot: {
          progress: 100,
          botId,
          destination,
          origin: ROUTE_ORIGIN,
        },
      })
      stopRobotSimulation()
      return
    }
    await patchOrder(orderId, {
      robot: {
        progress: next,
        botId,
        destination,
        origin: ROUTE_ORIGIN,
      },
    })
  }, 1100)
}
