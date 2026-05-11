import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import StudentLayout from './layouts/StudentLayout'
import ExplorePage from './pages/student/ExplorePage'
import OrdersPage from './pages/student/OrdersPage'
import TrackingPage from './pages/student/TrackingPage'
import ProfilePage from './pages/student/ProfilePage'
import CheckoutPage from './pages/student/CheckoutPage'
import TenantLayout from './layouts/TenantLayout'
import TenantHomePage from './pages/tenant/TenantHomePage'
import TenantOrdersPage from './pages/tenant/TenantOrdersPage'
import TenantMenuPage from './pages/tenant/TenantMenuPage'
import TenantAnalyticsPage from './pages/tenant/TenantAnalyticsPage'
import TenantSupportPage from './pages/tenant/TenantSupportPage'
import SupportChatPage from './pages/student/SupportChatPage'

function Protected({ role, children }: { role: 'student' | 'tenant'; children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--muted)]">
        Memuat…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== role) {
    return <Navigate to={profile.role === 'tenant' ? '/tenant' : '/app/explore'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <Protected role="student">
            <StudentLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="explore" replace />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/:tenantId" element={<ExplorePage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId/tracking" element={<TrackingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="support" element={<SupportChatPage />} />
        <Route path="support/:tenantId" element={<SupportChatPage />} />
      </Route>
      <Route
        path="/tenant"
        element={
          <Protected role="tenant">
            <TenantLayout />
          </Protected>
        }
      >
        <Route index element={<TenantHomePage />} />
        <Route path="orders" element={<TenantOrdersPage />} />
        <Route path="menu" element={<TenantMenuPage />} />
        <Route path="analytics" element={<TenantAnalyticsPage />} />
        <Route path="support" element={<TenantSupportPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
