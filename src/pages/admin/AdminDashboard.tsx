import { Loader2, Users, TrendingUp, PoundSterling, Clock, MessageSquare, ArrowUpFromLine, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  useAdminStats,
  useAdminInvestments,
  useAdminPayments,
  useApproveInvestment,
  useRejectInvestment,
} from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 leading-tight" style={{ color: '#4a5d54' }}>{label}</p>
            <p className="text-lg sm:text-2xl font-bold break-all leading-tight" style={{ color: '#002c14' }}>{value}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: color + '20' }}>
            <Icon size={16} className="sm:hidden" style={{ color }} />
            <Icon size={20} className="hidden sm:block" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PendingInvestmentRow({ inv }: { inv: any }) {
  const approve = useApproveInvestment()
  const reject = useRejectInvestment()

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(inv.id)
      toast.success('Investment approved')
    } catch {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async () => {
    try {
      await reject.mutateAsync(inv.id)
      toast.success('Investment rejected')
    } catch {
      toast.error('Failed to reject')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: '1px solid #e4e7e5' }}>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#002c14' }}>
          {(inv.profiles as any)?.name ?? 'Unknown'}
        </p>
        <p className="text-xs truncate" style={{ color: '#7a8a82' }}>
          {inv.label} · {fmt(inv.amount_pence)}
        </p>
        <p className="text-xs" style={{ color: '#7a8a82' }}>
          {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={approve.isPending || reject.isPending}
          className="gap-1 px-2 text-xs h-7"
          style={{ backgroundColor: '#003819', color: 'white' }}
        >
          {approve.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={approve.isPending || reject.isPending}
          className="gap-1 border px-2 text-xs h-7"
          style={{ borderColor: '#9c2c2c', color: '#9c2c2c', backgroundColor: 'transparent' }}
        >
          {reject.isPending ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
          Reject
        </Button>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingInvs, isLoading: invsLoading } = useAdminInvestments('pending')
  const { data: payments, isLoading: paymentsLoading } = useAdminPayments()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const upcomingPayments = (payments ?? []).filter((p: any) => p.date >= today && p.date <= sevenDaysLater).slice(0, 5)
  const bankPending = (pendingInvs ?? []).filter((i: any) => i.payment_method === 'bank').slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Dashboard</h1>

      {statsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: '#7a8a82' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Investors"     value={stats?.totalUsers ?? 0}          icon={Users}           color="#003819" />
          <StatCard label="Active Investments"  value={stats?.activeInvestments ?? 0}   icon={TrendingUp}      color="#0f7a3d" />
          <StatCard label="Total AUM"           value={fmt(stats?.totalAumPence ?? 0)}  icon={PoundSterling}   color="#003819" />
          <StatCard label="Pending Approvals"   value={stats?.pendingApprovals ?? 0}    icon={Clock}           color="#b87333" />
          <StatCard label="Open Support"        value={stats?.openSupportThreads ?? 0}  icon={MessageSquare}   color="#4a5d54" />
          <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0}  icon={ArrowUpFromLine} color="#9c2c2c" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bank Approvals */}
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#002c14' }}>
              Pending Bank Approvals
            </p>
            {invsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: '#7a8a82' }} />
              </div>
            ) : bankPending.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle size={28} className="mx-auto mb-2" style={{ color: '#0f7a3d' }} />
                <p className="text-sm" style={{ color: '#7a8a82' }}>No pending approvals</p>
              </div>
            ) : (
              <div>
                {bankPending.map((inv: any) => (
                  <PendingInvestmentRow key={inv.id} inv={inv} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#002c14' }}>
              Upcoming Payments (7 days)
            </p>
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: '#7a8a82' }} />
              </div>
            ) : upcomingPayments.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCardIcon />
                <p className="text-sm" style={{ color: '#7a8a82' }}>No upcoming payments</p>
              </div>
            ) : (
              <div>
                {upcomingPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom: '1px solid #e4e7e5' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#002c14' }}>
                        {(p.profiles as any)?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs" style={{ color: '#7a8a82' }}>
                        {(p.investments as any)?.label ?? ''} · Due {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="font-semibold text-sm shrink-0" style={{ color: '#003819' }}>
                      {fmt(p.amount_pence)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreditCardIcon() {
  return (
    <svg className="mx-auto mb-2" width={28} height={28} fill="none" stroke="#7a8a82" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}
