import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, TrendingUp, CreditCard, Gift,
  MessageSquare, ArrowUpFromLine, LogOut, X, Menu, ChevronLeft, FileCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { useAdminStats } from '@/api/admin'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  badgeKey?: string
}

const navItems: NavItem[] = [
  { to: '/admin',             icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/admin/users',       icon: Users,            label: 'Users' },
  { to: '/admin/investments', icon: TrendingUp,       label: 'Investments', badgeKey: 'pendingApprovals' },
  { to: '/admin/payments',    icon: CreditCard,       label: 'Payments' },
  { to: '/admin/referrals',   icon: Gift,             label: 'Referrals' },
  { to: '/admin/support',     icon: MessageSquare,    label: 'Support',     badgeKey: 'openSupportThreads' },
  { to: '/admin/withdrawals',   icon: ArrowUpFromLine,  label: 'Withdrawals',   badgeKey: 'pendingWithdrawals' },
  { to: '/admin/applications',  icon: FileCheck,        label: 'Applications',  badgeKey: 'pendingApplications' },
]

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const { data: stats } = useAdminStats()

  const initials = (profile?.name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  function getBadge(key?: string): number {
    if (!key || !stats) return 0
    return (stats as any)[key] ?? 0
  }

  return (
    <aside className="w-64 h-full min-h-screen flex flex-col" style={{ backgroundColor: '#003819' }}>
      {/* Logo + close */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <img
          src="/logos/logo-side-white.svg"
          alt="Tisho Enterprises"
          className="h-8 w-auto"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badgeKey }) => {
          const count = getBadge(badgeKey as string | undefined)
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-[#002c14]'
                  : 'hover:text-white'
              )}
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#c3f63c' : 'transparent',
                color: isActive ? '#002c14' : 'rgba(255,255,255,0.6)',
              })}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#c3f63c', color: '#002c14' }}
                >
                  {count}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <ChevronLeft size={18} className="shrink-0" />
          Investor View
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ backgroundColor: '#c3f63c', color: '#003819' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.name ?? 'Admin'}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={18} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#f7f9f8' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out',
        'lg:relative lg:translate-x-0 lg:flex lg:shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 shrink-0"
          style={{ backgroundColor: 'white', borderBottom: '1px solid #e4e7e5' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl transition-colors"
            style={{ color: '#4a5d54' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-base font-semibold" style={{ color: '#002c14' }}>Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
