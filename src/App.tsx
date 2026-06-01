import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Toaster } from '@/components/ui/sonner'
import { Login } from '@/pages/Login'
import { Overview } from '@/pages/Overview'
import { PaymentHistory } from '@/pages/PaymentHistory'
import { Investments } from '@/pages/Investments'
import { PayoutMethods } from '@/pages/PayoutMethods'
import { Withdrawals } from '@/pages/Withdrawals'
import { Support } from '@/pages/Support'
import { Settings } from '@/pages/Settings'

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
            <Route path="/login" element={<Login />} />
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
              <Route path="support"        element={<Support />} />
              <Route path="settings"       element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
