import { useState } from 'react'
import { PlusCircle, Clock, CheckCircle, XCircle, ArrowRight, Loader2, Gift, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { useInvestments } from '@/api/investments'
import { usePayoutMethods } from '@/api/payoutMethods'
import { useWithdrawals, useCreateWithdrawal } from '@/api/withdrawals'

type WithdrawalSource = 'investment' | 'referral_balance'

function gbp(pence: number) {
  return (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function WithdrawalCard({ wd }: { wd: any }) {
  const statusIcon = {
    pending:      <Clock size={15} className="text-[#b87333]" />,
    under_review: <Clock size={15} className="text-[#b87333]" />,
    approved:     <CheckCircle size={15} className="text-[#0f7a3d]" />,
    rejected:     <XCircle size={15} className="text-[#9c2c2c]" />,
    paid:         <CheckCircle size={15} className="text-[#0f7a3d]" />,
  }[wd.status as string] ?? <Clock size={15} className="text-[#b87333]" />

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {statusIcon}
              <span className="font-semibold text-[#002c14]">£{gbp(wd.amount_pence)}</span>
              <Badge variant={wd.status}>{wd.status.replace('_', ' ')}</Badge>
              {wd.source === 'referral_balance' && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  <Gift size={10} /> Referral
                </span>
              )}
            </div>
            <p className="text-xs text-[#7a8a82]">
              Requested {new Date(wd.request_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {wd.resolved_date && ` · Resolved ${new Date(wd.resolved_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
        </div>
        <div className="bg-[#f7f9f8] rounded-xl p-3 mb-2">
          <p className="text-xs text-[#7a8a82] mb-0.5">Reason</p>
          <p className="text-sm text-[#002c14]">{wd.reason}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-[#7a8a82] flex-wrap gap-1">
          {wd.payout_methods?.label && (
            <span>Payout to: <span className="font-medium text-[#4a5d54]">{wd.payout_methods.label}</span></span>
          )}
          {wd.admin_note && <span className="text-[#0f7a3d] font-medium">{wd.admin_note}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export function Withdrawals() {
  const { profile } = useAuth()
  const { data: investments = [] }   = useInvestments()
  const { data: payoutMethods = [] } = usePayoutMethods()
  const { data: withdrawals = [], isLoading } = useWithdrawals()
  const createWithdrawal = useCreateWithdrawal()

  const [showForm, setShowForm] = useState(false)
  const [source, setSource] = useState<WithdrawalSource>('investment')
  const [form, setForm] = useState({
    investmentId: '',
    amount: '',
    payoutMethodId: '',
    reason: '',
  })

  const activeInvestments = (investments as any[]).filter((i: any) => i.status === 'active')
  const referralBalancePence = profile?.referral_balance_pence ?? 0

  const pending  = (withdrawals as any[]).filter((w: any) => ['pending', 'under_review'].includes(w.status))
  const resolved = (withdrawals as any[]).filter((w: any) => !['pending', 'under_review'].includes(w.status))

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountGbp = parseFloat(form.amount)
    if (!amountGbp || amountGbp <= 0) { toast.error('Enter a valid amount'); return }
    if (source === 'investment' && !form.investmentId) { toast.error('Select an investment'); return }
    if (source === 'referral_balance' && amountGbp * 100 > referralBalancePence) {
      toast.error('Amount exceeds your referral balance'); return
    }
    if (!form.reason.trim()) { toast.error('Please provide a reason'); return }

    try {
      await createWithdrawal.mutateAsync({
        source,
        investment_id: source === 'investment' ? form.investmentId : null,
        amount_pence: Math.round(amountGbp * 100),
        reason: form.reason.trim(),
        payout_method_id: form.payoutMethodId || null,
      })
      toast.success('Withdrawal request submitted')
      setForm({ investmentId: '', amount: '', payoutMethodId: '', reason: '' })
      setShowForm(false)
    } catch (e: any) {
      toast.error('Failed to submit request', { description: e.message })
    }
  }

  const selectClass = 'w-full px-3 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] text-[#4a5d54] bg-white'
  const inputClass  = 'w-full px-3 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819]'

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7a8a82]">
          {isLoading ? 'Loading…' : `${pending.length} pending · ${resolved.length} resolved`}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(v => !v)}>
          <PlusCircle size={14} /> Request Withdrawal
        </Button>
      </div>

      {/* New request form */}
      {showForm && (
        <Card className="border-dashed border-2 border-[#c5cdc9]">
          <CardContent className="pt-4 md:pt-5">
            <h3 className="text-sm font-semibold text-[#002c14] mb-4">New Withdrawal Request</h3>

            {/* Source selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {([
                { value: 'investment'       as const, label: 'Investment',       Icon: TrendingUp, desc: 'Withdraw from an active investment' },
                { value: 'referral_balance' as const, label: 'Referral Balance', Icon: Gift,       desc: `Available: £${gbp(referralBalancePence)}` },
              ]).map(({ value, label, Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 rounded-2xl border-2 text-left transition-all',
                    source === value
                      ? 'border-[#003819] bg-[#003819] text-white'
                      : 'border-[#e4e7e5] bg-white hover:border-[#003819]/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} />
                    <span className="text-xs font-semibold">{label}</span>
                  </div>
                  <span className={cn('text-xs', source === value ? 'text-[#abc6b7]' : 'text-[#7a8a82]')}>{desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3">
                {source === 'investment' && (
                  <div>
                    <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Investment</label>
                    <select value={form.investmentId} onChange={handleChange('investmentId')} className={selectClass}>
                      <option value="">Select investment…</option>
                      {activeInvestments.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.label} — £{(inv.amount_pence / 100).toLocaleString('en-GB')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {source === 'referral_balance' && (
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                      <Gift size={15} className="text-purple-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[#002c14]">
                          Referral Balance: £{gbp(referralBalancePence)}
                        </p>
                        <p className="text-xs text-[#7a8a82]">You can withdraw up to this amount</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={source === 'referral_balance' ? '' : ''}>
                  <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Amount (£)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 100"
                    value={form.amount}
                    onChange={handleChange('amount')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Payout Method</label>
                <select value={form.payoutMethodId} onChange={handleChange('payoutMethodId')} className={selectClass}>
                  <option value="">Select payout method…</option>
                  {(payoutMethods as any[]).map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.label}{m.is_primary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Reason</label>
                <textarea
                  placeholder="Describe the reason for this request…"
                  rows={3}
                  value={form.reason}
                  onChange={handleChange('reason')}
                  className="w-full px-4 py-2.5 text-sm rounded-2xl border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] resize-none"
                />
              </div>

              <Button size="sm" type="submit" disabled={createWithdrawal.isPending} className="gap-1.5 w-full sm:w-auto">
                {createWithdrawal.isPending ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={14} />}
                {createWithdrawal.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#7a8a82]" />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#7a8a82] uppercase tracking-wider mb-3">Pending</h2>
              <div className="space-y-3">{pending.map((w: any) => <WithdrawalCard key={w.id} wd={w} />)}</div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#7a8a82] uppercase tracking-wider mb-3">Resolved</h2>
              <div className="space-y-3 opacity-80">{resolved.map((w: any) => <WithdrawalCard key={w.id} wd={w} />)}</div>
            </section>
          )}

          {!isLoading && withdrawals.length === 0 && !showForm && (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-sm font-medium text-[#002c14]">No withdrawal requests yet</p>
                <p className="text-xs text-[#7a8a82] mt-1">Your requests will appear here once submitted.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
