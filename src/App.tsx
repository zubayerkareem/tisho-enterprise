import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Toaster } from '@/components/ui/sonner'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Overview } from '@/pages/Overview'
import { PaymentHistory } from '@/pages/PaymentHistory'
import { Investments } from '@/pages/Investments'
import { PayoutMethods } from '@/pages/PayoutMethods'
import { Withdrawals } from '@/pages/Withdrawals'
import { Support } from '@/pages/Support'
import { Settings } from '@/pages/Settings'
import { Referral } from '@/pages/Referral'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminInvestments } from '@/pages/admin/AdminInvestments'
import { AdminPayments } from '@/pages/admin/AdminPayments'
import { AdminReferrals } from '@/pages/admin/AdminReferrals'
import { AdminSupport } from '@/pages/admin/AdminSupport'
import { AdminWithdrawals } from '@/pages/admin/AdminWithdrawals'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"      element={<Overview />} />
              <Route path="payments"       element={<PaymentHistory />} />
              <Route path="investments"    element={<Investments />} />
              <Route path="payout-methods" element={<PayoutMethods />} />
              <Route path="withdrawals"    element={<Withdrawals />} />
              <Route path="referral"       element={<Referral />} />
              <Route path="support"        element={<Support />} />
              <Route path="settings"       element={<Settings />} />
            </Route>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users"       element={<AdminUsers />} />
              <Route path="investments" element={<AdminInvestments />} />
              <Route path="payments"    element={<AdminPayments />} />
              <Route path="referrals"   element={<AdminReferrals />} />
              <Route path="support"     element={<AdminSupport />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
