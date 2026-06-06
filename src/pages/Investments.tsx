import { useState, useRef } from 'react'
import {
  PlusCircle, TrendingUp, CheckCircle2, Clock, Upload,
  X, Loader2, ImageIcon, Clock3, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useInvestments, useCreateInvestment, getCompactRatePercent } from '@/api/investments'
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
            {
              label: 'Rate',
              val: `${ratePercent}%`,
              sub: inv.type === 'compact' ? '/month' : '/year',
            },
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
  const amountGbp   = inv.amount_pence / 100
  const ratePercent = Number(inv.rate_percent)
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
          Your transaction is under review. We'll activate your investment within 1–2 business days.
        </div>
      </CardContent>
    </Card>
  )
}

// ─── AddInvestmentDialog ─────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { value: '12', label: '12 months' },
  { value: '18', label: '18 months' },
  { value: '24', label: '24 months (standard)' },
  { value: '36', label: '36 months' },
]

const POLICIES = [
  {
    type: 'comprehensive' as const,
    name: 'Comprehensive Policy',
    tagline: '25% annual return — principal returned at maturity',
    description: 'Fixed 25% per year. Your principal is fully returned at the end of the term.',
  },
  {
    type: 'compact' as const,
    name: 'Compact Policy',
    tagline: 'Tiered monthly returns — principal absorbed into payouts',
    description: '6–10%/month based on your investment amount. Higher amounts earn higher rates.',
  },
]

function AddInvestmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createInvestment = useCreateInvestment()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [policy, setPolicy] = useState<'comprehensive' | 'compact'>('comprehensive')
  const [amountStr, setAmountStr] = useState('')
  const [months, setMonths] = useState('24')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const amountGbp   = parseFloat(amountStr) || 0
  const amountPence = amountGbp * 100
  const ratePercent = policy === 'comprehensive' ? 25 : getCompactRatePercent(amountPence)
  const monthlyReturn = policy === 'comprehensive'
    ? (amountGbp * 0.25) / 12
    : amountGbp * ratePercent / 100
  const totalReturn = monthlyReturn * parseInt(months)

  function handleFile(selected: File) {
    if (!selected.type.startsWith('image/') && selected.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB')
      return
    }
    setFile(selected)
    if (selected.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(selected))
    } else {
      setFilePreview(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  function handleReset() {
    setPolicy('comprehensive')
    setAmountStr('')
    setMonths('24')
    setFile(null)
    setFilePreview(null)
  }

  async function handleSubmit() {
    if (!amountGbp || amountGbp < 100) {
      toast.error('Minimum investment is £100')
      return
    }
    if (!file) {
      toast.error('Please upload your transaction screenshot')
      return
    }
    try {
      await createInvestment.mutateAsync({
        type: policy,
        amountGbp,
        months: parseInt(months),
        screenshotFile: file,
      })
      toast.success('Investment request submitted', {
        description: 'We will review your transaction and activate your investment within 1–2 business days.',
      })
      handleReset()
      onClose()
    } catch (e: any) {
      toast.error('Submission failed', { description: e.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>
            Submit your investment details and proof of transaction for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-1">

          {/* Policy selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4a5d54] mb-2">Policy</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POLICIES.map(p => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => setPolicy(p.type)}
                  className={`text-left rounded-xl border-2 p-3 transition-colors ${
                    policy === p.type
                      ? 'border-[#003819] bg-[#f7f9f8]'
                      : 'border-[#e4e7e5] hover:border-[#c5cdc9]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#002c14] mb-0.5">{p.name}</p>
                  <p className="text-xs text-[#7a8a82] leading-snug">{p.tagline}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#7a8a82] mt-2 px-1">
              {POLICIES.find(p => p.type === policy)?.description}
            </p>
          </div>

          {/* Amount + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4a5d54] mb-1.5">Amount (£)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a8a82] text-sm font-medium">£</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="5,000"
                  className="w-full pl-7 pr-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5d54] mb-1.5">Duration</label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger className="rounded-full h-[42px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate preview */}
          {amountGbp >= 100 && (
            <div className="rounded-xl bg-[#f7f9f8] border border-[#e4e7e5] p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-[#7a8a82] mb-0.5">Rate</p>
                <p className="text-sm font-bold text-[#002c14]">
                  {ratePercent}%{policy === 'compact' ? '/mo' : '/yr'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#7a8a82] mb-0.5">Monthly return</p>
                <p className="text-sm font-bold text-[#0f7a3d]">£{fmt(monthlyReturn)}</p>
              </div>
              <div>
                <p className="text-xs text-[#7a8a82] mb-0.5">Total returns</p>
                <p className="text-sm font-bold text-[#002c14]">£{fmt(totalReturn)}</p>
              </div>
            </div>
          )}

          {/* Transaction screenshot upload */}
          <div>
            <label className="block text-xs font-semibold text-[#4a5d54] mb-1.5">
              Transaction screenshot
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {file ? (
              <div className="rounded-xl border border-[#e4e7e5] overflow-hidden">
                {filePreview ? (
                  <div className="relative">
                    <img
                      src={filePreview}
                      alt="Transaction screenshot"
                      className="w-full max-h-48 object-contain bg-[#f7f9f8]"
                    />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setFilePreview(null) }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-[#e4e7e5] hover:bg-red-50 text-[#7a8a82] hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ImageIcon size={16} className="text-[#4a5d54] shrink-0" />
                      <span className="text-sm text-[#002c14] truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setFilePreview(null) }}
                      className="p-1 rounded-full hover:bg-red-50 text-[#7a8a82] hover:text-red-600 shrink-0 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed cursor-pointer p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
                  dragOver
                    ? 'border-[#003819] bg-[#f7f9f8]'
                    : 'border-[#c5cdc9] hover:border-[#003819] hover:bg-[#f7f9f8]'
                }`}
              >
                <Upload size={20} className="text-[#7a8a82]" />
                <p className="text-sm font-medium text-[#002c14]">Upload transaction screenshot</p>
                <p className="text-xs text-[#7a8a82]">Drag & drop or click — JPG, PNG, PDF · max 10 MB</p>
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2.5 text-xs text-[#7a8a82] bg-[#f7f9f8] rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5 text-[#4a5d54]" />
            Your investment will be activated within 1–2 business days after we verify your transaction.
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={createInvestment.isPending}
              className="gap-1.5 flex-1"
            >
              {createInvestment.isPending && <Loader2 size={13} className="animate-spin" />}
              {createInvestment.isPending ? 'Submitting…' : 'Submit Investment'}
            </Button>
            <Button variant="ghost" onClick={() => { handleReset(); onClose() }} disabled={createInvestment.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Investments() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: investments, isLoading } = useInvestments()
  const { data: payments } = usePayments()

  // Aggregate received payments per investment
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
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
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
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
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

      <AddInvestmentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
