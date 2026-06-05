import { useState } from 'react'
import { PlusCircle, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AddInvestmentModal } from '@/components/investments/AddInvestmentModal'
import { mockInvestments } from '@/data/mockData'
import type { Investment } from '@/types/models'

function InvestmentCard({ inv }: { inv: Investment }) {
  const progress = (inv.monthsElapsed / inv.monthsTotal) * 100
  const remaining = inv.monthsTotal - inv.monthsElapsed

  return (
    <Card>
      <CardContent className="pt-4 md:pt-5">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-[#002c14]">{inv.label}</span>
              <Badge variant={inv.status}>{inv.status}</Badge>
              <span className="text-xs text-[#7a8a82] bg-[#f7f9f8] px-2 py-0.5 rounded-full hidden sm:inline">
                {inv.payoutFrequency} payout
              </span>
            </div>
            <p className="text-xs text-[#7a8a82]">
              {new Date(inv.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' → '}
              {new Date(inv.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#002c14]">£{inv.amount.toLocaleString('en-GB')}</p>
            <p className="text-xs text-[#7a8a82]">principal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4">
          {[
            { label: 'Rate', val: `${inv.ratePercent}%`, sub: inv.type === 'compact' ? '/month' : '/year' },
            { label: 'Monthly Return', val: `£${(inv.ratePerMonth ?? (inv.ratePerYear ?? 0) / 12).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, sub: 'per month' },
            { label: 'Total Received', val: `£${inv.totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 0 })}`, sub: `of £${inv.totalExpected.toLocaleString('en-GB')}`, green: true },
            { label: inv.status === 'completed' ? 'Duration' : 'Remaining', val: inv.status === 'completed' ? `${inv.monthsTotal}mo` : `${remaining}mo`, sub: inv.status === 'completed' ? 'completed' : 'left' },
          ].map(s => (
            <div key={s.label} className="bg-[#f7f9f8] rounded-xl p-2.5 md:p-3">
              <p className="text-xs text-[#7a8a82] mb-0.5">{s.label}</p>
              <p className={`text-sm md:text-base font-bold truncate ${s.green ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>{s.val}</p>
              <p className="text-xs text-[#7a8a82]">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-[#7a8a82]">
            <span>Term — {inv.monthsElapsed}/{inv.monthsTotal} months</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={inv.monthsElapsed} max={inv.monthsTotal} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-[#e4e7e5] text-xs text-[#7a8a82]">
          {inv.status === 'active' && inv.nextPaymentDate && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Next: {new Date(inv.nextPaymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {inv.principalReturn > 0 && (
            <span className="flex items-center gap-1 text-[#0f7a3d]">
              <CheckCircle2 size={11} />
              {inv.status === 'completed' ? 'Principal returned' : `£${inv.principalReturn.toLocaleString('en-GB')} returned at end`}
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

export function Investments() {
  const [modalOpen, setModalOpen] = useState(false)
  const active    = mockInvestments.filter(i => i.status === 'active')
  const completed = mockInvestments.filter(i => i.status === 'completed')

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-[#4a5d54]">
            <span className="flex items-center gap-1.5"><TrendingUp size={15} className="text-[#003819]" />{active.length} active</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#7a8a82]" />{completed.length} completed</span>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
            <PlusCircle size={14} />
            <span className="hidden sm:inline">Add Investment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#002c14] mb-3 uppercase tracking-wider">Active</h2>
            <div className="space-y-4">
              {active.map(inv => <InvestmentCard key={inv.id} inv={inv} />)}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#7a8a82] mb-3 uppercase tracking-wider">Completed</h2>
            <div className="space-y-4 opacity-80">
              {completed.map(inv => <InvestmentCard key={inv.id} inv={inv} />)}
            </div>
          </section>
        )}
      </div>

      <AddInvestmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
