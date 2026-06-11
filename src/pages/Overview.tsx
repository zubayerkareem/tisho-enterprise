import { useMemo } from 'react'
import { TrendingUp, Calendar, Wallet, Clock, ArrowRight, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/AuthContext'
import { useInvestments, type InvestmentRow } from '@/api/investments'
import { usePayments, useMonthlyChartData } from '@/api/payments'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gbp(pence: number) {
  return (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function gbpWhole(pence: number) {
  return (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function monthsElapsed(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-[#7a8a82] font-medium">{label}</p>
            <p className="text-lg md:text-xl font-bold text-[#002c14] mt-0.5 truncate">{value}</p>
            {sub && <p className="text-xs text-[#7a8a82] mt-0.5 hidden sm:block">{sub}</p>}
          </div>
          <div className={`p-2 rounded-xl shrink-0 ${accent || 'bg-[#f7f9f8]'}`}>
            <Icon size={16} className="text-[#003819]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4e7e5] rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-[#7a8a82] mb-0.5">{label}</p>
        <p className="text-sm font-bold text-[#002c14]">£{payload[0].value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
      </div>
    )
  }
  return null
}

function KycBanner({ status }: { status?: string }) {
  if (status === 'approved') {
    return (
      <div className="flex items-start sm:items-center gap-3 bg-[#c3f63c]/20 border border-[#c3f63c] rounded-xl px-4 py-3">
        <CheckCircle size={16} className="text-[#0f7a3d] shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm font-medium text-[#002c14]">Your account is fully verified. KYC approved.</p>
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="flex items-start sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm font-medium text-[#002c14]">KYC verification is pending. We'll notify you once reviewed.</p>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="flex items-start sm:items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <p className="text-sm font-medium text-[#002c14]">KYC verification was rejected.</p>
          <Link to="/settings" className="text-xs text-red-600 underline">Re-apply in Settings</Link>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start sm:items-center gap-3 bg-[#f7f9f8] border border-[#e4e7e5] rounded-xl px-4 py-3">
      <Info size={16} className="text-[#7a8a82] shrink-0 mt-0.5 sm:mt-0" />
      <div>
        <p className="text-sm font-medium text-[#002c14]">KYC not submitted yet.</p>
        <Link to="/settings" className="text-xs text-[#003819] underline">Apply in Settings</Link>
      </div>
    </div>
  )
}

function InvestmentCard({ inv }: { inv: InvestmentRow }) {
  const elapsed  = monthsElapsed(inv.start_date)
  const capped   = Math.min(elapsed, inv.months_total)
  const remaining = inv.months_total - capped

  const monthlyPence = inv.rate_per_month_pence ?? (inv.rate_per_year_pence ? Math.round(inv.rate_per_year_pence / 12) : 0)

  return (
    <Card className="min-w-0">
      <CardContent className="pt-4 md:pt-5">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-[#002c14]">{inv.label}</span>
              <Badge variant="active">Active</Badge>
            </div>
            <p className="text-xs text-[#7a8a82]">
              Started {new Date(inv.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-[#002c14]">£{gbpWhole(inv.amount_pence)}</p>
            <p className="text-xs text-[#7a8a82]">Principal</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { val: `${inv.rate_percent}%`, label: inv.type === 'compact' ? '/month' : '/year' },
            { val: `£${gbpWhole(monthlyPence * capped)}`, label: 'received' },
            { val: remaining, label: 'months left' },
          ].map(s => (
            <div key={s.label} className="bg-[#f7f9f8] rounded-xl p-2.5">
              <p className="text-sm md:text-base font-bold text-[#002c14] truncate">{s.val}</p>
              <p className="text-xs text-[#7a8a82]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-[#7a8a82]">
            <span>{capped}/{inv.months_total} months</span>
            <span>{Math.round((capped / inv.months_total) * 100)}%</span>
          </div>
          <ProgressBar value={capped} max={inv.months_total} />
        </div>

        <div className="pt-3 border-t border-[#e4e7e5] flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-[#7a8a82]">Next payment</p>
            <p className="text-sm font-semibold text-[#002c14]">
              {inv.next_payment_date
                ? `${new Date(inv.next_payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · £${gbp(monthlyPence)}`
                : '—'}
            </p>
          </div>
          {inv.type === 'comprehensive' && inv.principal_return_pence > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs text-[#7a8a82]">Principal at end</p>
              <p className="text-sm font-semibold text-[#0f7a3d]">£{gbpWhole(inv.principal_return_pence)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Overview() {
  const { profile } = useAuth()
  const { data: investments = [], isLoading: loadingInv } = useInvestments()
  const { data: payments = [],   isLoading: loadingPay } = usePayments()
  const { data: chartData = [] } = useMonthlyChartData(12)

  const activeInvestments = useMemo(() => investments.filter(i => i.status === 'active'), [investments])

  const totalInvestedPence = useMemo(
    () => investments.reduce((s, i) => s + i.amount_pence, 0),
    [investments]
  )

  const totalReceivedPence = useMemo(
    () => (payments as any[]).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + p.amount_pence, 0),
    [payments]
  )

  const recentPayments = useMemo(
    () => [...(payments as any[])].slice(0, 5),
    [payments]
  )

  const nextPayment = useMemo(() => {
    const upcoming = activeInvestments
      .filter(i => i.next_payment_date)
      .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime())
    if (!upcoming.length) return null
    const date = upcoming[0].next_payment_date!
    const totalPence = upcoming
      .filter(i => i.next_payment_date === date)
      .reduce((s, i) => s + (i.rate_per_month_pence ?? (i.rate_per_year_pence ? Math.round(i.rate_per_year_pence / 12) : 0)), 0)
    return { date, totalPence }
  }, [activeInvestments])

  const loading = loadingInv || loadingPay

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#003819]" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-5 max-w-full">
      <KycBanner status={profile?.kyc_status} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={Wallet}
          label="Total Invested"
          value={`£${gbpWhole(totalInvestedPence)}`}
          sub={`Across ${activeInvestments.length} active plan${activeInvestments.length !== 1 ? 's' : ''}`}
          accent="bg-[#c3f63c]/20"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Received"
          value={`£${gbp(totalReceivedPence)}`}
          sub="All-time payouts"
        />
        <StatCard
          icon={Calendar}
          label="Next Payment"
          value={nextPayment ? new Date(nextPayment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          sub={nextPayment ? `£${gbp(nextPayment.totalPence)} expected` : undefined}
          accent="bg-emerald-50"
        />
        <StatCard
          icon={Clock}
          label="Active Plans"
          value={activeInvestments.length}
          sub="24-month term each"
        />
      </div>

      {/* Chart + Recent payments */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        <Card className="xl:col-span-2 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle>Monthly Returns Received</CardTitle>
            <p className="text-xs text-[#7a8a82] mt-0.5">Last 12 months across all investments</p>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: 200 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003819" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#003819" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7e5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#7a8a82' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#7a8a82' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="received" stroke="#003819" strokeWidth={2} fill="url(#returnGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-[#7a8a82]">No payment history yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Payments</CardTitle>
            <Link to="/payments">
              <button className="text-xs text-[#003819] px-2 gap-1 flex items-center hover:underline">
                View all <ArrowRight size={12} />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-[#7a8a82] py-4 text-center">No payments yet</p>
            ) : recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#e4e7e5] last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#002c14] truncate">
                    {p.description?.split('—')[1]?.trim() ?? p.description}
                  </p>
                  <p className="text-xs text-[#7a8a82]">
                    {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#002c14]">£{gbp(p.amount_pence)}</p>
                  <Badge variant={p.status}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Active investment cards */}
      {activeInvestments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#002c14] mb-3">Active Investments</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeInvestments.map(inv => (
              <InvestmentCard key={inv.id} inv={inv} />
            ))}
          </div>
        </div>
      )}

      {investments.length === 0 && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <TrendingUp size={32} className="text-[#7a8a82] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#002c14]">No investments yet</p>
            <p className="text-xs text-[#7a8a82] mt-1">Start your first investment to see your dashboard come to life.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
