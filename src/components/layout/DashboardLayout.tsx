import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface PageMeta {
  title: string
  subtitle?: string
}

const pageMeta: Record<string, PageMeta> = {
  '/dashboard':      { title: 'Overview',         subtitle: 'Your investment summary at a glance' },
  '/payments':       { title: 'Payment History',  subtitle: 'All received payments and transactions' },
  '/investments':    { title: 'My Investments',   subtitle: 'Manage your active and completed investments' },
  '/payout-methods': { title: 'Payout Methods',   subtitle: 'Manage your preferred payout accounts' },
  '/withdrawals':    { title: 'Withdrawals',       subtitle: 'Request and track withdrawal payments' },
  '/support':        { title: 'Support',           subtitle: 'Get help from the Tisho Enterprises team' },
  '/settings':       { title: 'Account Settings', subtitle: 'Update your personal information and preferences' },
}

export function DashboardLayout() {
  const { pathname } = useLocation()
  const meta = pageMeta[pathname] ?? { title: 'Dashboard' }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-surface-subtle">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
