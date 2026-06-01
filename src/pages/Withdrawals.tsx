import { PlusCircle, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mockWithdrawals, mockInvestments } from '@/data/mockData'

function WithdrawalCard({ wd }) {
  const inv = mockInvestments.find(i => i.id === wd.investmentId)
  const statusIcon = {
    pending:  <Clock size={15} className="text-[#b87333]" />,
    approved: <CheckCircle size={15} className="text-[#0f7a3d]" />,
    rejected: <XCircle size={15} className="text-[#9c2c2c]" />,
    paid:     <CheckCircle size={15} className="text-[#0f7a3d]" />,
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {statusIcon[wd.status]}
              <span className="font-semibold text-[#002c14]">
                £{wd.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
              <Badge variant={wd.status}>{wd.status}</Badge>
            </div>
            <p className="text-xs text-[#7a8a82]">
              Requested {new Date(wd.requestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {wd.resolvedDate && ` · Resolved ${new Date(wd.resolvedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
          <span className="text-xs text-[#7a8a82] bg-[#f7f9f8] px-2.5 py-1 rounded-full border border-[#e4e7e5] shrink-0 whitespace-nowrap">
            {inv?.type === 'compact' ? 'Compact' : 'Comprehensive'}
          </span>
        </div>
        <div className="bg-[#f7f9f8] rounded-xl p-3 mb-2">
          <p className="text-xs text-[#7a8a82] mb-0.5">Reason</p>
          <p className="text-sm text-[#002c14]">{wd.reason}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-[#7a8a82] flex-wrap gap-1">
          <span>Payout to: <span className="font-medium text-[#4a5d54]">{wd.payoutMethod}</span></span>
          {wd.adminNote && <span className="text-[#0f7a3d] font-medium">{wd.adminNote}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export function Withdrawals() {
  const pending  = mockWithdrawals.filter(w => w.status === 'pending')
  const resolved = mockWithdrawals.filter(w => w.status !== 'pending')

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7a8a82]">{pending.length} pending · {resolved.length} resolved</p>
        <Button size="sm" className="gap-1.5">
          <PlusCircle size={14} /> Request Withdrawal
        </Button>
      </div>

      {/* New request form */}
      <Card className="border-dashed border-2 border-[#c5cdc9]">
        <CardContent className="pt-4 md:pt-5">
          <h3 className="text-sm font-semibold text-[#002c14] mb-4">New Withdrawal Request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Investment</label>
              <select className="w-full px-3 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] text-[#4a5d54]">
                <option>Comprehensive Policy — £25,000</option>
                <option>Compact Policy — £10,000</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Amount (£)</label>
              <input type="number" placeholder="e.g. 1000" className="w-full px-3 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819]" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Payout Method</label>
            <select className="w-full px-3 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] text-[#4a5d54]">
              <option>Barclays ****4521 (Primary)</option>
              <option>HSBC ****8834</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Reason</label>
            <textarea placeholder="Describe the reason for this request..." rows={3} className="w-full px-4 py-2.5 text-sm rounded-2xl border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] resize-none" />
          </div>
          <Button size="sm" className="gap-1.5 w-full sm:w-auto">
            Submit Request <ArrowRight size={14} />
          </Button>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#7a8a82] uppercase tracking-wider mb-3">Pending</h2>
          <div className="space-y-3">{pending.map(w => <WithdrawalCard key={w.id} wd={w} />)}</div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#7a8a82] uppercase tracking-wider mb-3">Resolved</h2>
          <div className="space-y-3 opacity-80">{resolved.map(w => <WithdrawalCard key={w.id} wd={w} />)}</div>
        </section>
      )}
    </div>
  )
}
