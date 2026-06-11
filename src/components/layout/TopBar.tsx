import { Bell, Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { mockUser } from '@/data/mockData'

interface TopBarProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const { profile } = useAuth()
  const displayName = profile?.name || mockUser.name
  const initials = displayName.split(' ').map((n: string) => n[0]).join('')

  return (
    <header className="bg-surface-base border-b border-border-default px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-surface-subtle transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-text-secondary" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-text-primary truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-text-muted mt-0.5 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          className="relative p-2 rounded-full hover:bg-surface-subtle transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-highlight rounded-full border border-white" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-text-primary leading-tight">{displayName}</p>
            <p className="text-xs text-text-muted">Investor</p>
          </div>
        </div>
      </div>
    </header>
  )
}
