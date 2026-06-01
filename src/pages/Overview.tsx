import { TrendingUp, Calendar, Wallet, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { mockInvestments, mockPayments, monthlyChartData } from '@/data/mockData'

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent?: string }) {
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

export function Overview() {
  const activeInvestments = mockInvestments.filter(i => i.status === 'active')
  const totalInvested = mockInvestments.reduce((s, i) => s + i.amount, 0)
  const totalReceived = mockInvestments.reduce((s, i) => s + i.totalReceived, 0)
  const recentPayments = [...mockPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-4 md:space-y-5 max-w-full">
      {/* KYC banner */}
      <div className="flex items-start sm:items-center gap-3 bg-[#c3f63c]/20 border border-[#c3f63c] rounded-xl px-4 py-3">
        <CheckCircle size={16} className="text-[#0f7a3d] shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm font-medium text-[#002c14]">Your account is fully verified. KYC approved on 28 Feb 2024.</p>
      </div>

      {/* Stat cards — 2 cols always, 4 at xl */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Wallet}   label="Total Invested"  value={`£${totalInvested.toLocaleString('en-GB')}`}  sub="Across 2 active plans" accent="bg-[#c3f63c]/20" />
        <StatCard icon={TrendingUp} label="Total Received" value={`£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`} sub="All-time payouts" />
        <StatCard icon={Calendar} label="Next Payment"    value="1 Jul 2025"    sub="£1,220.83 expected" accent="bg-emerald-50" />
        <StatCard icon={Clock}    label="Active Plans"    value={activeInvestments.length} sub="24-month term each" />
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-[#003819] px-2 gap-1 shrink-0">
              View all <ArrowRight size={12} />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#e4e7e5] last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#002c14] truncate">{p.description.split('—')[1]?.trim()}</p>
                  <p className="text-xs text-[#7a8a82]">{new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#002c14]">£{p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                  <Badge variant={p.status}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Active investment cards */}
      <div>
        <h2 className="text-sm font-semibold text-[#002c14] mb-3">Active Investments</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {activeInvestments.map(inv => {
            const remaining = inv.monthsTotal - inv.monthsElapsed
            return (
              <Card key={inv.id} className="min-w-0">
                <CardContent className="pt-4 md:pt-5">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-[#002c14]">{inv.label}</span>
                        <Badge variant="active">Active</Badge>
                      </div>
                      <p className="text-xs text-[#7a8a82]">
                        Started {new Date(inv.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#002c14]">£{inv.amount.toLocaleString('en-GB')}</p>
                      <p className="text-xs text-[#7a8a82]">Principal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { val: `${inv.ratePercent}%`, label: inv.type === 'compact' ? '/month' : '/year' },
                      { val: `£${inv.totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 0 })}`, label: 'received' },
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
                      <span>{inv.monthsElapsed}/{inv.monthsTotal} months</span>
                      <span>{Math.round((inv.monthsElapsed / inv.monthsTotal) * 100)}%</span>
                    </div>
                    <ProgressBar value={inv.monthsElapsed} max={inv.monthsTotal} />
                  </div>

                  <div className="pt-3 border-t border-[#e4e7e5] flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-[#7a8a82]">Next payment</p>
                      <p className="text-sm font-semibold text-[#002c14]">
                        {new Date(inv.nextPaymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' '}· £{(inv.ratePerMonth || inv.ratePerYear / 12).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {inv.type === 'comprehensive' && inv.principalReturn > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#7a8a82]">Principal at end</p>
                        <p className="text-sm font-semibold text-[#0f7a3d]">£{inv.principalReturn.toLocaleString('en-GB')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
