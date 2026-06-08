import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, TrendingUp, Wallet, ArrowUpFromLine,
  Settings, MessageSquare, LogOut, ChevronRight, X, Gift, Copy, Check,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { mockUser } from '@/data/mockData'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { to: '/dashboard',      icon: LayoutDashboard,  label: 'Overview' },
  { to: '/payments',       icon: CreditCard,        label: 'Payment History' },
  { to: '/investments',    icon: TrendingUp,        label: 'My Investments' },
  { to: '/payout-methods', icon: Wallet,            label: 'Payout Methods' },
  { to: '/withdrawals',    icon: ArrowUpFromLine,   label: 'Withdrawals' },
  { to: '/referral',       icon: Gift,              label: 'Refer & Earn' },
  { to: '/support',        icon: MessageSquare,     label: 'Support' },
  { to: '/settings',       icon: Settings,          label: 'Account Settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { signOut, profile } = useAuth()
  const [copied, setCopied] = useState(false)

  const displayName  = profile?.name  || mockUser.name
  const displayEmail = profile?.email || mockUser.email
  const initials     = displayName.split(' ').map((n: string) => n[0]).join('')

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/signup?ref=${profile.referral_code}`
    : ''

  async function copyLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <aside className="w-64 h-full min-h-screen bg-accent-primary flex flex-col">
      {/* Logo + mobile close */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <img
          src="/logos/logo-side-white.svg"
          alt="Tisho Enterprises"
          className="h-8 w-auto"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-accent-soft transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent-highlight text-text-primary'
                : 'text-accent-soft hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
            {label === 'Refer & Earn' && (profile?.referral_balance_pence ?? 0) > 0 && (
              <span className="ml-auto bg-[#c3f63c] text-[#002c14] text-xs font-bold px-1.5 py-0.5 rounded-full">
                £{((profile?.referral_balance_pence ?? 0) / 100).toFixed(0)}
              </span>
            )}
          </NavLink>
        ))}

        {/* Referral link quick-copy widget */}
        {referralLink && (
          <div className="mx-1 mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold text-accent-soft uppercase tracking-wider mb-2">Your referral link</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[11px] text-accent-soft font-mono truncate opacity-75">
                {`...signup?ref=${profile?.referral_code}`}
              </span>
              <button
                onClick={copyLink}
                className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-accent-soft hover:text-white transition-colors"
                aria-label="Copy referral link"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-accent-highlight flex items-center justify-center shrink-0">
            <span className="text-accent-primary font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-accent-soft text-xs truncate">{displayEmail}</p>
          </div>
          <ChevronRight size={14} className="text-accent-soft shrink-0" />
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-accent-soft hover:bg-white/10 hover:text-white text-sm font-medium mt-1 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
