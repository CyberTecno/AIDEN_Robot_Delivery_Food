export type UserRole = 'student' | 'tenant'

export interface SupportChatMessage {
  id: string
  senderRole: 'student' | 'tenant'
  senderUid: string
  senderName: string
  text: string
  createdAt: number
}

export interface SupportThreadSummary {
  studentId: string
  studentName?: string
  tenantName?: string
  lastMessage?: string
  lastAt?: number
}

export interface UserProfile {
  role: UserRole
  name: string
  email: string
  tenantId?: string
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image?: string
  active: boolean
  inStock: boolean
}

export interface Tenant {
  id: string
  name: string
  hubName: string
  cuisine: string
  rating: number
  area: string
  deliveryEta: string
  coverImage?: string
  menu?: Record<string, MenuItem>
}

export type PaymentStatus = 'pending' | 'paid'
export type KitchenStatus = 'none' | 'preparing' | 'ready'
export type DeliveryStatus = 'none' | 'in_transit' | 'delivered'

export interface OrderItemLine {
  menuItemId: string
  name: string
  qty: number
  price: number
  tags?: string[]
}

export interface JourneyEntry {
  id: string
  title: string
  detail: string
  at: number
  state: 'done' | 'active' | 'pending'
}

export interface Order {
  id: string
  studentId: string
  studentName: string
  tenantId: string
  tenantName: string
  items: OrderItemLine[]
  total: number
  createdAt: number
  paymentStatus: PaymentStatus
  kitchenStatus: KitchenStatus
  deliveryStatus: DeliveryStatus
  robot?: {
    progress: number
    botId: string
    destination: string
    origin: string
  }
}
