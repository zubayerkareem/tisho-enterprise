import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusCircle, TrendingUp, CheckCircle2, Clock, Loader2, Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AddInvestmentModal } from '@/components/investments/AddInvestmentModal'
import { useInvestments } from '@/api/investments'
import { toast } from 'sonner'
import type { InvestmentRow } from '@/api/investments'
import { usePayments } from '@/api/payments'

// ─── helpers ────────────────────────────────────────────────────────────────

function calcMonthsElapsed(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth())
}

function fmt(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── InvestmentCard ─────────────────────────────────────────────────────────

function InvestmentCard({ inv, totalReceivedPence }: { inv: InvestmentRow; totalReceivedPence: number }) {
  const monthsElapsed = Math.min(calcMonthsElapsed(inv.start_date), inv.months_total)
  const remaining = inv.months_total - monthsElapsed
  const progress = inv.months_total > 0 ? (monthsElapsed / inv.months_total) * 100 : 0

  const amountGbp    = inv.amount_pence / 100
  const ratePerMonth = inv.rate_per_month_pence ? inv.rate_per_month_pence / 100 : null
  const ratePerYear  = inv.rate_per_year_pence  ? inv.rate_per_year_pence  / 100 : null
  const principalReturn = inv.principal_return_pence / 100
  const totalReceived   = totalReceivedPence / 100
  const totalExpected   = ratePerMonth
    ? ratePerMonth * inv.months_total
    : ratePerYear
    ? ratePerYear * (inv.months_total / 12)
    : 0

  const ratePercent = Number(inv.rate_percent)

  return (
    <Card>
      <CardContent className="pt-4 md:pt-5">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-[#002c14]">{inv.label}</span>
              <Badge variant={inv.status as any}>{inv.status}</Badge>
              <span className="text-xs text-[#7a8a82] bg-[#f7f9f8] px-2 py-0.5 rounded-full hidden sm:inline">
                {inv.payout_frequency} payout
              </span>
            </div>
            <p className="text-xs text-[#7a8a82]">
              {new Date(inv.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' → '}
              {new Date(inv.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#002c14]">£{amountGbp.toLocaleString('en-GB')}</p>
            <p className="text-xs text-[#7a8a82]">principal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4">
          {[
            { label: 'Rate', val: `${ratePercent}%`, sub: inv.type === 'compact' ? '/month' : '/year' },
            {
              label: 'Monthly Return',
              val: ratePerMonth ? `£${fmt(ratePerMonth)}` : ratePerYear ? `£${fmt(ratePerYear / 12)}` : '—',
              sub: 'per month',
            },
            {
              label: 'Total Received',
              val: `£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 0 })}`,
              sub: `of £${totalExpected.toLocaleString('en-GB')}`,
              green: true,
            },
            {
              label: inv.status === 'completed' ? 'Duration' : 'Remaining',
              val: inv.status === 'completed' ? `${inv.months_total}mo` : `${remaining}mo`,
              sub: inv.status === 'completed' ? 'completed' : 'left',
            },
          ].map(s => (
            <div key={s.label} className="bg-[#f7f9f8] rounded-xl p-2.5 md:p-3">
              <p className="text-xs text-[#7a8a82] mb-0.5">{s.label}</p>
              <p className={`text-sm md:text-base font-bold truncate ${s.green ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>
                {s.val}
              </p>
              <p className="text-xs text-[#7a8a82]">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-[#7a8a82]">
            <span>Term — {monthsElapsed}/{inv.months_total} months</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={monthsElapsed} max={inv.months_total} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-[#e4e7e5] text-xs text-[#7a8a82]">
          {inv.status === 'active' && inv.next_payment_date && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Next: {new Date(inv.next_payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {principalReturn > 0 && (
            <span className="flex items-center gap-1 text-[#0f7a3d]">
              <CheckCircle2 size={11} />
              {inv.status === 'completed' ? 'Principal returned' : `£${principalReturn.toLocaleString('en-GB')} returned at end`}
            </span>
          )}
          {inv.type === 'compact' && (
            <span className="text-[#b87333]">Principal absorbed into payout</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── PendingCard ─────────────────────────────────────────────────────────────

function PendingCard({ inv }: { inv: InvestmentRow }) {
  const amountGbp    = inv.amount_pence / 100
  const ratePercent  = Number(inv.rate_percent)
  const ratePerMonth = inv.rate_per_month_pence ? inv.rate_per_month_pence / 100 : null
  const ratePerYear  = inv.rate_per_year_pence  ? inv.rate_per_year_pence  / 100 : null
  const monthlyReturn = ratePerMonth ?? (ratePerYear ? ratePerYear / 12 : 0)

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-[#002c14]">{inv.label}</span>
              <Badge variant="pending">pending review</Badge>
            </div>
            <p className="text-xs text-[#7a8a82]">
              Submitted {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#002c14]">£{amountGbp.toLocaleString('en-GB')}</p>
            <p className="text-xs text-[#7a8a82]">principal</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-xl p-2.5 border border-amber-100">
            <p className="text-xs text-[#7a8a82] mb-0.5">Policy</p>
            <p className="text-sm font-bold text-[#002c14] capitalize">{inv.type}</p>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-amber-100">
            <p className="text-xs text-[#7a8a82] mb-0.5">Rate</p>
            <p className="text-sm font-bold text-[#002c14]">
              {ratePercent}%{inv.type === 'compact' ? '/mo' : '/yr'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-amber-100">
            <p className="text-xs text-[#7a8a82] mb-0.5">Monthly</p>
            <p className="text-sm font-bold text-[#002c14]">£{fmt(monthlyReturn)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Clock3 size={12} className="shrink-0" />
          Your transaction is under review. We will activate your investment within 1–2 business days.
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Investments() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: investments, isLoading } = useInvestments()

  useEffect(() => {
    if (searchParams.get('stripe_success') === '1') {
      toast.success('Payment received', {
        description: 'Your Stripe payment was successful. Your investment will be activated within 1 business day.',
      })
      navigate('/investments', { replace: true })
    } else if (searchParams.get('stripe_cancelled') === '1') {
      toast.info('Payment cancelled', { description: 'Your Stripe checkout was cancelled. No charge was made.' })
      navigate('/investments', { replace: true })
    }
  }, [searchParams, navigate])
  const { data: payments } = usePayments()

  const receivedByInvestment = (payments ?? []).reduce<Record<string, number>>((acc, p) => {
    if (p.status === 'completed') {
      acc[p.investment_id] = (acc[p.investment_id] ?? 0) + p.amount_pence
    }
    return acc
  }, {})

  const active    = (investments ?? []).filter(i => i.status === 'active')
  const pending   = (investments ?? []).filter(i => i.status === 'pending')
  const completed = (investments ?? []).filter(i => i.status === 'completed')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-[#4a5d54]">
          <span className="flex items-center gap-1.5">
            <TrendingUp size={15} className="text-[#003819]" />
            {isLoading ? '…' : active.length} active
          </span>
          {pending.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#b87333]" />
              {pending.length} pending
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-[#7a8a82]" />
            {isLoading ? '…' : completed.length} completed
          </span>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Add Investment</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#7a8a82]" />
        </div>
      )}

      {!isLoading && investments?.length === 0 && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <TrendingUp size={32} className="text-[#c5cdc9] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#002c14]">No investments yet</p>
            <p className="text-xs text-[#7a8a82] mt-1 mb-4">Start growing your money with our investment policies.</p>
            <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
              <PlusCircle size={14} /> Add Investment
            </Button>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#b87333] mb-3 uppercase tracking-wider">Pending Review</h2>
          <div className="space-y-4">
            {pending.map(inv => <PendingCard key={inv.id} inv={inv} />)}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#002c14] mb-3 uppercase tracking-wider">Active</h2>
          <div className="space-y-4">
            {active.map(inv => (
              <InvestmentCard
                key={inv.id}
                inv={inv}
                totalReceivedPence={receivedByInvestment[inv.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#7a8a82] mb-3 uppercase tracking-wider">Completed</h2>
          <div className="space-y-4 opacity-80">
            {completed.map(inv => (
              <InvestmentCard
                key={inv.id}
                inv={inv}
                totalReceivedPence={receivedByInvestment[inv.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <AddInvestmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
