import { useState } from 'react'
import { Loader2, Users, Search, ShieldOff, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAdminUsers, useSuspendUser } from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function KycBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#fff7ed', color: '#b87333' },
    approved: { bg: '#f0fdf4', color: '#0f7a3d' },
    rejected: { bg: '#fff1f2', color: '#9c2c2c' },
  }
  const s = styles[status] ?? styles.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

function UserRow({ user }: { user: any }) {
  const suspend = useSuspendUser()
  const investments = (user.investments ?? []) as any[]
  const invCount = investments.length
  const totalInvested = investments.reduce((s: number, i: any) => s + (i.amount_pence ?? 0), 0)

  const handleToggleSuspend = async () => {
    try {
      await suspend.mutateAsync({ userId: user.id, suspended: !user.suspended })
      toast.success(user.suspended ? 'User unsuspended' : 'User suspended')
    } catch {
      toast.error('Failed to update user')
    }
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 sm:gap-4"
      style={{ borderBottom: '1px solid #e4e7e5' }}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
          style={{ backgroundColor: '#003819', color: 'white' }}
        >
          {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: '#002c14' }}>{user.name}</p>
            {user.suspended && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#9c2c2c' }}>
                Suspended
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: '#7a8a82' }}>{user.email}</p>
          <p className="text-xs" style={{ color: '#7a8a82' }}>
            Joined {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
        <div className="text-center sm:text-left">
          <KycBadge status={user.kyc_status} />
        </div>
        <div className="min-w-[60px]">
          <p className="text-xs font-medium" style={{ color: '#002c14' }}>{invCount}</p>
          <p className="text-xs" style={{ color: '#7a8a82' }}>investment{invCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="min-w-[70px]">
          <p className="text-xs font-medium" style={{ color: '#002c14' }}>{fmt(totalInvested)}</p>
          <p className="text-xs" style={{ color: '#7a8a82' }}>invested</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleSuspend}
          disabled={suspend.isPending}
          className="gap-1.5 shrink-0"
          style={{
            borderColor: user.suspended ? '#0f7a3d' : '#9c2c2c',
            color: user.suspended ? '#0f7a3d' : '#9c2c2c',
            backgroundColor: 'transparent',
          }}
        >
          {suspend.isPending
            ? <Loader2 size={12} className="animate-spin" />
            : user.suspended
              ? <Shield size={12} />
              : <ShieldOff size={12} />
          }
          {user.suspended ? 'Unsuspend' : 'Suspend'}
        </Button>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers()
  const [search, setSearch] = useState('')

  const filtered = (users ?? []).filter((u: any) => {
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Users</h1>
        <p className="text-sm" style={{ color: '#7a8a82' }}>{users?.length ?? 0} total investors</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#7a8a82' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#e4e7e5',
            backgroundColor: 'white',
            color: '#002c14',
          }}
          onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #003819'}
          onBlur={e => e.currentTarget.style.boxShadow = 'none'}
        />
      </div>

      <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: '#7a8a82' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
              <p className="text-sm font-medium" style={{ color: '#002c14' }}>No users found</p>
              <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>
                {search ? 'Try a different search term' : 'No investors yet'}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((user: any) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
